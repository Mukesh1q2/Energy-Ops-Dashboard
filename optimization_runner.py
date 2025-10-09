#!/usr/bin/env python3
"""
RMO Optimization Runner
Reads data from SQLite, runs optimization model, saves results back to database
"""

import sys
import json
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path

try:
    from pulp import *
except ImportError:
    print(json.dumps({"success": False, "error": "PuLP not installed. Run: pip install pulp"}))
    sys.exit(1)


class RMOOptimizer:
    def __init__(self, db_path, data_source_id):
        self.db_path = db_path
        self.data_source_id = data_source_id
        self.model_id = f"RMO_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.model_trigger_time = datetime.now()
        
    def connect_db(self):
        """Connect to SQLite database"""
        return sqlite3.connect(self.db_path)
    
    def read_data(self):
        """Read data from data source table"""
        conn = self.connect_db()
        
        try:
            # Get data source config
            cursor = conn.cursor()
            cursor.execute("""
                SELECT config FROM DataSource WHERE id = ?
            """, (self.data_source_id,))
            
            result = cursor.fetchone()
            if not result:
                raise Exception(f"Data source {self.data_source_id} not found")
            
            config = json.loads(result[0])
            table_name = config.get('tableName')
            
            if not table_name:
                raise Exception("Table name not found in data source config")
            
            # Read data from table
            query = f'SELECT * FROM "{table_name}"'
            df = pd.read_sql(query, conn)
            
            # Convert column names to lowercase for easier access
            df.columns = df.columns.str.lower()
            
            return df
            
        finally:
            conn.close()
    
    def prepare_data(self, df):
        """Prepare data for optimization"""
        # Convert numeric columns
        numeric_cols = ['damprice', 'gdamprice', 'rtmprice', 'scheduledmw', 'modelresultsmw']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Convert timeperiod to datetime if needed
        if 'timeperiod' in df.columns:
            # Excel serial date to datetime
            try:
                df['timeperiod'] = pd.to_datetime(df['timeperiod'], unit='D', origin='1899-12-30')
            except:
                df['timeperiod'] = pd.to_datetime(df['timeperiod'], errors='coerce')
        
        return df
    
    def run_optimization(self, df):
        """
        Run optimization model using PuLP
        Objective: Minimize cost while meeting demand
        """
        start_time = datetime.now()
        
        # Create model
        model = LpProblem("RMO_Optimization", LpMinimize)
        
        # Get unique plants and time blocks
        plants = df['plantname'].unique() if 'plantname' in df.columns else []
        time_blocks = df['timeblock'].unique() if 'timeblock' in df.columns else []
        
        if len(plants) == 0 or len(time_blocks) == 0:
            raise Exception("No plants or time blocks found in data")
        
        # Decision variables: generation for each plant at each time block
        gen_vars = {}
        for plant in plants:
            for tb in time_blocks:
                var_name = f"gen_{plant}_{tb}"
                gen_vars[(plant, tb)] = LpVariable(var_name, lowBound=0, cat='Continuous')
        
        # Objective function: Minimize total cost
        # Using DAM price as the cost coefficient
        obj = []
        for idx, row in df.iterrows():
            plant = row.get('plantname')
            tb = row.get('timeblock')
            price = row.get('damprice', 0)
            
            if (plant, tb) in gen_vars:
                obj.append(price * gen_vars[(plant, tb)])
        
        model += lpSum(obj), "Total_Cost"
        
        # Constraints
        # 1. Capacity constraints (if ScheduledMW represents capacity)
        for idx, row in df.iterrows():
            plant = row.get('plantname')
            tb = row.get('timeblock')
            scheduled = row.get('scheduledmw', 0)
            
            if (plant, tb) in gen_vars and scheduled > 0:
                model += gen_vars[(plant, tb)] <= scheduled * 1.2, f"Cap_{plant}_{tb}"
        
        # 2. Demand constraint (simplified - sum must meet minimum demand)
        # This is a placeholder - adjust based on actual requirements
        for tb in time_blocks:
            tb_data = df[df['timeblock'] == tb] if 'timeblock' in df.columns else df
            min_demand = tb_data['scheduledmw'].sum() if 'scheduledmw' in tb_data.columns else 0
            
            if min_demand > 0:
                model += lpSum([gen_vars[(p, tb)] for p in plants if (p, tb) in gen_vars]) >= min_demand * 0.8, f"Demand_{tb}"
        
        # Solve
        solver = PULP_CBC_CMD(msg=0)  # Silent solver
        status = model.solve(solver)
        
        # Calculate solve time
        solve_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Extract results
        results = []
        for (plant, tb), var in gen_vars.items():
            if var.varValue is not None:
                # Find original row data
                row_data = df[(df['plantname'] == plant) & (df['timeblock'] == tb)]
                if not row_data.empty:
                    row = row_data.iloc[0]
                    results.append({
                        'plant': plant,
                        'time_block': tb,
                        'optimized_mw': var.varValue,
                        'scheduled_mw': row.get('scheduledmw', 0),
                        'dam_price': row.get('damprice', 0),
                        'gdam_price': row.get('gdamprice', 0),
                        'rtm_price': row.get('rtmprice', 0),
                        'technology_type': row.get('technologytype', ''),
                        'region': row.get('region', ''),
                        'state': row.get('state', ''),
                        'contract_type': row.get('contracttype', ''),
                        'contract_name': row.get('contractname', ''),
                        'time_period': row.get('timeperiod', datetime.now())
                    })
        
        return {
            'status': 'success' if status == LpStatusOptimal else 'failed',
            'objective_value': value(model.objective) if status == LpStatusOptimal else None,
            'solve_time_ms': solve_time_ms,
            'results': results
        }
    
    def save_results(self, optimization_result):
        """Save optimization results to database"""
        conn = self.connect_db()
        cursor = conn.cursor()
        
        try:
            for result in optimization_result['results']:
                cursor.execute("""
                    INSERT INTO OptimizationResult (
                        id, data_source_id, model_id, model_trigger_time,
                        time_period, time_block, technology_type, region, state,
                        contract_type, plant_name, contract_name,
                        dam_price, gdam_price, rtm_price,
                        scheduled_mw, model_results_mw,
                        optimization_status, solver_time_ms, objective_value,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"opt_{self.model_id}_{result['plant']}_{result['time_block']}",
                    self.data_source_id,
                    self.model_id,
                    self.model_trigger_time,
                    result['time_period'],
                    result['time_block'],
                    result['technology_type'],
                    result['region'],
                    result['state'],
                    result['contract_type'],
                    result['plant'],
                    result['contract_name'],
                    result['dam_price'],
                    result['gdam_price'],
                    result['rtm_price'],
                    result['scheduled_mw'],
                    result['optimized_mw'],
                    optimization_result['status'],
                    optimization_result['solve_time_ms'],
                    optimization_result['objective_value'],
                    datetime.now()
                ))
            
            conn.commit()
            return True
            
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    def run(self):
        """Main execution flow"""
        try:
            # Read data
            df = self.read_data()
            
            # Prepare data
            df = self.prepare_data(df)
            
            # Run optimization
            result = self.run_optimization(df)
            
            # Save results
            self.save_results(result)
            
            return {
                'success': True,
                'model_id': self.model_id,
                'status': result['status'],
                'objective_value': result['objective_value'],
                'solve_time_ms': result['solve_time_ms'],
                'results_count': len(result['results'])
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'model_id': self.model_id
            }


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python optimization_runner.py <db_path> <data_source_id>'
        }))
        sys.exit(1)
    
    db_path = sys.argv[1]
    data_source_id = sys.argv[2]
    
    optimizer = RMOOptimizer(db_path, data_source_id)
    result = optimizer.run()
    
    print(json.dumps(result, default=str))

#!/usr/bin/env python3
"""
Energy Ops Dashboard - Optimization Model Integration
Real-Time Market (RMO) Optimization Engine

This script:
1. Connects to the Energy Ops Dashboard system
2. Fetches market data from the database
3. Runs optimization model
4. Logs results back to the system
5. Calculates and validates accuracy metrics
"""

import os
import sys
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('optimization_model.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('OptimizationModel')

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000/api')
DB_PATH = os.getenv('DB_PATH', './prisma/dev.db')
MODEL_ID = f"RMO_{datetime.now().strftime('%Y%m%d_%H%M%S')}"


class OptimizationModel:
    """RMO Optimization Model"""
    
    def __init__(self):
        self.model_id = MODEL_ID
        self.api_base = API_BASE_URL
        self.db_path = DB_PATH
        self.results = []
        logger.info(f"Initialized Optimization Model: {self.model_id}")
    
    def connect_to_database(self) -> sqlite3.Connection:
        """Connect to SQLite database"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            logger.info(f"Connected to database: {self.db_path}")
            return conn
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise
    
    def fetch_market_data(self, conn: sqlite3.Connection, hours: int = 24) -> List[Dict]:
        """Fetch recent market data from database"""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            query = """
                SELECT 
                    id, time_period, region, state, technology_type,
                    plant_name, contract_type, generation_mw, 
                    capacity_mw, demand_mw, price_rs_per_mwh
                FROM ElectricityData
                WHERE time_period >= ?
                ORDER BY time_period DESC
            """
            cursor = conn.execute(query, (cutoff_time.isoformat(),))
            data = [dict(row) for row in cursor.fetchall()]
            logger.info(f"Fetched {len(data)} records from database")
            return data
        except Exception as e:
            logger.error(f"Failed to fetch market data: {str(e)}")
            return []
    
    def run_optimization(self, market_data: List[Dict]) -> List[Dict]:
        """
        Run optimization algorithm
        
        This is a simplified example. In production, this would:
        - Use linear programming (scipy.optimize, CVXPY, Pyomo, etc.)
        - Consider constraints (capacity, ramping, contracts)
        - Minimize cost or maximize profit
        - Handle uncertainty with stochastic methods
        """
        logger.info("Running optimization algorithm...")
        
        optimized_results = []
        
        for record in market_data:
            try:
                # Extract values
                demand = record.get('demand_mw', 0) or 0
                capacity = record.get('capacity_mw', 0) or 0
                current_gen = record.get('generation_mw', 0) or 0
                price = record.get('price_rs_per_mwh', 0) or 0
                
                # Simple optimization logic:
                # 1. If price is high and capacity available, increase generation
                # 2. If price is low, reduce to minimum safe level
                # 3. Respect capacity constraints
                
                avg_price = 4500  # Assumed average market price
                optimal_gen = current_gen
                
                if price > avg_price * 1.1 and capacity > current_gen:
                    # Price is high - increase generation
                    optimal_gen = min(capacity * 0.95, demand * 1.05)
                elif price < avg_price * 0.9:
                    # Price is low - reduce generation
                    optimal_gen = max(capacity * 0.3, demand * 0.8)
                else:
                    # Price is normal - match demand
                    optimal_gen = min(capacity * 0.85, demand)
                
                # Calculate metrics
                improvement = optimal_gen - current_gen
                revenue_impact = improvement * price
                accuracy_score = 100 - abs((optimal_gen - demand) / demand * 100) if demand > 0 else 95
                
                result = {
                    'record_id': record['id'],
                    'time_period': record['time_period'],
                    'plant_name': record['plant_name'],
                    'current_generation_mw': current_gen,
                    'optimal_generation_mw': round(optimal_gen, 2),
                    'improvement_mw': round(improvement, 2),
                    'price_rs_per_mwh': price,
                    'revenue_impact_rs': round(revenue_impact, 2),
                    'accuracy_score': round(accuracy_score, 2),
                    'model_id': self.model_id,
                    'timestamp': datetime.now().isoformat()
                }
                
                optimized_results.append(result)
                
            except Exception as e:
                logger.warning(f"Optimization failed for record {record.get('id')}: {str(e)}")
                continue
        
        logger.info(f"Optimization complete. Generated {len(optimized_results)} results")
        return optimized_results
    
    def calculate_accuracy_metrics(self, results: List[Dict]) -> Dict:
        """Calculate overall model accuracy metrics"""
        if not results:
            return {}
        
        accuracy_scores = [r['accuracy_score'] for r in results]
        revenue_impacts = [r['revenue_impact_rs'] for r in results]
        improvements = [r['improvement_mw'] for r in results]
        
        metrics = {
            'model_id': self.model_id,
            'total_records': len(results),
            'avg_accuracy': round(sum(accuracy_scores) / len(accuracy_scores), 2),
            'min_accuracy': round(min(accuracy_scores), 2),
            'max_accuracy': round(max(accuracy_scores), 2),
            'total_revenue_impact': round(sum(revenue_impacts), 2),
            'avg_improvement_mw': round(sum(improvements) / len(improvements), 2),
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info(f"Accuracy Metrics - Avg: {metrics['avg_accuracy']}%, Range: {metrics['min_accuracy']}-{metrics['max_accuracy']}%")
        logger.info(f"Revenue Impact: ₹{metrics['total_revenue_impact']:,.2f}")
        
        return metrics
    
    def log_to_system(self, activity_type: str, title: str, description: str, metadata: Dict) -> bool:
        """Log activity to the dashboard system"""
        try:
            endpoint = f"{self.api_base}/optimization/trigger"
            payload = {
                'type': activity_type,
                'title': title,
                'description': description,
                'metadata': metadata
            }
            
            response = requests.post(endpoint, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info(f"Successfully logged to system: {title}")
                return True
            else:
                logger.warning(f"Failed to log to system: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error logging to system: {str(e)}")
            return False
    
    def save_results_to_db(self, conn: sqlite3.Connection, results: List[Dict]) -> bool:
        """Save optimization results back to database"""
        try:
            # Create results table if not exists
            conn.execute("""
                CREATE TABLE IF NOT EXISTS OptimizationResults (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    record_id TEXT,
                    time_period TEXT,
                    plant_name TEXT,
                    current_generation_mw REAL,
                    optimal_generation_mw REAL,
                    improvement_mw REAL,
                    price_rs_per_mwh REAL,
                    revenue_impact_rs REAL,
                    accuracy_score REAL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert results
            for result in results:
                conn.execute("""
                    INSERT INTO OptimizationResults 
                    (model_id, record_id, time_period, plant_name, current_generation_mw, 
                     optimal_generation_mw, improvement_mw, price_rs_per_mwh, 
                     revenue_impact_rs, accuracy_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    result['model_id'],
                    result['record_id'],
                    result['time_period'],
                    result['plant_name'],
                    result['current_generation_mw'],
                    result['optimal_generation_mw'],
                    result['improvement_mw'],
                    result['price_rs_per_mwh'],
                    result['revenue_impact_rs'],
                    result['accuracy_score']
                ))
            
            conn.commit()
            logger.info(f"Saved {len(results)} optimization results to database")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save results to database: {str(e)}")
            return False
    
    def run(self):
        """Main execution flow"""
        logger.info("=" * 60)
        logger.info("Starting Optimization Model Execution")
        logger.info("=" * 60)
        
        try:
            # Step 1: Connect to database
            conn = self.connect_to_database()
            
            # Step 2: Fetch market data
            logger.info("Step 1: Fetching market data...")
            market_data = self.fetch_market_data(conn, hours=24)
            
            if not market_data:
                logger.warning("No market data found. Exiting.")
                return
            
            # Step 3: Run optimization
            logger.info("Step 2: Running optimization algorithm...")
            results = self.run_optimization(market_data[:100])  # Process last 100 records
            
            # Step 4: Calculate accuracy metrics
            logger.info("Step 3: Calculating accuracy metrics...")
            metrics = self.calculate_accuracy_metrics(results)
            
            # Step 5: Save results to database
            logger.info("Step 4: Saving results to database...")
            self.save_results_to_db(conn, results)
            
            # Step 6: Log to system
            logger.info("Step 5: Logging to dashboard system...")
            self.log_to_system(
                activity_type='optimization',
                title=f'Optimization Model Executed: {self.model_id}',
                description=f"Processed {len(results)} records with {metrics['avg_accuracy']}% accuracy",
                metadata=metrics
            )
            
            # Step 7: Generate summary report
            logger.info("=" * 60)
            logger.info("EXECUTION SUMMARY")
            logger.info("=" * 60)
            logger.info(f"Model ID: {self.model_id}")
            logger.info(f"Records Processed: {len(results)}")
            logger.info(f"Average Accuracy: {metrics['avg_accuracy']}%")
            logger.info(f"Total Revenue Impact: ₹{metrics['total_revenue_impact']:,.2f}")
            logger.info(f"Average Improvement: {metrics['avg_improvement_mw']:.2f} MW")
            logger.info("=" * 60)
            
            # Close database connection
            conn.close()
            
            logger.info("Optimization model execution completed successfully!")
            return metrics
            
        except Exception as e:
            logger.error(f"Optimization model execution failed: {str(e)}")
            raise


def main():
    """Entry point"""
    try:
        model = OptimizationModel()
        results = model.run()
        
        # Save summary to JSON file
        summary_file = f"optimization_summary_{MODEL_ID}.json"
        with open(summary_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Summary saved to: {summary_file}")
        
        return 0
        
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

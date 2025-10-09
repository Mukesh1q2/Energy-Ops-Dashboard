-- Performance Indexes Migration
-- Add critical indexes for frequently queried columns

-- MarketSnapshotData indexes (timeblock queries are very common)
CREATE INDEX IF NOT EXISTS idx_market_snapshot_timeblock 
  ON MarketSnapshotData(timeblock, time_period);

CREATE INDEX IF NOT EXISTS idx_market_snapshot_time_period 
  ON MarketSnapshotData(time_period DESC);

CREATE INDEX IF NOT EXISTS idx_market_snapshot_data_source 
  ON MarketSnapshotData(data_source_id, time_period);

CREATE INDEX IF NOT EXISTS idx_market_snapshot_state_plant 
  ON MarketSnapshotData(state, plant_name);

-- DataSource indexes (status and lookup queries)
CREATE INDEX IF NOT EXISTS idx_data_source_status_updated 
  ON DataSource(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_source_type_created 
  ON DataSource(type, created_at DESC);

-- DataSourceColumn indexes (filter and column queries)
CREATE INDEX IF NOT EXISTS idx_data_source_column_source_name 
  ON DataSourceColumn(data_source_id, column_name);

CREATE INDEX IF NOT EXISTS idx_data_source_column_filter 
  ON DataSourceColumn(expose_as_filter, data_source_id);

-- DashboardChart indexes (dashboard rendering)
CREATE INDEX IF NOT EXISTS idx_dashboard_chart_dashboard_source 
  ON DashboardChart(dashboard_id, data_source_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_chart_created 
  ON DashboardChart(created_at DESC);

-- OptimizationModel indexes (model management)
CREATE INDEX IF NOT EXISTS idx_optimization_model_type_status 
  ON OptimizationModel(model_type, status);

CREATE INDEX IF NOT EXISTS idx_optimization_model_uploaded 
  ON OptimizationModel(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_model_last_used 
  ON OptimizationModel(last_used_at DESC);

-- JobRun indexes (execution tracking and logs)
CREATE INDEX IF NOT EXISTS idx_job_run_model_type_status 
  ON JobRun(model_type, status);

CREATE INDEX IF NOT EXISTS idx_job_run_data_source_started 
  ON JobRun(data_source_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_run_status_started 
  ON JobRun(status, started_at DESC);

-- JobLog indexes (log queries by job)
CREATE INDEX IF NOT EXISTS idx_job_log_job_timestamp 
  ON JobLog(job_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_job_log_level_timestamp 
  ON JobLog(level, timestamp DESC);

-- TestScript indexes (sandbox operations)
CREATE INDEX IF NOT EXISTS idx_test_script_status_uploaded 
  ON TestScript(status, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_script_last_run 
  ON TestScript(last_run_at DESC);

-- TestScriptExecution indexes (execution tracking)
CREATE INDEX IF NOT EXISTS idx_test_script_execution_script_started 
  ON TestScriptExecution(script_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_script_execution_status_started 
  ON TestScriptExecution(status, started_at DESC);

-- TestScriptLog indexes (script log queries)
CREATE INDEX IF NOT EXISTS idx_test_script_log_execution_timestamp 
  ON TestScriptLog(execution_id, timestamp DESC);

-- Activity indexes (audit and activity tracking)
CREATE INDEX IF NOT EXISTS idx_activity_type_created 
  ON Activity(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_user_created 
  ON Activity(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_entity_created 
  ON Activity(entity_type, entity_id, created_at DESC);

-- Notification indexes (user notifications)
CREATE INDEX IF NOT EXISTS idx_notification_user_read_created 
  ON Notification(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_severity_created 
  ON Notification(severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_category_created 
  ON Notification(category, created_at DESC);

-- DMO specific table indexes (if they have data)
-- Generator Scheduling
CREATE INDEX IF NOT EXISTS idx_dmo_generator_time_plant 
  ON DMOGeneratorScheduling(time_period, plant_id);

CREATE INDEX IF NOT EXISTS idx_dmo_generator_technology_time 
  ON DMOGeneratorScheduling(technology_type, time_period DESC);

-- Contract Scheduling  
CREATE INDEX IF NOT EXISTS idx_dmo_contract_time_contract 
  ON DMOContractScheduling(time_period, contract_name);

CREATE INDEX IF NOT EXISTS idx_dmo_contract_type_time 
  ON DMOContractScheduling(contract_type, time_period DESC);

-- Market Bidding
CREATE INDEX IF NOT EXISTS idx_dmo_bidding_time_market 
  ON DMOMarketBidding(time_period, market_type);

CREATE INDEX IF NOT EXISTS idx_dmo_bidding_plant_time 
  ON DMOMarketBidding(plant_id, time_period DESC);

-- Electricity Data (general energy data)
CREATE INDEX IF NOT EXISTS idx_electricity_data_time_region 
  ON ElectricityData(time_period, region, state);

CREATE INDEX IF NOT EXISTS idx_electricity_data_technology 
  ON ElectricityData(technology_type, time_period DESC);

CREATE INDEX IF NOT EXISTS idx_electricity_data_contract 
  ON ElectricityData(contract_name, time_period DESC);

-- OptimizationResult indexes (optimization tracking)
CREATE INDEX IF NOT EXISTS idx_optimization_result_data_source_time 
  ON OptimizationResult(data_source_id, time_period DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_result_model_time 
  ON OptimizationResult(model_id, time_period DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_result_status_time 
  ON OptimizationResult(optimization_status, time_period DESC);

CREATE INDEX IF NOT EXISTS idx_optimization_result_time_block 
  ON OptimizationResult(time_period, time_block);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_market_snapshot_composite 
  ON MarketSnapshotData(time_period, timeblock, state, plant_name);

CREATE INDEX IF NOT EXISTS idx_activity_composite 
  ON Activity(type, status, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_run_composite 
  ON JobRun(model_type, status, data_source_id, started_at DESC);

-- Add ANALYZE to update statistics after creating indexes
ANALYZE;
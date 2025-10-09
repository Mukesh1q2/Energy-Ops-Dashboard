// src/lib/optimization-executor.ts
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/db';

export interface ExecutionOptions {
  modelId: string;
  modelType: 'DMO' | 'RMO' | 'SO';
  dataSourceId: string;
  triggeredBy?: string;
  modelConfig?: Record<string, any>;
}

export interface ExecutionResult {
  jobId: string;
  status: 'success' | 'failed';
  resultsCount?: number;
  objectiveValue?: number;
  solverTimeMs?: number;
  errorMessage?: string;
  logFilePath: string;
}

export class OptimizationExecutor {
  private io: SocketIOServer;
  private logDir: string;
  private modelsDir: string;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.logDir = path.join(process.cwd(), 'logs', 'optimization');
    this.modelsDir = path.join(process.cwd(), 'server', 'models', 'optimization');
  }

  /**
   * Execute an optimization model
   */
  async executeModel(options: ExecutionOptions): Promise<ExecutionResult> {
    const { modelId, modelType, dataSourceId, triggeredBy = 'manual', modelConfig } = options;
    
    // Generate unique job ID
    const jobId = `${modelType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(this.logDir, `${modelType}_${timestamp}.log`);

    try {
      // Fetch model from database
      const model = await prisma.optimizationModel.findUnique({
        where: { id: modelId }
      });

      if (!model) {
        throw new Error(`Model ${modelId} not found`);
      }

      if (model.status !== 'active') {
        throw new Error(`Model ${model.model_name} is not active`);
      }

      // Create job run record
      const jobRun = await prisma.jobRun.create({
        data: {
          job_id: jobId,
          model_type: modelType,
          model_id: modelId,
          data_source_id: dataSourceId,
          status: 'running',
          progress: 0,
          triggered_by: triggeredBy,
          model_config: modelConfig || {},
          log_file_path: logFilePath,
          started_at: new Date()
        }
      });

      // Emit job started event
      this.io.emit('optimization:started', {
        jobId,
        modelType,
        modelName: model.model_name,
        timestamp: new Date()
      });

      // Log initial message
      await this.logMessage(jobId, 'INFO', `Starting ${modelType} optimization model: ${model.model_name}`);

      // Execute Python script
      const result = await this.runPythonScript(
        model.file_path,
        jobId,
        modelType,
        logFilePath,
        modelConfig
      );

      // Update job run with results
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: result.status,
          progress: 100,
          completed_at: new Date(),
          results_count: result.resultsCount,
          objective_value: result.objectiveValue,
          solver_time_ms: result.solverTimeMs,
          error_message: result.errorMessage
        }
      });

      // Update model last used timestamp
      await prisma.optimizationModel.update({
        where: { id: modelId },
        data: { last_used_at: new Date() }
      });

      // Emit completion event
      this.io.emit('optimization:completed', {
        jobId,
        modelType,
        status: result.status,
        timestamp: new Date()
      });

      await this.logMessage(
        jobId,
        result.status === 'success' ? 'INFO' : 'ERROR',
        `${modelType} optimization ${result.status}: ${result.errorMessage || 'Completed successfully'}`
      );

      return {
        jobId,
        ...result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logMessage(jobId, 'ERROR', `Execution failed: ${errorMessage}`);
      
      // Update job run with error
      const existingJob = await prisma.jobRun.findUnique({
        where: { job_id: jobId }
      });

      if (existingJob) {
        await prisma.jobRun.update({
          where: { id: existingJob.id },
          data: {
            status: 'failed',
            completed_at: new Date(),
            error_message: errorMessage
          }
        });
      }

      this.io.emit('optimization:failed', {
        jobId,
        modelType,
        error: errorMessage,
        timestamp: new Date()
      });

      return {
        jobId,
        status: 'failed',
        errorMessage,
        logFilePath
      };
    }
  }

  /**
   * Run Python script with subprocess
   */
  private async runPythonScript(
    scriptPath: string,
    jobId: string,
    modelType: string,
    logFilePath: string,
    config?: Record<string, any>
  ): Promise<Omit<ExecutionResult, 'jobId'>> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      let resultsCount = 0;
      let objectiveValue: number | undefined;
      let stdoutBuffer = '';
      let stderrBuffer = '';

      // Create log file stream
      const logStream = await fs.open(logFilePath, 'w');

      // Prepare environment variables
      const env = {
        ...process.env,
        JOB_ID: jobId,
        MODEL_TYPE: modelType,
        CONFIG: config ? JSON.stringify(config) : '{}'
      };

      // Spawn Python process
      const pythonProcess = spawn('python', [scriptPath], {
        env,
        cwd: path.dirname(scriptPath)
      });

      // Handle stdout
      pythonProcess.stdout.on('data', async (data) => {
        const message = data.toString();
        stdoutBuffer += message;

        // Write to log file
        await logStream.write(message);

        // Parse and emit log messages
        const lines = message.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          await this.logMessage(jobId, 'INFO', line);
          
          // Emit real-time log via Socket.IO
          this.io.emit('optimization:log', {
            jobId,
            modelType,
            level: 'INFO',
            message: line,
            timestamp: new Date()
          });

          // Try to parse metadata from logs
          if (line.includes('Results written:')) {
            const match = line.match(/Results written:\s*(\d+)/);
            if (match) resultsCount = parseInt(match[1]);
          }
          if (line.includes('Objective value:')) {
            const match = line.match(/Objective value:\s*([\d.]+)/);
            if (match) objectiveValue = parseFloat(match[1]);
          }
        }
      });

      // Handle stderr
      pythonProcess.stderr.on('data', async (data) => {
        const message = data.toString();
        stderrBuffer += message;

        // Write to log file
        await logStream.write(`[ERROR] ${message}`);

        // Emit error log
        const lines = message.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          await this.logMessage(jobId, 'ERROR', line);
          
          this.io.emit('optimization:log', {
            jobId,
            modelType,
            level: 'ERROR',
            message: line,
            timestamp: new Date()
          });
        }
      });

      // Handle process completion
      pythonProcess.on('close', async (code) => {
        await logStream.close();
        const solverTimeMs = Date.now() - startTime;

        if (code === 0) {
          resolve({
            status: 'success',
            resultsCount,
            objectiveValue,
            solverTimeMs,
            logFilePath
          });
        } else {
          resolve({
            status: 'failed',
            errorMessage: `Process exited with code ${code}: ${stderrBuffer || 'Unknown error'}`,
            solverTimeMs,
            logFilePath
          });
        }
      });

      // Handle process errors
      pythonProcess.on('error', async (error) => {
        await logStream.close();
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Log message to database
   */
  private async logMessage(jobId: string, level: string, message: string): Promise<void> {
    try {
      await prisma.jobLog.create({
        data: {
          job_id: jobId,
          level,
          message: message.substring(0, 5000), // Truncate very long messages
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to log message:', error);
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string) {
    return await prisma.jobRun.findUnique({
      where: { job_id: jobId },
      include: {
        logs: {
          orderBy: { timestamp: 'asc' },
          take: 100 // Last 100 logs
        },
        optimizationModel: {
          select: {
            model_name: true,
            model_type: true
          }
        }
      }
    });
  }

  /**
   * Get logs for a job
   */
  async getJobLogs(jobId: string, limit: number = 100) {
    return await prisma.jobLog.findMany({
      where: { job_id: jobId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  /**
   * Read log file content
   */
  async readLogFile(logFilePath: string): Promise<string> {
    try {
      return await fs.readFile(logFilePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read log file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

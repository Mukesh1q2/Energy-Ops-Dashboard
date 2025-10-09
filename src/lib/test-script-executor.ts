// src/lib/test-script-executor.ts
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { db } from '@/lib/db';

export interface TestExecutionOptions {
  scriptId: string;
  args?: string[];
}

export interface TestExecutionResult {
  executionId: string;
  status: 'completed' | 'failed';
  exitCode: number;
  outputLines: number;
  runtimeMs: number;
  errorMessage?: string;
  logFilePath: string;
}

export class TestScriptExecutor {
  private io: SocketIOServer;
  private logDir: string;
  private scriptsDir: string;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.logDir = path.join(process.cwd(), 'sandbox', 'logs');
    this.scriptsDir = path.join(process.cwd(), 'sandbox', 'uploads', 'test_scripts');
  }

  async executeScript(options: TestExecutionOptions): Promise<TestExecutionResult> {
    const { scriptId, args = [] } = options;
    
    // Fetch script from database
    const script = await db.testScript.findUnique({
      where: { id: scriptId }
    });

    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    // Generate execution ID
    const executionId = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFilePath = path.join(this.logDir, `test_${timestamp}.log`);

    const startTime = Date.now();

    // Create execution record
    const execution = await db.testScriptExecution.create({
      data: {
        execution_id: executionId,
        script_id: scriptId,
        status: 'running',
        log_file_path: logFilePath,
        started_at: new Date()
      }
    });

    // Emit started event
    this.io.emit('test-script:started', {
      executionId,
      scriptName: script.script_name,
      timestamp: new Date()
    });

    // Execute script
    try {
      const result = await this.runPythonScript(
        script.file_path,
        executionId,
        logFilePath,
        args
      );

      const runtimeMs = Date.now() - startTime;

      // Update execution record
      await db.testScriptExecution.update({
        where: { id: execution.id },
        data: {
          status: result.exitCode === 0 ? 'completed' : 'failed',
          completed_at: new Date(),
          exit_code: result.exitCode,
          output_lines: result.outputLines,
          runtime_ms: runtimeMs,
          error_message: result.errorMessage
        }
      });

      // Update script last run
      await db.testScript.update({
        where: { id: scriptId },
        data: {
          last_run_at: new Date(),
          total_runs: { increment: 1 }
        }
      });

      // Emit completed event
      this.io.emit('script:complete', {
        executionId,
        status: result.exitCode === 0 ? 'completed' : 'failed',
        exitCode: result.exitCode,
        timestamp: new Date()
      });

      return {
        executionId,
        status: result.exitCode === 0 ? 'completed' : 'failed',
        exitCode: result.exitCode,
        outputLines: result.outputLines,
        runtimeMs,
        errorMessage: result.errorMessage,
        logFilePath
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await db.testScriptExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completed_at: new Date(),
          error_message: errorMessage
        }
      });

      this.io.emit('script:error', {
        executionId,
        error: errorMessage,
        timestamp: new Date()
      });

      throw error;
    }
  }

  private async runPythonScript(
    scriptPath: string,
    executionId: string,
    logFilePath: string,
    args: string[]
  ): Promise<{ exitCode: number; outputLines: number; errorMessage?: string }> {
    return new Promise(async (resolve) => {
      let lineNumber = 0;
      let errorMessage: string | undefined;

      // Create log file stream
      const logStream = await fs.open(logFilePath, 'w');

      // Spawn Python process
      // Choose Python command cross-platform
      const pythonCmd = process.env.PYTHON
        ? process.env.PYTHON
        : (process.platform === 'win32' ? 'py' : 'python3')

      const pythonArgs = process.platform === 'win32' && pythonCmd === 'py'
        ? ['-3', scriptPath, ...args]
        : [scriptPath, ...args]

      const pythonProcess = spawn(pythonCmd, pythonArgs, {
        cwd: path.dirname(scriptPath)
      });

      // Handle process error (e.g., python not found)
      pythonProcess.on('error', async (err) => {
        const msg = `Failed to start Python process: ${err?.message || err}`
        await logStream.write(`[ERROR] ${msg}\n`)
        await db.testScriptExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            completed_at: new Date(),
            exit_code: -1,
            error_message: msg
          }
        })
        
        this.io.emit('script:error', {
          executionId,
          error: msg,
          timestamp: new Date()
        })
      })

      // Handle stdout
      pythonProcess.stdout.on('data', async (data) => {
        const message = data.toString();
        await logStream.write(message);

        const lines = message.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          lineNumber++;
          
          // Determine log level
          const logLevel = line.toLowerCase().includes('error') ? 'error' :
                          line.toLowerCase().includes('warning') ? 'warning' :
                          'stdout';

          // Save to database
          await db.testScriptLog.create({
            data: {
              execution_id: executionId,
              line_number: lineNumber,
              log_level: logLevel,
              message: line,
              timestamp: new Date()
            }
          });

      // Emit real-time log
      this.io.emit('script:log', {
        executionId,
        lineNumber,
        logLevel,
        message: line,
        timestamp: new Date()
      });
        }
      });

      // Handle stderr
      pythonProcess.stderr.on('data', async (data) => {
        const message = data.toString();
        errorMessage = message;
        await logStream.write(`[ERROR] ${message}`);

        const lines = message.split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          lineNumber++;
          
          await db.testScriptLog.create({
            data: {
              execution_id: executionId,
              line_number: lineNumber,
              log_level: 'stderr',
              message: line,
              timestamp: new Date()
            }
          });

          this.io.emit('script:log', {
            executionId,
            lineNumber,
            logLevel: 'stderr',
            message: line,
            timestamp: new Date()
          });
        }
      });

      // Handle process completion
      pythonProcess.on('close', async (code) => {
        await logStream.close();
        resolve({
          exitCode: code || 0,
          outputLines: lineNumber,
          errorMessage
        });
      });
    });
  }

  async getExecutionLogs(executionId: string) {
    return await db.testScriptLog.findMany({
      where: { execution_id: executionId },
      orderBy: { line_number: 'asc' }
    });
  }

  async getExecutionStatus(executionId: string) {
    return await db.testScriptExecution.findUnique({
      where: { execution_id: executionId },
      include: {
        testScript: {
          select: {
            script_name: true,
            original_filename: true
          }
        },
        logs: {
          orderBy: { line_number: 'asc' },
          take: 100
        }
      }
    });
  }
}

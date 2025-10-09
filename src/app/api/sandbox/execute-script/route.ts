import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { getIo } from '@/lib/socket';
import { withUserAuth, logActivity, type AuthenticatedRequest } from '@/lib/with-auth';
import { sandboxManager, type SandboxConfig } from '@/lib/sandbox-security';
import { validatePythonContent } from '@/lib/upload-validation';

const LOG_DIR = path.join(process.cwd(), 'sandbox', 'logs');
const MAX_RUNTIME_MS = 30 * 1000; // 30 seconds (more restrictive)

// Sandbox configuration for different user roles
const SANDBOX_CONFIGS: Record<string, Partial<SandboxConfig>> = {
  ADMIN: {
    timeout: 60000, // 60 seconds for admins
    maxMemory: 256 * 1024 * 1024, // 256MB
    maxOutputSize: 2 * 1024 * 1024, // 2MB
  },
  USER: {
    timeout: 30000, // 30 seconds for regular users
    maxMemory: 128 * 1024 * 1024, // 128MB
    maxOutputSize: 1024 * 1024, // 1MB
  },
  VIEWER: {
    timeout: 15000, // 15 seconds for viewers
    maxMemory: 64 * 1024 * 1024, // 64MB
    maxOutputSize: 512 * 1024, // 512KB
  }
};

/**
 * POST /api/sandbox/execute-script
 * Execute a Python script and stream output via Socket.IO
 */
export const POST = withUserAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json();
    const { scriptId, args = [] } = body;

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    // Get script from database
    const script = await db.testScript.findUnique({
      where: { id: scriptId }
    });

    if (!script) {
      return NextResponse.json(
        { success: false, error: 'Script not found' },
        { status: 404 }
      );
    }

    // Check if script file exists
    try {
      await fs.access(script.file_path);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Script file not found on disk' },
        { status: 404 }
      );
    }

    // Generate execution ID
    const executionId = uuidv4();

    // Create log directory if it doesn't exist
    await fs.mkdir(LOG_DIR, { recursive: true });

    // Create log file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFileName = `${script.script_name}_${timestamp}.log`;
    const logFilePath = path.join(LOG_DIR, logFileName);

    // Create execution record in database
    const execution = await db.testScriptExecution.create({
      data: {
        execution_id: executionId,
        script_id: scriptId,
        status: 'running',
        log_file_path: logFilePath,
        triggered_by: request.user?.email || 'manual',
        metadata: {
          args: args.length > 0 ? args : undefined,
          userId: request.user?.id,
          userRole: request.user?.role
        }
      }
    });

    // Create activity log and log user activity
    await db.activity.create({
      data: {
        type: 'sandbox',
        action: 'executed',
        title: 'Python Script Execution Started',
        description: `Executing script "${script.original_filename}"`,
        entity_type: 'TestScriptExecution',
        entity_id: execution.execution_id,
        user_id: request.user?.id,
        status: 'pending',
        metadata: {
          scriptId,
          executionId,
          scriptName: script.script_name,
          userEmail: request.user?.email
        }
      }
    });

    // Log activity via auth middleware
    if (request.user?.id) {
      await logActivity(
        request.user.id,
        'execute',
        'TestScript',
        scriptId,
        { executionId, scriptName: script.script_name }
      );
    }

    // Update script's last run
    await db.testScript.update({
      where: { id: scriptId },
      data: {
        last_run_at: new Date(),
        total_runs: { increment: 1 }
      }
    });

    // Get Socket.IO instance
    const io = getIo();

    // Read script content for security validation and execution
    const scriptContent = await fs.readFile(script.file_path, 'utf8');
    
    // Validate script content for security
    const validation = validatePythonContent(scriptContent);
    if (!validation.isValid) {
      // Update execution status to failed
      await prisma.testScriptExecution.update({
        where: { execution_id: executionId },
        data: {
          status: 'failed',
          completed_at: new Date(),
          runtime_ms: 0,
          exit_code: -1,
          error_message: 'Script validation failed: ' + validation.errors.join(', ')
        }
      });
      
      return NextResponse.json(
        { success: false, error: 'Script validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Get sandbox configuration based on user role
    const userRole = request.user?.role || 'VIEWER';
    const sandboxConfig = SANDBOX_CONFIGS[userRole] || SANDBOX_CONFIGS.VIEWER;

    // Execute script in secure sandbox asynchronously
    executeScriptSecurely(
      scriptContent,
      script,
      execution,
      executionId,
      logFilePath,
      sandboxConfig,
      io,
      request.user
    );

    return NextResponse.json({
      success: true,
      message: 'Script execution started',
      data: {
        executionId,
        scriptName: script.script_name,
        status: 'running'
      }
    });

  } catch (error) {
    console.error('Error starting script execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start script execution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/sandbox/execute-script
 * Get execution status
 */
export const GET = withUserAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    const execution = await db.testScriptExecution.findUnique({
      where: { execution_id: executionId },
      include: {
        testScript: true,
        logs: {
          orderBy: { line_number: 'asc' },
          take: 1000 // Limit to last 1000 lines
        }
      }
    });

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        executionId: execution.execution_id,
        scriptId: execution.script_id,
        scriptName: execution.testScript.script_name,
        status: execution.status,
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
        runtimeMs: execution.runtime_ms,
        exitCode: execution.exit_code,
        errorMessage: execution.error_message,
        outputLines: execution.output_lines,
        logFilePath: execution.log_file_path,
        logs: execution.logs.map(log => ({
          lineNumber: log.line_number,
          logLevel: log.log_level,
          message: log.message,
          timestamp: log.timestamp
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch execution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/sandbox/execute-script
 * Kill a running execution
 */
export const DELETE = withUserAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { success: false, error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    // Try to kill execution using sandbox manager
    const killed = await sandboxManager.killExecution(executionId);
    
    if (!killed) {
      return NextResponse.json(
        { success: false, error: 'Execution not found or already completed' },
        { status: 404 }
      );
    }

    // Update execution status
    await prisma.testScriptExecution.update({
      where: { execution_id: executionId },
      data: {
        status: 'killed',
        completed_at: new Date(),
        error_message: 'Execution killed by user',
        exit_code: -1
      }
    });

    // Log activity
    if (request.user?.id) {
      await logActivity(
        request.user.id,
        'kill',
        'TestScriptExecution',
        executionId,
        { reason: 'User requested termination' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Execution killed successfully'
    });

  } catch (error) {
    console.error('Error killing execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to kill execution',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Secure async function to execute the script using sandbox manager
async function executeScriptSecurely(
  scriptContent: string,
  script: any,
  execution: any,
  executionId: string,
  logFilePath: string,
  sandboxConfig: Partial<SandboxConfig>,
  io: any,
  user: any
) {
  const startTime = Date.now();
  let lineNumber = 0;

  try {
    // Create write stream for log file
    const logStream = await fs.open(logFilePath, 'w');
    
    // Write initial log entry
    await logStream.write(`[${new Date().toISOString()}] Starting secure script execution\n`);
    await logStream.write(`[${new Date().toISOString()}] User: ${user?.email} (${user?.role})\n`);
    await logStream.write(`[${new Date().toISOString()}] Sandbox Config: ${JSON.stringify(sandboxConfig)}\n`);
    await logStream.write(`[${new Date().toISOString()}] Script: ${script.script_name}\n`);
    
    // Execute script using secure sandbox manager
    const result = await sandboxManager.executeScript(scriptContent, {
      ...sandboxConfig,
      tempDirectory: path.join(process.cwd(), 'temp', 'sandbox', executionId)
    });
    
    const runtimeMs = result.executionTime;
    const status = result.success ? 'completed' : 'failed';
    
    // Process output and save to logs
    if (result.output) {
      const outputLines = result.output.split('\n').filter(line => line.trim());
      for (const line of outputLines) {
        lineNumber++;
        const logLine = `[${new Date().toISOString()}] ${line}\n`;
        
        // Write to file
        await logStream.write(logLine);
        
        // Save to database
        await prisma.testScriptLog.create({
          data: {
            execution_id: executionId,
            line_number: lineNumber,
            log_level: 'stdout',
            message: line
          }
        }).catch(err => console.error('Error saving log:', err));
        
        // Emit to Socket.IO
        if (io) {
          io.to('sandbox').emit('script:log', {
            executionId,
            lineNumber,
            logLevel: 'stdout',
            message: line,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Process errors
    if (result.error) {
      const errorLines = result.error.split('\n').filter(line => line.trim());
      for (const line of errorLines) {
        lineNumber++;
        const logLine = `[${new Date().toISOString()}] ERROR: ${line}\n`;
        
        // Write to file
        await logStream.write(logLine);
        
        // Save to database
        await prisma.testScriptLog.create({
          data: {
            execution_id: executionId,
            line_number: lineNumber,
            log_level: 'stderr',
            message: line
          }
        }).catch(err => console.error('Error saving log:', err));
        
        // Emit to Socket.IO
        if (io) {
          io.to('sandbox').emit('script:log', {
            executionId,
            lineNumber,
            logLevel: 'stderr',
            message: line,
            timestamp: new Date().toISOString()
          });
        }
        
        // Create notification for errors
        await prisma.notification.create({
          data: {
            type: 'alert',
            category: 'system',
            title: result.timedOut ? 'Script Execution Timeout' : 'Script Execution Error',
            message: line.substring(0, 200),
            severity: 'high',
            metadata: {
              executionId,
              scriptName: script.script_name,
              timedOut: result.timedOut,
              killed: result.killed,
              memoryUsed: result.memoryUsed
            }
          }
        }).catch(err => console.error('Error creating notification:', err));
      }
    }
    
    await logStream.close();
    
    // Update execution in database
    await prisma.testScriptExecution.update({
      where: { execution_id: executionId },
      data: {
        status,
        completed_at: new Date(),
        exit_code: result.exitCode,
        runtime_ms: runtimeMs,
        output_lines: lineNumber,
        error_message: result.error || (result.timedOut ? 'Execution timed out' : result.killed ? 'Execution was killed' : null)
      }
    });
    
    // Update activity
    await prisma.activity.create({
      data: {
        type: 'sandbox',
        action: 'completed',
        title: result.success ? 'Script Execution Completed' : 'Script Execution Failed',
        description: `Script "${script.original_filename}" ${status} in ${(runtimeMs / 1000).toFixed(2)}s`,
        entity_type: 'TestScriptExecution',
        entity_id: executionId,
        status: result.success ? 'success' : 'failed',
        metadata: {
          scriptId: script.id,
          executionId,
          exitCode: result.exitCode,
          runtimeMs,
          outputLines: lineNumber,
          memoryUsed: result.memoryUsed,
          timedOut: result.timedOut,
          killed: result.killed,
          securityRestricted: true
        }
      }
    });
    
    // Emit completion event
    if (io) {
      io.to('sandbox').emit('script:completed', {
        executionId,
        status,
        exitCode: result.exitCode,
        runtimeMs,
        outputLines: lineNumber,
        memoryUsed: result.memoryUsed,
        timedOut: result.timedOut,
        killed: result.killed
      });
    }
    
    console.log(`Secure execution ${executionId} ${status} with exit code ${result.exitCode} in ${runtimeMs}ms`);
    
  } catch (error) {
    console.error('Error in executeScriptSecurely:', error);
    
    await prisma.testScriptExecution.update({
      where: { execution_id: executionId },
      data: {
        status: 'failed',
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error',
        exit_code: -1
      }
    });
    
    // Emit error event
    if (io) {
      io.to('sandbox').emit('script:error', {
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

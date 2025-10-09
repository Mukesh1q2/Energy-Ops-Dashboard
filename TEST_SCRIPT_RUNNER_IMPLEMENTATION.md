# Test Script Runner Implementation Guide

## ✅ Completed Tasks

1. ✅ **Home page updated** - Removed "AI-Powered" from description
2. ✅ **Login page verified** - Already shows "OptiBid Dashboard" 
3. ✅ **Database schema updated** - Added TestScript, TestScriptExecution, TestScriptLog tables

---

## 📋 Remaining Implementation Tasks

### Step 1: Update Database Schema

**Status:** ✅ Schema updated in `prisma/schema.prisma`

Run this command to apply schema changes:
```bash
npm run db:push
```

New tables added:
- `TestScript` - Stores uploaded test scripts
- `TestScriptExecution` - Tracks each execution
- `TestScriptLog` - Stores output lines

---

### Step 2: Create Directories

```bash
mkdir -p sandbox/uploads/test_scripts
mkdir -p sandbox/logs
```

---

### Step 3: Create Test Script Executor Service

Create `src/lib/test-script-executor.ts`:

```typescript
// src/lib/test-script-executor.ts
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/db';

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
  error Message?: string;
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
    const script = await prisma.testScript.findUnique({
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
    const execution = await prisma.testScriptExecution.create({
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
      await prisma.testScriptExecution.update({
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
      await prisma.testScript.update({
        where: { id: scriptId },
        data: {
          last_run_at: new Date(),
          total_runs: { increment: 1 }
        }
      });

      // Emit completed event
      this.io.emit('test-script:completed', {
        executionId,
        status: result.exitCode === 0 ? 'completed' : 'failed',
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
      
      await prisma.testScriptExecution.update({
        where: { id: execution.id },
        data: {
          status: 'failed',
          completed_at: new Date(),
          error_message: errorMessage
        }
      });

      this.io.emit('test-script:failed', {
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
      const pythonProcess = spawn('python', [scriptPath, ...args], {
        cwd: path.dirname(scriptPath)
      });

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
          await prisma.testScriptLog.create({
            data: {
              execution_id: executionId,
              line_number: lineNumber,
              log_level: logLevel,
              message: line,
              timestamp: new Date()
            }
          });

          // Emit real-time log
          this.io.emit('test-script:log', {
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
          
          await prisma.testScriptLog.create({
            data: {
              execution_id: executionId,
              line_number: lineNumber,
              log_level: 'stderr',
              message: line,
              timestamp: new Date()
            }
          });

          this.io.emit('test-script:log', {
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
    return await prisma.testScriptLog.findMany({
      where: { execution_id: executionId },
      orderBy: { line_number: 'asc' }
    });
  }

  async getExecutionStatus(executionId: string) {
    return await prisma.testScriptExecution.findUnique({
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
```

---

### Step 4: Extend Socket.IO Setup

Update `src/lib/socket.ts` to add test script executor:

```typescript
// Add at the top with other imports
import { TestScriptExecutor } from './test-script-executor';

// Add to module-level variables
let testScriptExecutor: TestScriptExecutor | null = null;

// In setupSocket function, after optimizationExecutor initialization:
testScriptExecutor = new TestScriptExecutor(io);

// At the end of file, add getter:
export function getTestScriptExecutor(): TestScriptExecutor | null {
  return testScriptExecutor;
}
```

---

### Step 5: Create API Routes

#### Upload API: `src/app/api/sandbox/test-scripts/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

const SCRIPTS_DIR = path.join(process.cwd(), 'sandbox', 'uploads', 'test_scripts');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file extension
    if (!file.name.endsWith('.py')) {
      return NextResponse.json(
        { success: false, error: 'Only Python (.py) files are allowed' },
        { status: 400 }
      );
    }

    // Check file name pattern
    const validPattern = /^(test_|experiment_).*\.py$/;
    if (!validPattern.test(file.name)) {
      return NextResponse.json(
        { success: false, error: 'File must start with "test_" or "experiment_"' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(SCRIPTS_DIR, fileName);

    // Ensure directory exists
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });

    // Save file
    await fs.writeFile(filePath, fileContent);

    // Create database record
    const script = await prisma.testScript.create({
      data: {
        script_name: fileName,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        description: description || null,
        metadata: {
          uploadedFrom: 'sandbox',
          originalName: file.name
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test script uploaded successfully',
      script: {
        id: script.id,
        script_name: script.script_name,
        original_filename: script.original_filename,
        file_size: script.file_size,
        uploaded_at: script.uploaded_at
      }
    });

  } catch (error) {
    console.error('Error uploading test script:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload test script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
```

#### List & Execute API: `src/app/api/sandbox/test-scripts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTestScriptExecutor } from '@/lib/socket';

export async function GET(request: NextRequest) {
  try {
    const scripts = await prisma.testScript.findMany({
      where: { status: 'active' },
      orderBy: { uploaded_at: 'desc' },
      include: {
        executions: {
          orderBy: { started_at: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      scripts: scripts.map(script => ({
        ...script,
        lastExecution: script.executions[0] || null,
        executions: undefined
      }))
    });
  } catch (error) {
    console.error('Error fetching test scripts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test scripts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, args } = body;

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    const executor = getTestScriptExecutor();
    if (!executor) {
      return NextResponse.json(
        { success: false, error: 'Test script executor not initialized' },
        { status: 500 }
      );
    }

    const result = await executor.executeScript({ scriptId, args });

    return NextResponse.json({
      success: true,
      message: 'Script execution started',
      executionId: result.executionId,
      status: result.status
    });

  } catch (error) {
    console.error('Error executing test script:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute test script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get('id');

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    await prisma.testScript.update({
      where: { id: scriptId },
      data: { status: 'archived' }
    });

    return NextResponse.json({
      success: true,
      message: 'Script archived successfully'
    });

  } catch (error) {
    console.error('Error archiving script:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive script' },
      { status: 500 }
    );
  }
}
```

---

### Step 6: Frontend Components

Due to length constraints, here's a summary of what you need to create:

1. **`src/components/sandbox/test-script-upload.tsx`**
   - Similar to ModelUploadCard but for test scripts
   - Validate filename patterns (test_*, experiment_*)
   - Show uploaded scripts list with Run buttons

2. **`src/components/sandbox/test-script-logs.tsx`**
   - Real-time log display using Socket.IO
   - Listen to 'test-script:log' events
   - Color code: stdout (white), stderr (red), warnings (yellow)
   - Auto-scroll to bottom
   - Filter by log level

3. **Update `src/app/sandbox/page.tsx`**
   - Add new tab "Test Scripts" 
   - Import and use TestScriptUpload and TestScriptLogs components

---

## 🧪 Testing

Create a sample test file `test_sample.py`:

```python
import time
print("Model name: Test Script")
print(f"Model run time {time.strftime('%Y-%m-%d %H:%M:%S')}")
time.sleep(1)
print("Testing Price Forecast Loop a bit")
time.sleep(1)
print("Running Deterministic Day-Ahead Model...")
time.sleep(1)
print("Wind profiles used for respective plant has been written...")
print("Execution completed successfully")
```

---

## 📊 Implementation Priority

1. ✅ Database schema (DONE)
2. Create TestScriptExecutor service
3. Extend Socket.IO setup
4. Create API routes
5. Build frontend components
6. Integrate into Sandbox page
7. Test end-to-end

---

**Estimated Time:** 2-3 hours for complete implementation
**Status:** Backend infrastructure ready, frontend components needed

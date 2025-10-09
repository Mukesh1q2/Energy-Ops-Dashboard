# Comprehensive Fixes Implementation Plan

## Executive Summary
This document provides technical solutions for all identified issues in the Energy Ops Dashboard. Each fix includes implementation details, code changes, and deployment considerations.

---

## 1. Process Lifecycle and Horizontal Scaling

### Problem
- In-memory `activeProcesses` map doesn't persist across restarts
- Won't work with multiple Node instances
- Lost process management after server restart

### Solution: Database-Backed Process Registry

**Implementation:**
```typescript
// src/lib/process-manager.ts
import { prisma } from './db'
import { ChildProcess } from 'child_process'

interface ProcessInfo {
  executionId: string
  pid: number
  startTime: Date
}

class ProcessManager {
  private processes = new Map<string, ChildProcess>()
  
  async registerProcess(executionId: string, process: ChildProcess): Promise<void> {
    if (!process.pid) return
    
    this.processes.set(executionId, process)
    
    // Store in DB for recovery
    await prisma.testScriptExecution.update({
      where: { execution_id: executionId },
      data: {
        metadata: {
          pid: process.pid,
          hostname: require('os').hostname(),
          registeredAt: new Date().toISOString()
        }
      }
    })
  }
  
  async killProcess(executionId: string): Promise<boolean> {
    // Try in-memory first
    const process = this.processes.get(executionId)
    if (process && !process.killed) {
      this.killByPlatform(process.pid!)
      this.processes.delete(executionId)
      return true
    }
    
    // Fallback: Check DB for PID
    const execution = await prisma.testScriptExecution.findUnique({
      where: { execution_id: executionId }
    })
    
    if (execution?.metadata && typeof execution.metadata === 'object') {
      const meta = execution.metadata as any
      if (meta.pid && meta.hostname === require('os').hostname()) {
        this.killByPlatform(meta.pid)
        return true
      }
    }
    
    return false
  }
  
  private killByPlatform(pid: number): void {
    if (process.platform === 'win32') {
      // Windows-specific kill
      require('child_process').execSync(`taskkill /F /PID ${pid}`, { 
        stdio: 'ignore' 
      })
    } else {
      // Unix kill
      try {
        process.kill(pid, 'SIGTERM')
        setTimeout(() => {
          try { process.kill(pid, 'SIGKILL') } catch {}
        }, 5000)
      } catch {}
    }
  }
  
  async cleanupStaleProcesses(): Promise<void> {
    // Find running executions from this instance
    const hostname = require('os').hostname()
    const runningExecutions = await prisma.testScriptExecution.findMany({
      where: { status: 'running' }
    })
    
    for (const exec of runningExecutions) {
      if (exec.metadata && typeof exec.metadata === 'object') {
        const meta = exec.metadata as any
        if (meta.hostname === hostname && meta.pid) {
          // Check if process still exists
          const exists = this.isProcessRunning(meta.pid)
          if (!exists) {
            // Mark as failed - process died
            await prisma.testScriptExecution.update({
              where: { execution_id: exec.execution_id },
              data: {
                status: 'failed',
                error_message: 'Process terminated unexpectedly (server restart)',
                completed_at: new Date()
              }
            })
          }
        }
      }
    }
  }
  
  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }
}

export const processManager = new ProcessManager()
```

**Schema Addition:**
No schema changes needed - using existing `metadata` JSON field.

**Integration:**
- Call `processManager.cleanupStaleProcesses()` on server startup
- Replace `activeProcesses.set()` with `processManager.registerProcess()`
- Replace process kill logic with `processManager.killProcess()`

---

## 2. Signal Handling on Windows

### Problem
`SIGTERM` doesn't work reliably on Windows

### Solution: Platform-Specific Process Termination

Already included in ProcessManager above. Additional improvements:

**Update execute-script route:**
```typescript
// In src/app/api/sandbox/execute-script/route.ts

import { processManager } from '@/lib/process-manager'

// Replace process.kill() calls with:
await processManager.killProcess(executionId)
```

---

## 3. Socket.IO Global Intervals in Dev

### Problem
Hot restarts create duplicate intervals

### Solution: Interval Lifecycle Management

```typescript
// src/lib/socket.ts

let intervalsCleanup: (() => void) | null = null

export const setupSocket = (io: Server) => {
  // Cleanup existing intervals first
  if (intervalsCleanup) {
    intervalsCleanup()
  }
  
  console.log('🚀 Socket.IO server initialized')
  globalIo = io
  
  optimizationExecutor = new OptimizationExecutor(io)
  testScriptExecutor = new TestScriptExecutor(io)
  
  io.on('connection', (socket) => {
    // ... existing connection logic
  })
  
  // Start intervals and get cleanup function
  intervalsCleanup = startRealtimeUpdates(io)
  
  // Cleanup on multiple signals
  const cleanup = () => {
    if (intervalsCleanup) {
      intervalsCleanup()
      intervalsCleanup = null
    }
  }
  
  process.once('SIGINT', cleanup)
  process.once('SIGTERM', cleanup)
  process.once('beforeExit', cleanup)
}

function startRealtimeUpdates(io: Server): () => void {
  const intervals: NodeJS.Timeout[] = []
  
  // KPI Updates - Every 30 seconds
  intervals.push(setInterval(async () => {
    try {
      const kpiData = await fetchKpiData()
      io.to('dashboard').emit('kpi:update', {
        data: kpiData,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error fetching KPI data:', error)
    }
  }, 30000))
  
  // Notification Checks - Every 10 seconds
  intervals.push(setInterval(async () => {
    try {
      const newNotifications = await checkNewNotifications()
      if (newNotifications.length > 0) {
        io.to('dashboard').emit('notification:new', {
          notifications: newNotifications,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }, 10000))
  
  // System Health - Every 15 seconds  
  intervals.push(setInterval(async () => {
    try {
      const healthData = await fetchSystemHealth()
      io.to('dashboard').emit('system-health:update', {
        data: healthData,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error fetching system health:', error)
    }
  }, 15000))
  
  console.log('⏰ Real-time update intervals started')
  
  // Return cleanup function
  return () => {
    intervals.forEach(interval => clearInterval(interval))
    console.log('⏹️  Real-time update intervals stopped')
  }
}
```

---

## 4. Log Write Amplification

### Problem
Individual DB inserts per log line cause high DB pressure

### Solution: Batched Log Writes

```typescript
// src/lib/log-batcher.ts

interface LogEntry {
  execution_id: string
  line_number: number
  log_level: string
  message: string
  timestamp: Date
}

class LogBatcher {
  private batches = new Map<string, LogEntry[]>()
  private timers = new Map<string, NodeJS.Timeout>()
  private readonly BATCH_SIZE = 50
  private readonly BATCH_TIMEOUT = 2000 // 2 seconds
  
  addLog(entry: LogEntry): void {
    const { execution_id } = entry
    
    if (!this.batches.has(execution_id)) {
      this.batches.set(execution_id, [])
    }
    
    const batch = this.batches.get(execution_id)!
    batch.push(entry)
    
    // Flush if batch size reached
    if (batch.length >= this.BATCH_SIZE) {
      this.flush(execution_id)
    } else {
      // Set/reset timer
      this.resetTimer(execution_id)
    }
  }
  
  private resetTimer(execution_id: string): void {
    if (this.timers.has(execution_id)) {
      clearTimeout(this.timers.get(execution_id)!)
    }
    
    const timer = setTimeout(() => {
      this.flush(execution_id)
    }, this.BATCH_TIMEOUT)
    
    this.timers.set(execution_id, timer)
  }
  
  async flush(execution_id: string): Promise<void> {
    const batch = this.batches.get(execution_id)
    if (!batch || batch.length === 0) return
    
    try {
      await prisma.testScriptLog.createMany({
        data: batch,
        skipDuplicates: false
      })
      
      this.batches.delete(execution_id)
      
      if (this.timers.has(execution_id)) {
        clearTimeout(this.timers.get(execution_id)!)
        this.timers.delete(execution_id)
      }
    } catch (error) {
      console.error('Error flushing log batch:', error)
    }
  }
  
  async flushAll(): Promise<void> {
    const promises = Array.from(this.batches.keys()).map(id => this.flush(id))
    await Promise.all(promises)
  }
}

export const logBatcher = new LogBatcher()
```

**Usage in execute-script:**
```typescript
// Replace individual inserts with:
logBatcher.addLog({
  execution_id: executionId,
  line_number: lineNumber,
  log_level: 'stdout',
  message: line,
  timestamp: new Date()
})

// On process completion/error:
await logBatcher.flush(executionId)
```

---

## 5. File Lifecycle - Orphaned Log Files

### Problem
Log files not deleted when TestScript is deleted

### Solution: Cascade File Cleanup

```typescript
// Update src/app/api/sandbox/scripts/route.ts DELETE handler

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scriptId = searchParams.get('id')
    
    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      )
    }
    
    // Get script with all executions
    const script = await prisma.testScript.findUnique({
      where: { id: scriptId },
      include: { executions: true }
    })
    
    if (!script) {
      return NextResponse.json(
        { success: false, error: 'Script not found' },
        { status: 404 }
      )
    }
    
    // Delete all associated log files
    for (const execution of script.executions) {
      if (execution.log_file_path) {
        try {
          await fs.unlink(execution.log_file_path)
        } catch (error) {
          console.warn(`Failed to delete log file: ${execution.log_file_path}`, error)
        }
      }
    }
    
    // Delete script file
    try {
      await fs.unlink(script.file_path)
    } catch (error) {
      console.warn('Failed to delete script file:', error)
    }
    
    // Delete from database (will cascade delete executions and logs if schema configured)
    await prisma.testScript.delete({
      where: { id: scriptId }
    })
    
    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'sandbox',
        action: 'deleted',
        title: 'Python Script Deleted',
        description: `Script "${script.original_filename}" and ${script.executions.length} execution logs deleted`,
        entity_type: 'TestScript',
        entity_id: scriptId,
        status: 'success'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Script and all associated files deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting script:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

---

## 6. Cascade Assumptions - Schema Fix

### Problem
Schema doesn't enforce cascading deletes

### Solution: Update Prisma Schema

```prisma
// Update prisma/schema.prisma

model TestScript {
  id                  String   @id @default(cuid())
  script_name         String
  original_filename   String
  file_path           String
  file_size           Int
  uploaded_by         String   @default("admin")
  uploaded_at         DateTime @default(now())
  status              String   @default("active")
  description         String?
  last_run_at         DateTime?
  total_runs          Int      @default(0)
  metadata            Json?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  executions          TestScriptExecution[] // Add onDelete cascade
  
  @@index([uploaded_at])
  @@index([status])
}

model TestScriptExecution {
  id                  String   @id @default(cuid())
  execution_id        String   @unique
  script_id           String
  testScript          TestScript @relation(fields: [script_id], references: [id], onDelete: Cascade) // Added
  status              String
  started_at          DateTime @default(now())
  completed_at        DateTime?
  exit_code           Int?
  error_message       String?
  log_file_path       String?
  output_lines        Int      @default(0)
  runtime_ms          Int?
  triggered_by        String   @default("manual")
  metadata            Json?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  logs                TestScriptLog[] // Add onDelete cascade
  
  @@index([execution_id])
  @@index([script_id])
  @@index([status])
  @@index([started_at])
}

model TestScriptLog {
  id                  String   @id @default(cuid())
  execution_id        String
  execution           TestScriptExecution @relation(fields: [execution_id], references: [execution_id], onDelete: Cascade) // Added
  line_number         Int
  log_level           String
  message             String
  timestamp           DateTime @default(now())
  
  @@index([execution_id])
  @@index([log_level])
  @@index([timestamp])
}

// Similarly for OptimizationModel and JobRun
model OptimizationModel {
  id                  String   @id @default(cuid())
  model_name          String
  original_filename   String
  file_path           String
  model_type          String
  uploaded_by         String   @default("admin")
  uploaded_at         DateTime @default(now())
  status              String   @default("active")
  syntax_valid        Boolean  @default(false)
  validation_message  String?
  file_size           Int
  description         String?
  version             Int      @default(1)
  last_used_at        DateTime?
  metadata            Json?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  jobRuns             JobRun[] // Add cascade
  
  @@index([model_type])
  @@index([status])
  @@index([uploaded_at])
}

model JobRun {
  id                  String   @id @default(cuid())
  job_id              String   @unique
  model_type          String
  model_id            String?
  optimizationModel   OptimizationModel? @relation(fields: [model_id], references: [id], onDelete: SetNull) // Added
  data_source_id      String
  status              String
  progress            Int      @default(0)
  started_at          DateTime @default(now())
  completed_at        DateTime?
  error_message       String?
  results_count       Int?
  objective_value     Float?
  solver_time_ms      Int?
  triggered_by        String   @default("manual")
  model_config        Json?
  log_file_path       String?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  logs                JobLog[] // Add cascade
  
  @@index([job_id])
  @@index([model_type])
  @@index([model_id])
  @@index([data_source_id])
  @@index([status])
  @@index([started_at])
}

model JobLog {
  id                  String   @id @default(cuid())
  job_id              String
  jobRun              JobRun   @relation(fields: [job_id], references: [job_id], onDelete: Cascade) // Added
  level               String
  message             String
  timestamp           DateTime @default(now())
  metadata            Json?
  
  @@index([job_id])
  @@index([level])
  @@index([timestamp])
}

model DataSourceColumn {
  id                String    @id @default(cuid())
  data_source_id    String
  dataSource        DataSource @relation(fields: [data_source_id], references: [id], onDelete: Cascade) // Added
  column_name       String
  normalized_name   String
  data_type         String
  sample_values     Json?
  expose_as_filter  Boolean   @default(false)
  ui_filter_type    String?
  label             String?
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt

  @@index([data_source_id])
}

model DashboardChart {
  id              String      @id @default(cuid())
  dashboard_id    String
  data_source_id  String
  dataSource      DataSource  @relation(fields: [data_source_id], references: [id], onDelete: Cascade) // Added
  name            String
  chart_config    Json
  created_by      String
  created_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt

  @@index([dashboard_id])
  @@index([data_source_id])
}
```

**Apply Changes:**
```bash
# Stop the server first (important on Windows)
# Then run:
npx prisma db push
npx prisma generate
```

---

## 7. Authentication Scope for Socket.IO

### Problem
Socket.IO might be blocked by auth middleware

### Solution: Exclude Socket.IO from Auth Middleware

```typescript
// Update src/middleware.ts

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth/* (authentication pages)
     * - /api/auth/* (NextAuth API routes)
     * - /api/socketio (Socket.IO endpoint) // ADD THIS
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /robots.txt, etc. (static files)
     */
    '/((?!auth|api/auth|api/socketio|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}
```

**Alternative: Handle in Custom Server:**
```typescript
// In server.ts - already partially done, but ensure:

const server = createServer((req, res) => {
  // Skip socket.io requests from Next.js handler
  if (req.url?.startsWith('/api/socketio')) {
    return // Socket.IO will handle this
  }
  handle(req, res)
})
```

---

## 8. Upload/Input Validation

### Problem
Minimal validation of uploads

### Solution: Enhanced Validation Layer

```typescript
// src/lib/validators/upload-validator.ts

import { z } from 'zod'

// DMO Generator Scheduling Schema
export const generatorSchedulingSchema = z.object({
  TimePeriod: z.coerce.date(),
  Region: z.string().min(1).max(100),
  State: z.string().min(1).max(100),
  PlantID: z.string().min(1).max(100),
  PlantName: z.string().min(1).max(200),
  TechnologyType: z.string().min(1).max(100),
  ScheduledMW: z.coerce.number().min(0).max(100000),
  ContractName: z.string().optional(),
  ActualMW: z.coerce.number().min(0).max(100000).optional()
})

// DMO Contract Scheduling Schema
export const contractSchedulingSchema = z.object({
  TimePeriod: z.coerce.date(),
  Region: z.string().min(1).max(100),
  State: z.string().min(1).max(100),
  ContractName: z.string().min(1).max(200),
  BuyerEntity: z.string().min(1).max(200),
  SellerEntity: z.string().min(1).max(200),
  ContractedMW: z.coerce.number().min(0).max(100000),
  ScheduledMW: z.coerce.number().min(0).max(100000).optional(),
  ActualMW: z.coerce.number().min(0).max(100000).optional(),
  ContractType: z.string().optional()
})

// Python Script Content Validator
export function validatePythonScript(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Basic syntax checks
  const dangerousPatterns = [
    /import\s+os\s*;?\s*os\.system/,
    /subprocess\.call\(['"](rm|del|format)/i,
    /__import__\(['"]os['"]\)/,
    /eval\s*\(/,
    /exec\s*\(/,
    /compile\s*\(/
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      errors.push(`Potentially dangerous pattern detected: ${pattern.source}`)
    }
  }
  
  // Check for basic Python validity
  if (!content.trim()) {
    errors.push('Script is empty')
  }
  
  // Check for shebang or valid Python code start
  const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
  if (lines.length === 0) {
    errors.push('No executable code found')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Enhanced file validator
export function validateUploadFile(file: File, options: {
  maxSize: number
  allowedExtensions: string[]
  allowedMimeTypes?: string[]
}): { valid: boolean; error?: string } {
  // Size check
  if (file.size > options.maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(options.maxSize / 1024 / 1024).toFixed(2)}MB`
    }
  }
  
  // Extension check
  const ext = file.name.toLowerCase().split('.').pop()
  if (!ext || !options.allowedExtensions.includes(`.${ext}`)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${options.allowedExtensions.join(', ')}`
    }
  }
  
  // MIME type check
  if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Expected: ${options.allowedMimeTypes.join(', ')}`
    }
  }
  
  return { valid: true }
}
```

**Usage:**
```typescript
// In upload endpoints, add validation:
const validation = validateUploadFile(file, {
  maxSize: 10 * 1024 * 1024,
  allowedExtensions: ['.xlsx', '.xls', '.csv'],
  allowedMimeTypes: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
})

if (!validation.valid) {
  return NextResponse.json(
    { success: false, error: validation.error },
    { status: 400 }
  )
}

// For each row:
try {
  const validated = generatorSchedulingSchema.parse(row)
  transformedData.push(validated)
} catch (error) {
  if (error instanceof z.ZodError) {
    errors.push(`Row ${index + 2}: ${error.errors.map(e => e.message).join(', ')}`)
  }
}
```

---

## 9. Resource Isolation for Python Scripts

### Problem
No CPU/memory limits, inherits environment

### Solution: Sandboxed Execution

```typescript
// src/lib/sandbox-executor.ts

import { spawn } from 'child_process'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

interface SandboxOptions {
  maxMemoryMB: number
  maxCpuPercent: number
  timeoutMs: number
  allowedEnvVars: string[]
}

export class SandboxExecutor {
  private defaultOptions: SandboxOptions = {
    maxMemoryMB: 512,
    maxCpuPercent: 50,
    timeoutMs: 10 * 60 * 1000,
    allowedEnvVars: ['PATH', 'PYTHONPATH', 'HOME', 'USER']
  }
  
  async executeScript(
    scriptPath: string,
    args: string[] = [],
    options: Partial<SandboxOptions> = {}
  ): Promise<ChildProcess> {
    const opts = { ...this.defaultOptions, ...options }
    
    // Create clean environment
    const cleanEnv = this.createCleanEnvironment(opts.allowedEnvVars)
    cleanEnv.PYTHONUNBUFFERED = '1'
    
    // Platform-specific sandboxing
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3'
    const spawnArgs: string[] = []
    
    if (process.platform === 'linux') {
      // Use systemd-run for resource limits on Linux
      return spawn('systemd-run', [
        '--user',
        '--scope',
        `--property=MemoryMax=${opts.maxMemoryMB}M`,
        `--property=CPUQuota=${opts.maxCpuPercent}%`,
        pythonCmd,
        scriptPath,
        ...args
      ], {
        cwd: tmpdir(), // Run in temp directory, not project root
        env: cleanEnv,
        stdio: ['ignore', 'pipe', 'pipe']
      })
    } else if (process.platform === 'win32') {
      // Windows: Use Job Objects via node addon or external tool
      // For now, basic spawn with clean env
      const process = spawn(pythonCmd, [scriptPath, ...args], {
        cwd: tmpdir(),
        env: cleanEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      })
      
      // Set process priority to below normal
      try {
        require('child_process').execSync(
          `wmic process where processid=${process.pid} call setpriority "below normal"`,
          { stdio: 'ignore' }
        )
      } catch {}
      
      return process
    } else {
      // macOS/Unix: Basic spawn
      return spawn(pythonCmd, [scriptPath, ...args], {
        cwd: tmpdir(),
        env: cleanEnv,
        stdio: ['ignore', 'pipe', 'pipe']
      })
    }
  }
  
  private createCleanEnvironment(allowedVars: string[]): NodeJS.ProcessEnv {
    const cleanEnv: NodeJS.ProcessEnv = {}
    
    for (const varName of allowedVars) {
      if (process.env[varName]) {
        cleanEnv[varName] = process.env[varName]
      }
    }
    
    return cleanEnv
  }
}

export const sandboxExecutor = new SandboxExecutor()
```

**Usage in execute-script:**
```typescript
// Replace spawn() with:
const pythonProcess = await sandboxExecutor.executeScript(
  script.file_path,
  args,
  {
    maxMemoryMB: 512,
    maxCpuPercent: 50,
    timeoutMs: MAX_RUNTIME_MS
  }
)
```

---

## 10. Path and Environment Coupling

### Problem
Assumes local filesystem, single instance

### Solution: Pluggable Storage Backend

```typescript
// src/lib/storage/storage-interface.ts

export interface StorageBackend {
  save(key: string, data: Buffer): Promise<string>
  read(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  list(prefix: string): Promise<string[]>
}

// src/lib/storage/local-storage.ts
import { promises as fs } from 'fs'
import path from 'path'

export class LocalStorage implements StorageBackend {
  constructor(private basePath: string) {}
  
  async save(key: string, data: Buffer): Promise<string> {
    const fullPath = path.join(this.basePath, key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, data)
    return fullPath
  }
  
  async read(key: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, key)
    return await fs.readFile(fullPath)
  }
  
  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key)
    try {
      await fs.unlink(fullPath)
    } catch (error) {
      console.warn(`Failed to delete ${key}:`, error)
    }
  }
  
  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.basePath, key))
      return true
    } catch {
      return false
    }
  }
  
  async list(prefix: string): Promise<string[]> {
    const dirPath = path.join(this.basePath, prefix)
    try {
      const files = await fs.readdir(dirPath)
      return files.map(f => path.join(prefix, f))
    } catch {
      return []
    }
  }
}

// src/lib/storage/index.ts
import { LocalStorage } from './local-storage'
import { StorageBackend } from './storage-interface'

let storageInstance: StorageBackend

export function getStorage(): StorageBackend {
  if (!storageInstance) {
    // Could be configured via env var to use S3, Azure Blob, etc.
    const storageType = process.env.STORAGE_TYPE || 'local'
    
    switch (storageType) {
      case 'local':
      default:
        storageInstance = new LocalStorage(process.cwd())
    }
  }
  
  return storageInstance
}
```

**Usage:**
```typescript
import { getStorage } from '@/lib/storage'

// In upload handlers:
const storage = getStorage()
const storagePath = await storage.save(
  `sandbox/uploads/test_scripts/${fileName}`,
  Buffer.from(fileBuffer)
)
```

---

## 11. Notifications Volume

### Problem
High-volume logs create many notifications

### Solution: Notification Throttling

```typescript
// src/lib/notification-throttler.ts

interface ThrottleKey {
  executionId: string
  messageHash: string
}

class NotificationThrottler {
  private recentNotifications = new Map<string, number>()
  private readonly THROTTLE_WINDOW_MS = 60000 // 1 minute
  private readonly MAX_PER_WINDOW = 5
  
  shouldCreateNotification(executionId: string, message: string): boolean {
    const hash = this.hashMessage(message)
    const key = `${executionId}:${hash}`
    
    const now = Date.now()
    const lastTime = this.recentNotifications.get(key) || 0
    
    if (now - lastTime < this.THROTTLE_WINDOW_MS) {
      // Within throttle window - check count
      const count = this.getCountInWindow(executionId)
      if (count >= this.MAX_PER_WINDOW) {
        return false
      }
    }
    
    this.recentNotifications.set(key, now)
    this.cleanup()
    return true
  }
  
  private hashMessage(message: string): string {
    // Simple hash - extract error type
    const errorMatch = message.match(/(Error|Exception|Failed):\s*(\w+)/i)
    return errorMatch ? errorMatch[2] : 'generic'
  }
  
  private getCountInWindow(executionId: string): number {
    const now = Date.now()
    let count = 0
    
    for (const [key, time] of this.recentNotifications.entries()) {
      if (key.startsWith(executionId) && now - time < this.THROTTLE_WINDOW_MS) {
        count++
      }
    }
    
    return count
  }
  
  private cleanup(): void {
    const now = Date.now()
    for (const [key, time] of this.recentNotifications.entries()) {
      if (now - time > this.THROTTLE_WINDOW_MS * 2) {
        this.recentNotifications.delete(key)
      }
    }
  }
}

export const notificationThrottler = new NotificationThrottler()
```

**Usage:**
```typescript
// In execute-script, before creating notification:
if (line.toLowerCase().includes('error') || line.toLowerCase().includes('exception')) {
  if (notificationThrottler.shouldCreateNotification(executionId, line)) {
    await prisma.notification.create({
      data: {
        type: 'alert',
        category: 'system',
        title: 'Script Error Detected',
        message: line.substring(0, 200),
        severity: 'high',
        metadata: {
          executionId,
          scriptName: script.script_name
        }
      }
    })
  }
}
```

---

## 12. Test Coverage vs. Runtime

### Problem
Duplicated aggregation logic between util and API route

### Solution: Refactor API to Use Tested Utils

```typescript
// Update src/app/api/market-snapshot/stats/route.ts

import { aggregateMarketSnapshotStats, type MarketSnapshotRecord } from '@/lib/market-snapshot-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const targetDate = new Date(dateParam)
    const startDate = startOfDay(targetDate)
    const endDate = endOfDay(targetDate)

    // Fetch records
    const records = await prisma.marketSnapshotData.findMany({
      where: {
        time_period: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        dam_price: true,
        rtm_price: true,
        gdam_price: true,
        scheduled_mw: true,
        modelresult_mw: true,
        purchase_bid_mw: true,
        sell_bid_mw: true,
        created_at: true
      }
    })

    // Use tested aggregation function
    const stats = aggregateMarketSnapshotStats(records as MarketSnapshotRecord[])

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching market snapshot stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market snapshot statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

---

## 13. Windows Prisma Lifecycle

### Problem
EPERM errors when running prisma commands while server is running

### Solution: Development Script

```json
// Add to package.json scripts:
{
  "db:push:safe": "npm-run-all --serial stop db:push start",
  "db:generate:safe": "npm-run-all --serial stop db:generate start",
  "db:reset:safe": "npm-run-all --serial stop db:reset start",
  "stop": "taskkill /F /IM node.exe /T || echo 'No node process running'",
  "start": "tsx server.ts"
}
```

Install npm-run-all:
```bash
npm install --save-dev npm-run-all
```

**Usage:**
```bash
# Use these instead of direct prisma commands:
npm run db:push:safe
npm run db:generate:safe
```

---

## 14. Socket.IO Path Alignment

### Problem
Client/server path mismatch

### Solution: Centralized Config

```typescript
// src/lib/config/socket-config.ts

export const SOCKET_CONFIG = {
  path: '/api/socketio',
  transports: ['websocket', 'polling'],
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
} as const

// In server.ts:
import { SOCKET_CONFIG } from '@/lib/config/socket-config'

const io = new Server(server, {
  path: SOCKET_CONFIG.path,
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// In src/hooks/use-socket.ts:
import { SOCKET_CONFIG } from '@/lib/config/socket-config'

socket = io({
  path: SOCKET_CONFIG.path,
  transports: SOCKET_CONFIG.transports,
  reconnection: true,
  reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
  reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts
})
```

---

## 15. UX Event Coupling

### Problem
Cross-tab refresh doesn't work for DMO uploads

### Solution: Emit Socket.IO Events on Uploads

```typescript
// In DMO upload endpoints, after successful upload:

import { getIo } from '@/lib/socket'

// After successful insert:
const io = getIo()
if (io) {
  io.to('dashboard').emit('dmo:data-uploaded', {
    module: 'generator-scheduling', // or 'contract-scheduling', 'market-bidding'
    recordCount: result.count,
    timestamp: new Date().toISOString()
  })
}

// In DMO page component, listen for this event:
useEffect(() => {
  if (!socket) return
  
  socket.on('dmo:data-uploaded', (data) => {
    // Refresh stats
    fetchStats()
    toast.success(`${data.module} data uploaded`, {
      description: `${data.recordCount} records added`
    })
  })
  
  return () => {
    socket.off('dmo:data-uploaded')
  }
}, [socket])
```

---

## 16. Hard-coded Fields

### Problem
`uploaded_by: 'admin'` placeholder

### Solution: Auth Integration

```typescript
// src/lib/auth-helper.ts

import { getServerSession } from 'next-auth'

export async function getCurrentUserId(): Promise<string> {
  try {
    const session = await getServerSession()
    return session?.user?.email || session?.user?.id || 'system'
  } catch {
    return 'system'
  }
}

// In upload endpoints:
import { getCurrentUserId } from '@/lib/auth-helper'

const userId = await getCurrentUserId()

const script = await prisma.testScript.create({
  data: {
    script_name: sanitizedFileName.replace(/\.py$/, ''),
    original_filename: file.name,
    file_path: filePath,
    file_size: file.size,
    uploaded_by: userId, // Use actual user
    description: description || null,
    status: 'active'
  }
})
```

---

## 17. Excel Parsing Defaults

### Problem
Only first sheet parsed

### Solution: Sheet Selection Support

```typescript
// Update upload endpoints to accept sheet parameter:

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const sheetName = formData.get('sheetName') as string | null
  const sheetIndex = formData.get('sheetIndex') as string | null
  
  // ... save file ...
  
  // Parse with sheet selection
  const workbook = XLSX.readFile(filePath)
  
  let worksheet: XLSX.WorkSheet
  if (sheetName && workbook.SheetNames.includes(sheetName)) {
    worksheet = workbook.Sheets[sheetName]
  } else if (sheetIndex && parseInt(sheetIndex) < workbook.SheetNames.length) {
    worksheet = workbook.Sheets[workbook.SheetNames[parseInt(sheetIndex)]]
  } else {
    // Default to first sheet
    worksheet = workbook.Sheets[workbook.SheetNames[0]]
  }
  
  const rawData = XLSX.utils.sheet_to_json(worksheet)
  
  // Return available sheets in response for multi-sheet files
  return NextResponse.json({
    success: true,
    data: {
      // ... existing data ...
      availableSheets: workbook.SheetNames,
      selectedSheet: sheetName || workbook.SheetNames[0]
    }
  })
}
```

---

## Implementation Priority

### Critical (Fix Immediately):
1. ✅ Cascade delete schema updates (#6)
2. ✅ Windows process killing (#2)
3. ✅ Socket.IO interval cleanup (#3)
4. ✅ Auth middleware Socket.IO exclusion (#7)

### High Priority (Next Sprint):
5. ✅ Log write batching (#4)
6. ✅ Process lifecycle management (#1)
7. ✅ File lifecycle cleanup (#5)
8. ✅ Notification throttling (#11)

### Medium Priority (Following Sprint):
9. ✅ Enhanced validation (#8)
10. ✅ Resource isolation (#9)
11. ✅ Code deduplication (#12)
12. ✅ Socket events for UX (#15)

### Low Priority (Backlog):
13. ✅ Storage abstraction (#10)
14. ✅ Auth integration (#16)
15. ✅ Sheet selection (#17)
16. ✅ Windows dev scripts (#13)

---

## Testing Each Fix

After implementing each fix:

1. **Unit Tests:** Add tests for new utilities
2. **Integration Tests:** Test API endpoints
3. **Manual Testing:** Verify UI workflows
4. **Load Testing:** Test with high volume
5. **Windows Testing:** Verify platform-specific fixes

---

## Rollout Strategy

1. Create feature branch: `fix/comprehensive-improvements`
2. Implement critical fixes first
3. Test thoroughly on dev environment
4. Deploy to staging
5. Monitor for 24 hours
6. Deploy to production

---

## Success Metrics

- ✅ Zero orphaned processes after restart
- ✅ Zero orphaned files after deletions
- ✅ < 100ms p95 latency for log writes
- ✅ Successful cross-tab refresh
- ✅ No duplicate Socket.IO intervals
- ✅ Reliable process termination on Windows
- ✅ All cascade deletes working correctly

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-08  
**Status:** Ready for Implementation

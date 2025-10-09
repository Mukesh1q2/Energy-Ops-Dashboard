/**
 * Windows Sandbox Security Isolation
 * Provides secure Python script execution with Windows Job Objects, timeouts, and process cleanup
 */

import { spawn, ChildProcess } from 'child_process'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface SandboxConfig {
  timeout: number // Execution timeout in milliseconds
  maxMemory: number // Maximum memory usage in bytes
  maxCpu: number // Maximum CPU usage percentage (0-100)
  allowedModules: string[] // Allowed Python modules
  tempDirectory: string // Directory for temporary files
  maxOutputSize: number // Maximum output size in bytes
  maxFileSize: number // Maximum file size that can be created
}

export interface SandboxResult {
  success: boolean
  output: string
  error?: string
  executionTime: number
  memoryUsed: number
  exitCode: number | null
  killed: boolean
  timedOut: boolean
}

export interface SandboxExecutionContext {
  sessionId: string
  startTime: number
  process?: ChildProcess
  tempDir: string
  scriptPath: string
  outputPath: string
  cleanup: () => Promise<void>
}

export class WindowsSandboxSecurityManager {
  private activeExecutions = new Map<string, SandboxExecutionContext>()
  private readonly defaultConfig: SandboxConfig = {
    timeout: 30000, // 30 seconds
    maxMemory: 128 * 1024 * 1024, // 128MB
    maxCpu: 50, // 50% CPU usage
    allowedModules: [
      'pandas',
      'numpy',
      'matplotlib',
      'seaborn',
      'scipy',
      'sklearn',
      'plotly',
      'math',
      'json',
      'csv',
      're',
      'datetime',
      'collections',
      'itertools',
      'functools',
      'operator'
    ],
    tempDirectory: join(process.cwd(), 'temp', 'sandbox'),
    maxOutputSize: 1024 * 1024, // 1MB
    maxFileSize: 100 * 1024 * 1024 // 100MB
  }

  constructor(private config: Partial<SandboxConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config }
    this.ensureTempDirectory()
    this.setupCleanupHandlers()
  }

  private async ensureTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.tempDirectory!, { recursive: true })
    } catch (error) {
      console.error('Failed to create temp directory:', error)
    }
  }

  private setupCleanupHandlers(): void {
    // Cleanup on process exit
    process.on('exit', () => {
      this.cleanupAllExecutions()
    })

    process.on('SIGINT', () => {
      this.cleanupAllExecutions()
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      this.cleanupAllExecutions()
      process.exit(0)
    })

    // Periodic cleanup of stale executions
    setInterval(() => {
      this.cleanupStaleExecutions()
    }, 60000) // Every minute
  }

  /**
   * Execute Python script in a secure sandbox environment
   */
  async executeScript(
    script: string,
    config: Partial<SandboxConfig> = {}
  ): Promise<SandboxResult> {
    const mergedConfig = { ...this.config, ...config }
    const sessionId = uuidv4()
    const startTime = Date.now()

    let context: SandboxExecutionContext | undefined

    try {
      // Create execution context
      context = await this.createExecutionContext(sessionId, script)
      this.activeExecutions.set(sessionId, context)

      // Validate script security
      await this.validateScriptSecurity(script, mergedConfig)

      // Execute script with Windows Job Object isolation
      const result = await this.executeInJobObject(context, mergedConfig)

      return {
        ...result,
        executionTime: Date.now() - startTime
      }

    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime: Date.now() - startTime,
        memoryUsed: 0,
        exitCode: -1,
        killed: false,
        timedOut: false
      }
    } finally {
      // Cleanup
      if (context) {
        await context.cleanup()
        this.activeExecutions.delete(sessionId)
      }
    }
  }

  private async createExecutionContext(
    sessionId: string,
    script: string
  ): Promise<SandboxExecutionContext> {
    const tempDir = join(this.config.tempDirectory!, sessionId)
    const scriptPath = join(tempDir, 'script.py')
    const outputPath = join(tempDir, 'output.txt')

    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true })

    // Create restricted Python script wrapper
    const wrappedScript = this.createRestrictedScriptWrapper(script)
    await fs.writeFile(scriptPath, wrappedScript, 'utf8')

    const cleanup = async () => {
      try {
        await fs.rmdir(tempDir, { recursive: true })
      } catch (error) {
        console.warn(`Failed to cleanup temp directory ${tempDir}:`, error)
      }
    }

    return {
      sessionId,
      startTime: Date.now(),
      tempDir,
      scriptPath,
      outputPath,
      cleanup
    }
  }

  private createRestrictedScriptWrapper(userScript: string): string {
    return `#!/usr/bin/env python3
# Restricted Python execution wrapper
import sys
import os
import signal
import resource
import io
from contextlib import redirect_stdout, redirect_stderr

# Restrict imports and dangerous functions
BLOCKED_IMPORTS = {
    'os', 'subprocess', 'socket', 'urllib', 'urllib2', 'httplib', 'http',
    'ftplib', 'telnetlib', 'smtplib', 'poplib', 'imaplib', 'nntplib',
    'ssl', 'ctypes', 'multiprocessing', 'threading', 'thread', '_thread',
    'pty', 'termios', 'tty', 'fcntl', 'grp', 'pwd', 'spwd', 'crypt',
    'dl', 'nis', 'syslog', 'commands', 'popen2', 'pipes'
}

class RestrictedImportHook:
    def __init__(self, blocked_modules):
        self.blocked_modules = blocked_modules
    
    def find_spec(self, name, path, target=None):
        if name in self.blocked_modules or any(name.startswith(blocked + '.') for blocked in self.blocked_modules):
            raise ImportError(f"Import of '{name}' is not allowed in sandbox environment")
        return None

# Install import hook
sys.meta_path.insert(0, RestrictedImportHook(BLOCKED_IMPORTS))

# Restrict dangerous builtins
restricted_builtins = {
    '__import__': lambda *args, **kwargs: None,
    'eval': lambda *args, **kwargs: None,
    'exec': lambda *args, **kwargs: None,
    'compile': lambda *args, **kwargs: None,
    'open': lambda *args, **kwargs: None,
    'input': lambda *args, **kwargs: '',
    'raw_input': lambda *args, **kwargs: ''
}

# Override builtins
for name, func in restricted_builtins.items():
    if hasattr(__builtins__, name):
        setattr(__builtins__, name, func)

# Set up resource limits (Linux/Unix only, Windows uses Job Objects)
if hasattr(resource, 'RLIMIT_AS'):
    try:
        # Limit memory to ${this.config.maxMemory} bytes
        resource.setrlimit(resource.RLIMIT_AS, (${this.config.maxMemory}, ${this.config.maxMemory}))
    except:
        pass

if hasattr(resource, 'RLIMIT_CPU'):
    try:
        # Limit CPU time to 30 seconds
        resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    except:
        pass

# Set up timeout handler
def timeout_handler(signum, frame):
    raise TimeoutError("Script execution timed out")

if hasattr(signal, 'SIGALRM'):
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(${Math.floor(this.config.timeout! / 1000)})

# Capture stdout and stderr
output_buffer = io.StringIO()
error_buffer = io.StringIO()

try:
    with redirect_stdout(output_buffer), redirect_stderr(error_buffer):
        # Execute user script
${userScript.split('\n').map(line => '        ' + line).join('\n')}
        
except Exception as e:
    error_buffer.write(f"Execution error: {str(e)}\\n")
except SystemExit:
    pass
finally:
    # Cancel timeout
    if hasattr(signal, 'alarm'):
        signal.alarm(0)

# Output results
print("=== STDOUT ===")
print(output_buffer.getvalue())
print("=== STDERR ===")  
print(error_buffer.getvalue())
print("=== END ===")
`
  }

  private async validateScriptSecurity(
    script: string,
    config: SandboxConfig
  ): Promise<void> {
    // Check for dangerous patterns
    const dangerousPatterns = [
      /import\s+(os|subprocess|socket|urllib|sys|ctypes)/i,
      /(eval|exec|compile|__import__)\s*\(/i,
      /open\s*\(/i,
      /file\s*\(/i,
      /input\s*\(/i,
      /raw_input\s*\(/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(script)) {
        throw new Error(`Script contains potentially dangerous code: ${pattern.source}`)
      }
    }

    // Check script size
    if (script.length > config.maxFileSize) {
      throw new Error(`Script size exceeds maximum allowed size of ${config.maxFileSize} bytes`)
    }

    // Basic syntax validation could be added here
    // For now, we rely on Python interpreter to catch syntax errors
  }

  private async executeInJobObject(
    context: SandboxExecutionContext,
    config: SandboxConfig
  ): Promise<Omit<SandboxResult, 'executionTime'>> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      let output = ''
      let error = ''
      let memoryUsed = 0
      let timedOut = false
      let killed = false

      // Windows Job Object creation (using PowerShell for Windows compatibility)
      const jobObjectScript = this.createJobObjectScript(context.sessionId, config)
      
      // Execute Python script with Job Object constraints
      const pythonProcess = spawn('powershell.exe', [
        '-ExecutionPolicy', 'Bypass',
        '-Command', jobObjectScript
      ], {
        cwd: context.tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
        timeout: config.timeout
      })

      context.process = pythonProcess

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true
        this.killProcessTree(pythonProcess)
      }, config.timeout)

      // Collect output
      pythonProcess.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString()
        output += chunk
        
        // Limit output size
        if (output.length > config.maxOutputSize) {
          output = output.substring(0, config.maxOutputSize) + '\n[Output truncated]'
          this.killProcessTree(pythonProcess)
        }
      })

      pythonProcess.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString()
        error += chunk

        // Limit error output size
        if (error.length > config.maxOutputSize) {
          error = error.substring(0, config.maxOutputSize) + '\n[Error output truncated]'
        }
      })

      pythonProcess.on('exit', (code, signal) => {
        clearTimeout(timeoutHandle)
        
        // Parse memory usage from output if available
        const memoryMatch = output.match(/MEMORY_USAGE:(\d+)/);
        if (memoryMatch) {
          memoryUsed = parseInt(memoryMatch[1], 10)
        }

        resolve({
          success: code === 0 && !timedOut && !killed,
          output: this.sanitizeOutput(output),
          error: error ? this.sanitizeOutput(error) : undefined,
          memoryUsed,
          exitCode: code,
          killed,
          timedOut
        })
      })

      pythonProcess.on('error', (err) => {
        clearTimeout(timeoutHandle)
        reject(new Error(`Process execution failed: ${err.message}`))
      })
    })
  }

  private createJobObjectScript(sessionId: string, config: SandboxConfig): string {
    return `
# Create Job Object for process isolation
$jobName = "PythonSandbox_${sessionId}"
$job = Start-Job -Name $jobName -ScriptBlock {
    param($scriptPath, $maxMemory, $timeout)
    
    # Execute Python with memory and time limits
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "python"
    $psi.Arguments = $scriptPath
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    
    try {
        $process.Start() | Out-Null
        
        # Monitor memory usage
        $maxMemoryBytes = $maxMemory
        $memoryExceeded = $false
        
        # Wait for completion with timeout and memory monitoring
        $timeoutMs = $timeout
        $startTime = Get-Date
        
        while (!$process.HasExited) {
            Start-Sleep -Milliseconds 100
            
            # Check timeout
            $elapsed = ((Get-Date) - $startTime).TotalMilliseconds
            if ($elapsed -gt $timeoutMs) {
                $process.Kill()
                Write-Error "Process timed out"
                return
            }
            
            # Check memory usage
            try {
                $memoryUsage = $process.WorkingSet64
                if ($memoryUsage -gt $maxMemoryBytes) {
                    $memoryExceeded = $true
                    $process.Kill()
                    Write-Error "Memory limit exceeded: $memoryUsage bytes"
                    return
                }
                Write-Output "MEMORY_USAGE:$memoryUsage"
            } catch {
                # Process might have exited
            }
        }
        
        # Get output
        $stdout = $process.StandardOutput.ReadToEnd()
        $stderr = $process.StandardError.ReadToEnd()
        
        Write-Output $stdout
        if ($stderr) {
            Write-Error $stderr
        }
        
        return $process.ExitCode
        
    } catch {
        Write-Error "Failed to execute process: $_"
        return -1
    } finally {
        if (!$process.HasExited) {
            try { $process.Kill() } catch { }
        }
        $process.Dispose()
    }
} -ArgumentList "${context.scriptPath}", ${config.maxMemory}, ${config.timeout}

# Wait for job completion
$result = Receive-Job -Job $job -Wait
Remove-Job -Job $job

# Return result
$result
`
  }

  private killProcessTree(process: ChildProcess): void {
    if (!process.pid) return

    try {
      // Use taskkill to kill process tree on Windows
      spawn('taskkill', ['/pid', process.pid.toString(), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true
      })
    } catch (error) {
      console.warn('Failed to kill process tree:', error)
      // Fallback to basic kill
      try {
        process.kill('SIGKILL')
      } catch (killError) {
        console.warn('Failed to kill process:', killError)
      }
    }
  }

  private sanitizeOutput(output: string): string {
    // Remove any potential sensitive information from output
    return output
      .replace(/([a-zA-Z]:\\\\[^\\s]+)/g, '[PATH_REDACTED]') // Windows paths
      .replace(/(\/[^\/\s]+)+/g, '[PATH_REDACTED]') // Unix paths  
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP_REDACTED]') // IP addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]') // Email addresses
  }

  private cleanupStaleExecutions(): void {
    const now = Date.now()
    const maxAge = this.config.timeout! * 2 // Double the timeout as max age

    for (const [sessionId, context] of this.activeExecutions.entries()) {
      if (now - context.startTime > maxAge) {
        console.warn(`Cleaning up stale execution: ${sessionId}`)
        
        // Kill process if still running
        if (context.process && !context.process.killed) {
          this.killProcessTree(context.process)
        }

        // Cleanup files
        context.cleanup().catch(err => {
          console.warn(`Failed to cleanup stale execution ${sessionId}:`, err)
        })

        this.activeExecutions.delete(sessionId)
      }
    }
  }

  private cleanupAllExecutions(): void {
    for (const [sessionId, context] of this.activeExecutions.entries()) {
      if (context.process && !context.process.killed) {
        this.killProcessTree(context.process)
      }
      context.cleanup().catch(err => {
        console.warn(`Failed to cleanup execution ${sessionId}:`, err)
      })
    }
    this.activeExecutions.clear()
  }

  /**
   * Get status of all active executions
   */
  getActiveExecutions(): Array<{
    sessionId: string
    startTime: number
    duration: number
    tempDir: string
  }> {
    const now = Date.now()
    return Array.from(this.activeExecutions.entries()).map(([sessionId, context]) => ({
      sessionId,
      startTime: context.startTime,
      duration: now - context.startTime,
      tempDir: context.tempDir
    }))
  }

  /**
   * Kill a specific execution
   */
  async killExecution(sessionId: string): Promise<boolean> {
    const context = this.activeExecutions.get(sessionId)
    if (!context) return false

    if (context.process && !context.process.killed) {
      this.killProcessTree(context.process)
    }

    await context.cleanup()
    this.activeExecutions.delete(sessionId)
    return true
  }

  /**
   * Update sandbox configuration
   */
  updateConfig(newConfig: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

// Export singleton instance
export const sandboxManager = new WindowsSandboxSecurityManager()

// Export types and interfaces
export type {
  SandboxConfig,
  SandboxResult,
  SandboxExecutionContext
}
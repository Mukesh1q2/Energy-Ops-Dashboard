"use client"

import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Terminal, Download, Filter, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/use-socket'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TestLogEntry {
  executionId: string
  lineNumber: number
  logLevel: 'stdout' | 'stderr' | 'error' | 'warning'
  message: string
  timestamp: Date
}

interface TestScriptStatus {
  executionId: string
  scriptName: string
  status: 'running' | 'completed' | 'failed'
  timestamp: Date
}

export function TestScriptLogs() {
  const [logs, setLogs] = useState<TestLogEntry[]>([])
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [currentExecution, setCurrentExecution] = useState<TestScriptStatus | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected } = useSocket()
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!socket) return

    // Subscribe to sandbox room
    socket.emit('subscribe', 'sandbox')

    // Listen for log events (uses script:log from our API)
    socket.on('script:log', (data: any) => {
      const logEntry: TestLogEntry = {
        executionId: data.executionId,
        lineNumber: data.lineNumber,
        logLevel: data.logLevel,
        message: data.message,
        timestamp: new Date(data.timestamp)
      }
      setLogs(prev => [...prev, logEntry])
      
      // Set current execution if not set
      if (!currentExecution) {
        setCurrentExecution({
          executionId: data.executionId,
          scriptName: 'Script',
          status: 'running',
          timestamp: new Date(data.timestamp)
        })
      }
    })

    // Listen for completion events (support both historical and new events)
    const onComplete = (data: any) => {
      setCurrentExecution(prev => prev ? {
        ...prev,
        status: data.status === 'completed' ? 'completed' : 'failed',
        timestamp: new Date()
      } : null)
    }
    socket.on('script:completed', onComplete)
    socket.on('script:complete', onComplete)

    // Listen for error events
    socket.on('script:error', (data: any) => {
      setCurrentExecution(prev => prev ? {
        ...prev,
        status: 'failed',
        timestamp: new Date()
      } : null)
      
      // Add error message to logs
      setLogs(prev => [...prev, {
        executionId: data.executionId,
        lineNumber: prev.length + 1,
        logLevel: 'error',
        message: `ERROR: ${data.error}`,
        timestamp: new Date()
      }])
    })

    return () => {
      socket.off('script:log')
      socket.off('script:completed')
      socket.off('script:complete')
      socket.off('script:error')
    }
  }, [socket])

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [logs, autoScroll])

  const clearLogs = () => {
    setLogs([])
    setCurrentExecution(null)
  }

  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [Line ${log.lineNumber}] [${log.logLevel.toUpperCase()}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filename = currentExecution 
      ? `test-logs-${currentExecution.scriptName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`
      : `test-logs-${new Date().toISOString().split('T')[0]}.txt`
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'stderr':
      case 'error': 
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20'
      case 'warning': 
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
      case 'stdout': 
        return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/20'
      default: 
        return 'text-gray-700 dark:text-gray-300'
    }
  }

  const getLogLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'stderr':
      case 'error': 
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800'
      case 'warning': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
      case 'stdout': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800'
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <div className="h-4 w-4 rounded-full bg-blue-600 animate-pulse" />
      default:
        return null
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'all') return true
    return log.logLevel === filterLevel
  })

  const logStats = {
    total: logs.length,
    stdout: logs.filter(l => l.logLevel === 'stdout').length,
    stderr: logs.filter(l => l.logLevel === 'stderr').length,
    error: logs.filter(l => l.logLevel === 'error').length,
    warning: logs.filter(l => l.logLevel === 'warning').length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Script Console
              <Badge variant="outline" className="ml-2">
                {filteredLogs.length} / {logs.length}
              </Badge>
              {!isConnected && (
                <Badge variant="destructive" className="ml-2">
                  Disconnected
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {currentExecution && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-muted text-sm">
                {getStatusIcon(currentExecution.status)}
                <span className="font-medium">{currentExecution.scriptName}</span>
                <Badge 
                  variant="outline" 
                  className={`text-[10px] ${
                    currentExecution.status === 'completed' 
                      ? 'bg-green-50 dark:bg-green-950' 
                      : currentExecution.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-950'
                      : 'bg-blue-50 dark:bg-blue-950'
                  }`}
                >
                  {currentExecution.status}
                </Badge>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">{logStats.stdout}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-muted-foreground">{logStats.stderr + logStats.error}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-muted-foreground">{logStats.warning}</span>
              </div>
            </div>

            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[120px] h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="stdout">Stdout</SelectItem>
                <SelectItem value="stderr">Stderr</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={downloadLogs} size="sm" variant="outline" disabled={logs.length === 0}>
              <Download className="h-4 w-4" />
            </Button>
            <Button onClick={clearLogs} size="sm" variant="outline" disabled={logs.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border bg-gray-950 dark:bg-gray-950" ref={scrollRef}>
          <div className="p-4 space-y-1 font-mono text-sm">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {logs.length === 0 ? (
                  <>
                    <Terminal className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium font-sans">No test script logs yet</p>
                    <p className="text-sm mt-1 font-sans">Upload and run a test script to see live logs</p>
                  </>
                ) : (
                  <>
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium font-sans">No logs match the current filter</p>
                    <p className="text-sm mt-1 font-sans">Try adjusting your filter criteria</p>
                  </>
                )}
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`px-3 py-1.5 rounded transition-colors ${getLogLevelColor(log.logLevel)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] text-muted-foreground opacity-60 min-w-[60px] select-none">
                      {log.timestamp.toLocaleTimeString()}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`text-[9px] px-1.5 py-0 h-4 uppercase ${getLogLevelBadgeColor(log.logLevel)}`}
                    >
                      {log.logLevel === 'stdout' ? 'OUT' : log.logLevel === 'stderr' ? 'ERR' : log.logLevel}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground opacity-60 min-w-[40px] text-right select-none">
                      #{log.lineNumber}
                    </span>
                    <pre className="flex-1 whitespace-pre-wrap break-all leading-relaxed text-xs">
                      {log.message}
                    </pre>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300"
              />
              Auto-scroll
            </label>
          </div>
          <div>
            {isConnected ? (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Disconnected
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

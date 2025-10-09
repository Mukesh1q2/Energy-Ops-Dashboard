"use client"

import { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Bell, Download, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/use-socket'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LogEntry {
  jobId: string
  modelType: string
  level: 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG'
  message: string
  timestamp: Date
}

export function LogNotificationPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filterLevels, setFilterLevels] = useState<string>('all')
  const [filterModelType, setFilterModelType] = useState<string>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected } = useSocket()
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (!socket) return

    socket.on('optimization:log', (data: any) => {
      const logEntry: LogEntry = {
        ...data,
        timestamp: new Date(data.timestamp)
      }
      setLogs(prev => [...prev, logEntry])
    })

    return () => {
      socket.off('optimization:log')
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
  }

  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.modelType}] [${log.level}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `optimization-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-200 dark:border-red-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
      case 'INFO': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-200 dark:border-blue-800'
      case 'DEBUG': return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200 border-gray-200 dark:border-gray-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200'
    }
  }

  const getModelTypeColor = (modelType: string) => {
    switch (modelType) {
      case 'DMO': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
      case 'RMO': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
      case 'SO': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filterLevels !== 'all' && log.level !== filterLevels) return false
    if (filterModelType !== 'all' && log.modelType !== filterModelType) return false
    return true
  })

  const logStats = {
    total: logs.length,
    info: logs.filter(l => l.level === 'INFO').length,
    error: logs.filter(l => l.level === 'ERROR').length,
    warning: logs.filter(l => l.level === 'WARNING').length,
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Live Optimization Logs
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
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">{logStats.info}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-muted-foreground">{logStats.error}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-muted-foreground">{logStats.warning}</span>
              </div>
            </div>
            
            <Select value={filterModelType} onValueChange={setFilterModelType}>
              <SelectTrigger className="w-[110px] h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DMO">DMO</SelectItem>
                <SelectItem value="RMO">RMO</SelectItem>
                <SelectItem value="SO">SO</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLevels} onValueChange={setFilterLevels}>
              <SelectTrigger className="w-[110px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="DEBUG">Debug</SelectItem>
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
        <ScrollArea className="h-[500px] w-full rounded-md border" ref={scrollRef}>
          <div className="p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                {logs.length === 0 ? (
                  <>
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No logs yet</p>
                    <p className="text-sm mt-1">Run an optimization model to see live logs</p>
                  </>
                ) : (
                  <>
                    <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No logs match the current filters</p>
                    <p className="text-sm mt-1">Try adjusting your filter criteria</p>
                  </>
                )}
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className="group p-3 border-l-4 rounded-r-md hover:bg-muted/50 transition-colors"
                  style={{ borderLeftColor: getLevelColor(log.level).includes('red') ? '#ef4444' : 
                                            getLevelColor(log.level).includes('yellow') ? '#eab308' : 
                                            getLevelColor(log.level).includes('blue') ? '#3b82f6' : '#6b7280' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${getLevelColor(log.level)}`}
                      >
                        {log.level}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${getModelTypeColor(log.modelType)}`}
                      >
                        {log.modelType}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-mono leading-relaxed break-all">
                    {log.message}
                  </p>
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

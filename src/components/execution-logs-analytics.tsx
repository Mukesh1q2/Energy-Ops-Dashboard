"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  XCircle,
  Clock,
  AlertTriangle,
  Info,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Terminal,
  Activity,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface LogEntry {
  id: string
  timestamp: string
  run_id: string
  model_type: 'DMO' | 'RMO' | 'SO'
  level: 'info' | 'warning' | 'error' | 'success'
  step: string
  message: string
  duration_ms?: number
  metadata?: Record<string, any>
}

interface ErrorStats {
  total_errors: number
  error_types: Record<string, number>
  most_common_error: string
  error_trend: 'increasing' | 'decreasing' | 'stable'
}

interface PerformanceMetric {
  step: string
  avg_duration_ms: number
  min_duration_ms: number
  max_duration_ms: number
  success_rate: number
}

export function ExecutionLogsAnalytics() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Analytics
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])

  useEffect(() => {
    fetchLogs()
    fetchAnalytics()

    const interval = setInterval(() => {
      fetchLogs()
      fetchAnalytics()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [timeRange])

  useEffect(() => {
    applyFilters()
  }, [logs, searchQuery, levelFilter, modelFilter])

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/optimization/logs?range=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setLogs(result.data)
      } else {
        // Mock data for development
        const mockLogs: LogEntry[] = [
          {
            id: 'log-001',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            run_id: 'run-001',
            model_type: 'DMO',
            level: 'info',
            step: 'Initialization',
            message: 'Starting DMO optimization process',
            duration_ms: 150
          },
          {
            id: 'log-002',
            timestamp: new Date(Date.now() - 295000).toISOString(),
            run_id: 'run-001',
            model_type: 'DMO',
            level: 'info',
            step: 'Data Loading',
            message: 'Loading historical price data and demand forecasts',
            duration_ms: 2300,
            metadata: { records_loaded: 1440, data_source: 'PostgreSQL' }
          },
          {
            id: 'log-003',
            timestamp: new Date(Date.now() - 290000).toISOString(),
            run_id: 'run-001',
            model_type: 'DMO',
            level: 'info',
            step: 'Model Configuration',
            message: 'Configuring optimization parameters',
            duration_ms: 450,
            metadata: { price_min: 2.5, price_max: 6.5, volume: 5000 }
          },
          {
            id: 'log-004',
            timestamp: new Date(Date.now() - 285000).toISOString(),
            run_id: 'run-001',
            model_type: 'DMO',
            level: 'warning',
            step: 'Validation',
            message: 'Some data points are missing, using interpolation',
            duration_ms: 180,
            metadata: { missing_points: 12, interpolation_method: 'linear' }
          },
          {
            id: 'log-005',
            timestamp: new Date(Date.now() - 280000).toISOString(),
            run_id: 'run-001',
            model_type: 'DMO',
            level: 'info',
            step: 'Optimization',
            message: 'Running linear programming solver',
            duration_ms: 35000,
            metadata: { iterations: 23, convergence: 0.0008 }
          },
          {
            id: 'log-006',
            timestamp: new Date(Date.now() - 245000).toISOString(),
            run_id: 'run-001',
            model_type: 'DMO',
            level: 'success',
            step: 'Completion',
            message: 'Optimization completed successfully',
            duration_ms: 120,
            metadata: { cost_savings: 135000, efficiency: 95.2 }
          },
          {
            id: 'log-007',
            timestamp: new Date(Date.now() - 180000).toISOString(),
            run_id: 'run-002',
            model_type: 'RMO',
            level: 'info',
            step: 'Initialization',
            message: 'Starting RMO real-time optimization',
            duration_ms: 95
          },
          {
            id: 'log-008',
            timestamp: new Date(Date.now() - 179000).toISOString(),
            run_id: 'run-002',
            model_type: 'RMO',
            level: 'error',
            step: 'Data Loading',
            message: 'Failed to connect to real-time data stream',
            duration_ms: 5000,
            metadata: { error_code: 'CONN_TIMEOUT', retry_count: 3 }
          },
          {
            id: 'log-009',
            timestamp: new Date(Date.now() - 174000).toISOString(),
            run_id: 'run-002',
            model_type: 'RMO',
            level: 'info',
            step: 'Data Loading',
            message: 'Reconnected to data stream successfully',
            duration_ms: 450
          },
          {
            id: 'log-010',
            timestamp: new Date(Date.now() - 60000).toISOString(),
            run_id: 'run-003',
            model_type: 'SO',
            level: 'info',
            step: 'Battery Status Check',
            message: 'Current SOC: 45%, Temperature: 25°C',
            duration_ms: 50,
            metadata: { soc: 45, temperature: 25, health: 98 }
          }
        ]
        setLogs(mockLogs)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/optimization/logs/analytics?range=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setErrorStats(result.error_stats)
        setPerformanceMetrics(result.performance_metrics)
      } else {
        // Mock analytics data
        setErrorStats({
          total_errors: 8,
          error_types: {
            'Connection Timeout': 3,
            'Data Validation': 2,
            'Convergence Failed': 2,
            'Resource Exhausted': 1
          },
          most_common_error: 'Connection Timeout',
          error_trend: 'decreasing'
        })

        setPerformanceMetrics([
          { step: 'Initialization', avg_duration_ms: 120, min_duration_ms: 95, max_duration_ms: 180, success_rate: 100 },
          { step: 'Data Loading', avg_duration_ms: 2100, min_duration_ms: 450, max_duration_ms: 5000, success_rate: 92 },
          { step: 'Validation', avg_duration_ms: 250, min_duration_ms: 120, max_duration_ms: 500, success_rate: 95 },
          { step: 'Optimization', avg_duration_ms: 28000, min_duration_ms: 12000, max_duration_ms: 45000, success_rate: 88 },
          { step: 'Completion', avg_duration_ms: 150, min_duration_ms: 80, max_duration_ms: 250, success_rate: 99 }
        ])
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.step.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.run_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter)
    }

    if (modelFilter !== 'all') {
      filtered = filtered.filter(log => log.model_type === modelFilter)
    }

    setFilteredLogs(filtered)
  }

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getLevelBadge = (level: string) => {
    const styles: Record<string, string> = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }
    return <Badge className={styles[level]}>{level}</Badge>
  }

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Run ID', 'Model', 'Level', 'Step', 'Message', 'Duration (ms)'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.run_id,
        log.model_type,
        log.level,
        log.step,
        log.message,
        log.duration_ms?.toString() || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `execution-logs-${new Date().toISOString()}.csv`
    a.click()
  }

  const logLevelCounts = {
    info: logs.filter(l => l.level === 'info').length,
    warning: logs.filter(l => l.level === 'warning').length,
    error: logs.filter(l => l.level === 'error').length,
    success: logs.filter(l => l.level === 'success').length
  }

  const levelDistributionData = [
    { name: 'Info', value: logLevelCounts.info, color: '#3B82F6' },
    { name: 'Success', value: logLevelCounts.success, color: '#10B981' },
    { name: 'Warning', value: logLevelCounts.warning, color: '#F59E0B' },
    { name: 'Error', value: logLevelCounts.error, color: '#EF4444' }
  ]

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Terminal className="w-8 h-8" />
            Execution Logs & Analytics
          </h2>
          <p className="text-muted-foreground">Detailed execution tracking and performance analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-3xl font-bold">{logs.length}</p>
              </div>
              <Terminal className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errors</p>
                <p className="text-3xl font-bold text-red-600">{logLevelCounts.error}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-3xl font-bold text-yellow-600">{logLevelCounts.warning}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {logs.length > 0 ? ((logLevelCounts.success / logs.length) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    <SelectItem value="DMO">DMO</SelectItem>
                    <SelectItem value="RMO">RMO</SelectItem>
                    <SelectItem value="SO">SO</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={exportLogs}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No logs found</p>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div 
                        className="flex items-start justify-between cursor-pointer"
                        onClick={() => toggleLogExpansion(log.id)}
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {expandedLogs.has(log.id) ? (
                            <ChevronDown className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          )}
                          {getLevelIcon(log.level)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <Badge variant="outline">{log.run_id}</Badge>
                              <Badge variant="secondary">{log.model_type}</Badge>
                              <Badge className="bg-purple-500">{log.step}</Badge>
                              {getLevelBadge(log.level)}
                            </div>
                            <p className="mt-2 text-sm">{log.message}</p>
                            {log.duration_ms && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Duration: {log.duration_ms}ms
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {expandedLogs.has(log.id) && log.metadata && (
                        <div className="mt-4 ml-12 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-2">Metadata:</p>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log Level Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Log Level Distribution</CardTitle>
                <CardDescription>Breakdown of log entries by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={levelDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label
                    >
                      {levelDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Error Statistics */}
            {errorStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Error Analysis</CardTitle>
                  <CardDescription>Most common error types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Errors:</span>
                      <Badge variant="destructive">{errorStats.total_errors}</Badge>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(errorStats.error_types).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span>{type}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Trend:</span>
                        <Badge variant={errorStats.error_trend === 'decreasing' ? 'default' : 'destructive'}>
                          {errorStats.error_trend}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step Performance Metrics</CardTitle>
              <CardDescription>Average execution time and success rates by step</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="avg_duration_ms" fill="#8884d8" name="Avg Duration (ms)" />
                  <Bar yAxisId="right" dataKey="success_rate" fill="#82ca9d" name="Success Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics.map(metric => (
                  <div key={metric.step} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{metric.step}</h4>
                      <Badge>{metric.success_rate}% success</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Average</p>
                        <p className="font-medium">{metric.avg_duration_ms}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min</p>
                        <p className="font-medium">{metric.min_duration_ms}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max</p>
                        <p className="font-medium">{metric.max_duration_ms}ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

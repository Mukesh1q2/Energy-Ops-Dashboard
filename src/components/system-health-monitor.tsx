"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Server,
  Database,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  HardDrive,
  Zap,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SystemHealth {
  status: string
  uptime: number
  issues: string[]
  database: {
    status: string
    latency: number
    error: string | null
  }
  jobQueue: {
    active: number
    pending: number
    running: number
  }
  api: {
    latency: number
  }
  memory: {
    used: number
    total: number
    rss: number
  }
  storage: {
    totalRecords: number
  }
}

export function SystemHealthMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<string>('')

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/system/health')
      const result = await response.json()

      if (result.success) {
        setHealth(result.data)
        setLastChecked(new Date().toLocaleTimeString())
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any, className: string }> = {
      healthy: { 
        variant: "default", 
        icon: CheckCircle2, 
        className: "bg-green-500 hover:bg-green-600" 
      },
      degraded: { 
        variant: "secondary", 
        icon: AlertTriangle, 
        className: "bg-yellow-500 hover:bg-yellow-600 text-white" 
      },
      critical: { 
        variant: "destructive", 
        icon: XCircle, 
        className: "" 
      },
      slow: { 
        variant: "secondary", 
        icon: Clock, 
        className: "bg-orange-500 hover:bg-orange-600 text-white" 
      }
    }

    const config = variants[status] || variants.degraded
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={cn("gap-1", config.className)}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!health) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>Failed to load system health data</AlertDescription>
      </Alert>
    )
  }

  const memoryUsagePercent = (health.memory.used / health.memory.total) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(health.status)}
            <span className="text-xs text-muted-foreground">
              Updated {lastChecked}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Issues Alert */}
        {health.issues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">System Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {health.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database Health */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium">Database</span>
              </div>
              {getStatusBadge(health.database.status)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Latency</span>
                <span className={cn(
                  "font-medium",
                  health.database.latency < 100 ? "text-green-600" :
                  health.database.latency < 500 ? "text-yellow-600" :
                  "text-red-600"
                )}>
                  {health.database.latency}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Records</span>
                <span className="font-medium">
                  {health.storage.totalRecords.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Job Queue */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-medium">Job Queue</span>
              </div>
              <Badge variant={health.jobQueue.active > 10 ? "secondary" : "outline"}>
                {health.jobQueue.active} Active
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Running</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {health.jobQueue.running}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">
                  {health.jobQueue.pending}
                </span>
              </div>
            </div>
          </div>

          {/* API Performance */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium">API Performance</span>
              </div>
              <Badge variant="outline">
                {health.api.latency}ms
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response Time</span>
                <span className={cn(
                  "font-medium",
                  health.api.latency < 200 ? "text-green-600" :
                  health.api.latency < 500 ? "text-yellow-600" :
                  "text-red-600"
                )}>
                  {health.api.latency < 200 ? "Excellent" :
                   health.api.latency < 500 ? "Good" :
                   "Slow"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formatUptime(health.uptime)}
                </span>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="font-medium">Memory Usage</span>
              </div>
              <Badge variant={memoryUsagePercent > 80 ? "destructive" : "outline"}>
                {memoryUsagePercent.toFixed(1)}%
              </Badge>
            </div>
            <div className="space-y-2">
              <Progress 
                value={memoryUsagePercent} 
                className="h-2"
                indicatorClassName={
                  memoryUsagePercent > 80 ? "bg-red-500" :
                  memoryUsagePercent > 60 ? "bg-yellow-500" :
                  "bg-green-500"
                }
              />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
                </span>
                <span className="text-muted-foreground">
                  RSS: {formatBytes(health.memory.rss)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock,
  Database,
  TrendingUp,
  RefreshCw,
  FileCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DataQualityMetrics {
  completeness: number
  freshness: number
  validity: number
  connected_sources: number
  total_sources: number
  recent_uploads: number
  failed_uploads: number
  stale_sources: number
  total_records: number
  issues: string[]
}

export function DataQualityDashboard() {
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDataQuality()
    const interval = setInterval(fetchDataQuality, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchDataQuality = async () => {
    try {
      const response = await fetch('/api/system/health')
      const result = await response.json()

      if (result.success) {
        const { dataSources, storage } = result.data

        // Calculate metrics
        const completeness = dataSources.total > 0
          ? (dataSources.connected / dataSources.total) * 100
          : 100

        const freshness = dataSources.total > 0
          ? ((dataSources.total - dataSources.stale) / dataSources.total) * 100
          : 100

        const validity = storage.recentUploads?.completed?.count || 0
        const failedUploads = storage.recentUploads?.error?.count || 0
        const totalUploads = validity + failedUploads
        const validityPercent = totalUploads > 0 ? (validity / totalUploads) * 100 : 100

        setMetrics({
          completeness,
          freshness,
          validity: validityPercent,
          connected_sources: dataSources.connected,
          total_sources: dataSources.total,
          recent_uploads: validity,
          failed_uploads: failedUploads,
          stale_sources: dataSources.stale,
          total_records: storage.totalRecords,
          issues: result.data.issues || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch data quality:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 dark:text-green-400'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-5 w-5" />
    if (percentage >= 70) return <AlertCircle className="h-5 w-5" />
    return <XCircle className="h-5 w-5" />
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Quality Overview
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

  if (!metrics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load data quality metrics</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Quality Overview
          </CardTitle>
          <Badge 
            variant={metrics.issues.length === 0 ? "default" : "destructive"}
            className="gap-1"
          >
            {metrics.issues.length === 0 ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Healthy
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                {metrics.issues.length} Issue{metrics.issues.length > 1 ? 's' : ''}
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quality Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Completeness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Completeness</span>
              </div>
              <div className={cn("flex items-center gap-1", getStatusColor(metrics.completeness))}>
                {getStatusIcon(metrics.completeness)}
                <span className="text-sm font-bold">{metrics.completeness.toFixed(1)}%</span>
              </div>
            </div>
            <Progress 
              value={metrics.completeness} 
              className="h-2"
              indicatorClassName={getProgressColor(metrics.completeness)}
            />
            <p className="text-xs text-muted-foreground">
              {metrics.connected_sources}/{metrics.total_sources} data sources connected
            </p>
          </div>

          {/* Validity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Validity</span>
              </div>
              <div className={cn("flex items-center gap-1", getStatusColor(metrics.validity))}>
                {getStatusIcon(metrics.validity)}
                <span className="text-sm font-bold">{metrics.validity.toFixed(1)}%</span>
              </div>
            </div>
            <Progress 
              value={metrics.validity} 
              className="h-2"
              indicatorClassName={getProgressColor(metrics.validity)}
            />
            <p className="text-xs text-muted-foreground">
              {metrics.recent_uploads} successful, {metrics.failed_uploads} failed uploads
            </p>
          </div>
        </div>

        {/* Data Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold">
              {metrics.total_records >= 1000000 
                ? `${(metrics.total_records / 1000000).toFixed(1)}M` 
                : metrics.total_records >= 1000
                ? `${(metrics.total_records / 1000).toFixed(1)}K`
                : metrics.total_records}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Connected Sources</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics.connected_sources}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recent Uploads</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.recent_uploads}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Failed Uploads</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics.failed_uploads}
            </p>
          </div>
        </div>

        {/* Issues Alert */}
        {metrics.issues.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Data Quality Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {metrics.issues.map((issue, idx) => (
                  <li key={idx} className="text-sm">{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useState } from "react"
import { KpiCard } from "./kpi-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KpiData {
  value: number
  unit: string
  change: number
  trend: number[]
  subtitle: string
  icon: string
  color: string
}

interface KpiResponse {
  success: boolean
  data: {
    total_capacity: KpiData
    active_generation: KpiData
    grid_load: KpiData
    market_price: KpiData
    system_efficiency: KpiData
    optimization_runs: KpiData
    job_success_rate: KpiData
    data_quality: KpiData
  }
  timestamp: string
  period_hours: number
}

export function KpiGrid() {
  const [kpiData, setKpiData] = useState<KpiResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchKpiData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      
      const response = await fetch('/api/kpi?hours=24')
      const result: KpiResponse = await response.json()

      if (result.success) {
        setKpiData(result.data)
        setLastUpdated(new Date(result.timestamp).toLocaleTimeString())
        setError(null)
      } else {
        setError('Failed to fetch KPI data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchKpiData()

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchKpiData()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchKpiData(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Key Performance Indicators</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 p-6 border rounded-lg">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!kpiData) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Key Performance Indicators</h2>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capacity */}
        <KpiCard
          title="Total Capacity"
          value={kpiData.total_capacity.value}
          unit={kpiData.total_capacity.unit}
          change={kpiData.total_capacity.change}
          trend={kpiData.total_capacity.trend}
          subtitle={kpiData.total_capacity.subtitle}
          icon={kpiData.total_capacity.icon}
          color={kpiData.total_capacity.color as any}
          href="/generation"
        />

        {/* Active Generation */}
        <KpiCard
          title="Active Generation"
          value={kpiData.active_generation.value}
          unit={kpiData.active_generation.unit}
          change={kpiData.active_generation.change}
          trend={kpiData.active_generation.trend}
          subtitle={kpiData.active_generation.subtitle}
          icon={kpiData.active_generation.icon}
          color={kpiData.active_generation.color as any}
          href="/generation"
        />

        {/* Grid Load */}
        <KpiCard
          title="Grid Load"
          value={kpiData.grid_load.value}
          unit={kpiData.grid_load.unit}
          change={kpiData.grid_load.change}
          trend={kpiData.grid_load.trend}
          subtitle={kpiData.grid_load.subtitle}
          icon={kpiData.grid_load.icon}
          color={kpiData.grid_load.color as any}
          href="/consumption"
        />

        {/* Market Price */}
        <KpiCard
          title="Market Price"
          value={kpiData.market_price.value}
          unit={kpiData.market_price.unit}
          change={kpiData.market_price.change}
          trend={kpiData.market_price.trend}
          subtitle={kpiData.market_price.subtitle}
          icon={kpiData.market_price.icon}
          color={kpiData.market_price.color as any}
          href="/analytics"
        />

        {/* System Efficiency */}
        <KpiCard
          title="System Efficiency"
          value={kpiData.system_efficiency.value}
          unit={kpiData.system_efficiency.unit}
          change={kpiData.system_efficiency.change}
          trend={kpiData.system_efficiency.trend}
          subtitle={kpiData.system_efficiency.subtitle}
          icon={kpiData.system_efficiency.icon}
          color={kpiData.system_efficiency.color as any}
          href="/generation"
        />

        {/* Optimization Runs */}
        <KpiCard
          title="Optimization Runs"
          value={kpiData.optimization_runs.value}
          unit={kpiData.optimization_runs.unit}
          change={kpiData.optimization_runs.change}
          trend={kpiData.optimization_runs.trend}
          subtitle={kpiData.optimization_runs.subtitle}
          icon={kpiData.optimization_runs.icon}
          color={kpiData.optimization_runs.color as any}
          href="/sandbox?tab=optimization"
        />

        {/* Job Success Rate */}
        <KpiCard
          title="Job Success Rate"
          value={kpiData.job_success_rate.value}
          unit={kpiData.job_success_rate.unit}
          change={kpiData.job_success_rate.change}
          trend={kpiData.job_success_rate.trend}
          subtitle={kpiData.job_success_rate.subtitle}
          icon={kpiData.job_success_rate.icon}
          color={kpiData.job_success_rate.color as any}
          href="/sandbox?tab=optimization"
        />

        {/* Data Quality */}
        <KpiCard
          title="Data Quality"
          value={kpiData.data_quality.value}
          unit={kpiData.data_quality.unit}
          change={kpiData.data_quality.change}
          trend={kpiData.data_quality.trend}
          subtitle={kpiData.data_quality.subtitle}
          icon={kpiData.data_quality.icon}
          color={kpiData.data_quality.color as any}
          href="/sandbox"
        />
      </div>
    </div>
  )
}

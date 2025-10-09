"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from 'recharts'
import { Play, Download, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"

interface RMOOptimizationChartsProps {
  dataSourceId: string
}

export function RMOOptimizationCharts({ dataSourceId }: RMOOptimizationChartsProps) {
  const [results, setResults] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [filterOptions, setFilterOptions] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedPlant, setSelectedPlant] = useState<string>("all")

  useEffect(() => {
    if (dataSourceId) {
      fetchResults()
    }
  }, [dataSourceId])

  const fetchResults = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/optimize/results?data_source_id=${dataSourceId}&limit=1000`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.data.results)
        setMetrics(data.data.metrics)
        setFilterOptions(data.data.filterOptions)
        
        // Auto-select latest model
        if (data.data.filterOptions.modelIds.length > 0) {
          setSelectedModel(data.data.filterOptions.modelIds[0])
        }
      }
    } catch (error) {
      console.error("Error fetching optimization results:", error)
    } finally {
      setLoading(false)
    }
  }

  const runOptimization = async () => {
    setOptimizing(true)
    try {
      const response = await fetch('/api/optimize/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id: dataSourceId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh results after optimization
        await fetchResults()
        alert(`Optimization completed successfully!\nModel ID: ${data.data.model_id}\nSolve Time: ${data.data.solve_time_ms}ms`)
      } else {
        alert(`Optimization failed: ${data.error}\n${data.details || ''}`)
      }
    } catch (error) {
      console.error("Error running optimization:", error)
      alert("Failed to run optimization. Check console for details.")
    } finally {
      setOptimizing(false)
    }
  }

  // Filter results by selected model and plant
  const filteredResults = results.filter(r => {
    if (selectedModel && r.model_id !== selectedModel) return false
    if (selectedPlant !== "all" && r.plant_name !== selectedPlant) return false
    return true
  })

  // Prepare data for Price Comparison Chart
  const priceComparisonData = filteredResults.map(r => ({
    timeBlock: r.time_block,
    plant: r.plant_name,
    DAM: r.dam_price || 0,
    GDAM: r.gdam_price || 0,
    RTM: r.rtm_price || 0
  })).sort((a, b) => a.timeBlock - b.timeBlock)

  // Prepare data for Schedule vs Results Chart
  const scheduleVsResultsData = filteredResults.map(r => ({
    timeBlock: r.time_block,
    plant: r.plant_name,
    Scheduled: r.scheduled_mw || 0,
    Optimized: r.model_results_mw || 0,
    difference: (r.model_results_mw || 0) - (r.scheduled_mw || 0)
  })).sort((a, b) => a.timeBlock - b.timeBlock)

  // Prepare data for Technology Mix Chart
  const technologyMixData = Object.entries(
    filteredResults.reduce((acc, r) => {
      const tech = r.technology_type || 'Unknown'
      if (!acc[tech]) acc[tech] = 0
      acc[tech] += r.model_results_mw || 0
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  // Prepare data for Regional Distribution
  const regionalData = Object.entries(
    filteredResults.reduce((acc, r) => {
      const region = r.region || 'Unknown'
      if (!acc[region]) acc[region] = { scheduled: 0, optimized: 0 }
      acc[region].scheduled += r.scheduled_mw || 0
      acc[region].optimized += r.model_results_mw || 0
      return acc
    }, {} as Record<string, any>)
  ).map(([region, data]) => ({ region, ...data }))

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">RMO Optimization Results</h3>
          <p className="text-sm text-muted-foreground">Real-time Market Optimization Analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={runOptimization} 
            disabled={optimizing || !dataSourceId}
            size="sm"
          >
            {optimizing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Optimization
              </>
            )}
          </Button>
          <Button onClick={fetchResults} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalResults}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Scheduled MW</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalScheduledMW.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Optimized MW</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOptimizedMW.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Solve Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageSolveTime.toFixed(0)}ms</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {filterOptions && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Model Run</label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select model run" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.modelIds.map((id: string) => (
                  <SelectItem key={id} value={id}>{id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Plant</label>
            <Select value={selectedPlant} onValueChange={setSelectedPlant}>
              <SelectTrigger>
                <SelectValue placeholder="Select plant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                {filterOptions.plantNames.map((name: string) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Charts */}
      {filteredResults.length > 0 ? (
        <>
          {/* Price Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Comparison (DAM vs GDAM vs RTM)</CardTitle>
              <CardDescription>Market prices across time blocks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeBlock" label={{ value: 'Time Block', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Price (₹/MWh)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="DAM" stroke="#8884d8" name="DAM Price" />
                  <Line type="monotone" dataKey="GDAM" stroke="#82ca9d" name="GDAM Price" />
                  <Line type="monotone" dataKey="RTM" stroke="#ffc658" name="RTM Price" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Schedule vs Optimized Results */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled vs Optimized Generation</CardTitle>
              <CardDescription>Comparison of scheduled and optimization results</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={scheduleVsResultsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeBlock" label={{ value: 'Time Block', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Scheduled" fill="#8884d8" name="Scheduled MW" />
                  <Bar dataKey="Optimized" fill="#82ca9d" name="Optimized MW" />
                  <Line type="monotone" dataKey="difference" stroke="#ff7300" name="Difference" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technology Mix */}
            <Card>
              <CardHeader>
                <CardTitle>Technology Mix</CardTitle>
                <CardDescription>Optimized generation by technology type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={technologyMixData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" name="Generation (MW)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
                <CardDescription>Scheduled vs optimized by region</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={regionalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="scheduled" fill="#8884d8" name="Scheduled" />
                    <Bar dataKey="optimized" fill="#82ca9d" name="Optimized" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Optimization Results Yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Run an optimization to see results and analytics
            </p>
            <Button onClick={runOptimization} disabled={optimizing || !dataSourceId}>
              <Play className="w-4 h-4 mr-2" />
              Run First Optimization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

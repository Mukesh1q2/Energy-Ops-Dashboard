"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  CheckCircle, 
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  GitCompare,
  FileText,
  Download,
  RefreshCw
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"

interface OptimizationRun {
  id: string
  timestamp: string
  model_type: 'DMO' | 'RMO' | 'SO'
  status: 'success' | 'failed' | 'partial'
  duration_sec: number
  cost_savings: number
  efficiency: number
  parameters: Record<string, any>
  metrics: {
    convergence_iterations?: number
    response_time_ms?: number
    total_cycles?: number
    peak_shaving?: number
    load_factor?: number
    grid_dependence_reduction?: number
  }
}

export function OptimizationRunComparisons() {
  const [runs, setRuns] = useState<OptimizationRun[]>([])
  const [selectedRuns, setSelectedRuns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modelFilter, setModelFilter] = useState<'all' | 'DMO' | 'RMO' | 'SO'>('all')

  useEffect(() => {
    fetchOptimizationRuns()
  }, [modelFilter])

  const fetchOptimizationRuns = async () => {
    try {
      const response = await fetch(`/api/optimization/runs?model=${modelFilter}`)
      const result = await response.json()
      
      if (result.success) {
        setRuns(result.data)
      } else {
        // Mock data for development
        const mockRuns: OptimizationRun[] = [
          {
            id: 'run-001',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            model_type: 'DMO',
            status: 'success',
            duration_sec: 42.5,
            cost_savings: 135000,
            efficiency: 95.2,
            parameters: {
              price_limit_min: 2.5,
              price_limit_max: 6.5,
              volume_constraint: 5000,
              convergence_threshold: 0.001
            },
            metrics: {
              convergence_iterations: 23,
              peak_shaving: 18.5,
              load_factor: 0.82,
              grid_dependence_reduction: 22.3
            }
          },
          {
            id: 'run-002',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            model_type: 'DMO',
            status: 'success',
            duration_sec: 38.2,
            cost_savings: 128000,
            efficiency: 93.8,
            parameters: {
              price_limit_min: 2.0,
              price_limit_max: 7.0,
              volume_constraint: 4500,
              convergence_threshold: 0.002
            },
            metrics: {
              convergence_iterations: 19,
              peak_shaving: 16.2,
              load_factor: 0.78,
              grid_dependence_reduction: 20.5
            }
          },
          {
            id: 'run-003',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            model_type: 'RMO',
            status: 'success',
            duration_sec: 12.3,
            cost_savings: 52000,
            efficiency: 96.5,
            parameters: {
              response_time_target: 500,
              price_limit_min: 3.0,
              time_window: 15
            },
            metrics: {
              response_time_ms: 425,
              peak_shaving: 12.8,
              load_factor: 0.85
            }
          },
          {
            id: 'run-004',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            model_type: 'SO',
            status: 'success',
            duration_sec: 8.7,
            cost_savings: 38000,
            efficiency: 94.1,
            parameters: {
              max_charge_rate: 1000,
              max_discharge_rate: 1000,
              min_soc: 20,
              max_soc: 90
            },
            metrics: {
              total_cycles: 32,
              peak_shaving: 14.2,
              load_factor: 0.81,
              grid_dependence_reduction: 18.7
            }
          },
          {
            id: 'run-005',
            timestamp: new Date(Date.now() - 18000000).toISOString(),
            model_type: 'DMO',
            status: 'partial',
            duration_sec: 51.2,
            cost_savings: 115000,
            efficiency: 89.5,
            parameters: {
              price_limit_min: 2.8,
              price_limit_max: 6.0,
              volume_constraint: 5500,
              convergence_threshold: 0.0005
            },
            metrics: {
              convergence_iterations: 45,
              peak_shaving: 15.1,
              load_factor: 0.75,
              grid_dependence_reduction: 19.2
            }
          }
        ]
        setRuns(mockRuns)
      }
    } catch (error) {
      console.error('Error fetching optimization runs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRunSelection = (runId: string) => {
    setSelectedRuns(prev => {
      if (prev.includes(runId)) {
        return prev.filter(id => id !== runId)
      } else if (prev.length < 3) {
        return [...prev, runId]
      }
      return prev
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Success</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      case 'partial':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Partial</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const calculateDifference = (value1: number, value2: number) => {
    const diff = value1 - value2
    const percentage = value2 !== 0 ? ((diff / value2) * 100).toFixed(1) : '0'
    return { diff, percentage }
  }

  const getDifferenceIcon = (diff: number) => {
    if (diff > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (diff < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const selectedRunsData = runs.filter(run => selectedRuns.includes(run.id))

  const comparisonChartData = selectedRunsData.map(run => ({
    name: `Run ${run.id.slice(-3)}`,
    costSavings: run.cost_savings / 1000,
    efficiency: run.efficiency,
    duration: run.duration_sec,
    peakShaving: run.metrics.peak_shaving || 0,
    loadFactor: (run.metrics.load_factor || 0) * 100
  }))

  const radarData = selectedRunsData.length === 2 ? [
    {
      metric: 'Efficiency',
      run1: selectedRunsData[0]?.efficiency || 0,
      run2: selectedRunsData[1]?.efficiency || 0
    },
    {
      metric: 'Peak Shaving',
      run1: selectedRunsData[0]?.metrics.peak_shaving || 0,
      run2: selectedRunsData[1]?.metrics.peak_shaving || 0
    },
    {
      metric: 'Load Factor',
      run1: (selectedRunsData[0]?.metrics.load_factor || 0) * 100,
      run2: (selectedRunsData[1]?.metrics.load_factor || 0) * 100
    },
    {
      metric: 'Grid Reduction',
      run1: selectedRunsData[0]?.metrics.grid_dependence_reduction || 0,
      run2: selectedRunsData[1]?.metrics.grid_dependence_reduction || 0
    }
  ] : []

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
            <GitCompare className="w-8 h-8" />
            Optimization Run Comparisons
          </h2>
          <p className="text-muted-foreground">Compare historical optimization runs side-by-side</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={modelFilter} onValueChange={(val: any) => setModelFilter(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              <SelectItem value="DMO">DMO Only</SelectItem>
              <SelectItem value="RMO">RMO Only</SelectItem>
              <SelectItem value="SO">SO Only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={fetchOptimizationRuns}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {selectedRuns.length} run{selectedRuns.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Select up to 3 runs from the table below to compare
              </p>
            </div>
            {selectedRuns.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setSelectedRuns([])}>
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Optimization Runs</CardTitle>
          <CardDescription>Click on rows to select runs for comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost Savings</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map(run => (
                  <TableRow 
                    key={run.id}
                    className={`cursor-pointer ${selectedRuns.includes(run.id) ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                    onClick={() => toggleRunSelection(run.id)}
                  >
                    <TableCell>
                      <input 
                        type="checkbox" 
                        checked={selectedRuns.includes(run.id)}
                        onChange={() => toggleRunSelection(run.id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{run.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(run.timestamp).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{run.model_type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {run.duration_sec.toFixed(1)}s
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{(run.cost_savings / 1000).toFixed(0)}K</TableCell>
                    <TableCell>{run.efficiency.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {selectedRunsData.length >= 2 && (
        <>
          {/* Side-by-Side Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of selected optimization runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {selectedRunsData.map(run => (
                        <TableHead key={run.id}>{run.id}</TableHead>
                      ))}
                      {selectedRunsData.length === 2 && <TableHead>Difference</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Model Type</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id}>
                          <Badge variant="secondary">{run.model_type}</Badge>
                        </TableCell>
                      ))}
                      {selectedRunsData.length === 2 && <TableCell>-</TableCell>}
                    </TableRow>
                    
                    <TableRow>
                      <TableCell className="font-medium">Status</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id}>{getStatusBadge(run.status)}</TableCell>
                      ))}
                      {selectedRunsData.length === 2 && <TableCell>-</TableCell>}
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Duration (sec)</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id}>{run.duration_sec.toFixed(1)}s</TableCell>
                      ))}
                      {selectedRunsData.length === 2 && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(selectedRunsData[0].duration_sec - selectedRunsData[1].duration_sec)}
                            <span>
                              {calculateDifference(selectedRunsData[0].duration_sec, selectedRunsData[1].duration_sec).percentage}%
                            </span>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Cost Savings (₹)</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id} className="font-semibold">₹{(run.cost_savings / 1000).toFixed(0)}K</TableCell>
                      ))}
                      {selectedRunsData.length === 2 && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(selectedRunsData[0].cost_savings - selectedRunsData[1].cost_savings)}
                            <span className="font-semibold">
                              {calculateDifference(selectedRunsData[0].cost_savings, selectedRunsData[1].cost_savings).percentage}%
                            </span>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Efficiency (%)</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id}>{run.efficiency.toFixed(1)}%</TableCell>
                      ))}
                      {selectedRunsData.length === 2 && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(selectedRunsData[0].efficiency - selectedRunsData[1].efficiency)}
                            <span>
                              {calculateDifference(selectedRunsData[0].efficiency, selectedRunsData[1].efficiency).percentage}%
                            </span>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Peak Shaving (%)</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id}>{run.metrics.peak_shaving?.toFixed(1) || 'N/A'}</TableCell>
                      ))}
                      {selectedRunsData.length === 2 && selectedRunsData[0].metrics.peak_shaving && selectedRunsData[1].metrics.peak_shaving && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(selectedRunsData[0].metrics.peak_shaving - selectedRunsData[1].metrics.peak_shaving)}
                            <span>
                              {calculateDifference(selectedRunsData[0].metrics.peak_shaving, selectedRunsData[1].metrics.peak_shaving).percentage}%
                            </span>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>

                    <TableRow>
                      <TableCell className="font-medium">Load Factor</TableCell>
                      {selectedRunsData.map(run => (
                        <TableCell key={run.id}>{run.metrics.load_factor?.toFixed(2) || 'N/A'}</TableCell>
                      ))}
                      {selectedRunsData.length === 2 && selectedRunsData[0].metrics.load_factor && selectedRunsData[1].metrics.load_factor && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDifferenceIcon(selectedRunsData[0].metrics.load_factor - selectedRunsData[1].metrics.load_factor)}
                            <span>
                              {calculateDifference(selectedRunsData[0].metrics.load_factor, selectedRunsData[1].metrics.load_factor).percentage}%
                            </span>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Visual Comparisons */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Cost Savings & Efficiency</CardTitle>
                <CardDescription>Comparative analysis of financial and operational performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="costSavings" fill="#8884d8" name="Cost Savings (₹K)" />
                    <Bar yAxisId="right" dataKey="efficiency" fill="#82ca9d" name="Efficiency (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart for 2 runs */}
            {selectedRunsData.length === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Radar</CardTitle>
                  <CardDescription>Multi-dimensional performance comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis />
                      <Radar name={selectedRunsData[0].id} dataKey="run1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name={selectedRunsData[1].id} dataKey="run2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Parameters Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Parameters</CardTitle>
              <CardDescription>Optimization settings used in each run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedRunsData.map(run => (
                  <Card key={run.id} className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{run.id}</CardTitle>
                      <CardDescription>{new Date(run.timestamp).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(run.parameters).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Export Comparison Report</p>
                  <p className="text-sm text-muted-foreground">Download detailed comparison analysis</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    PDF Report
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Excel Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedRunsData.length === 1 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Select at least one more run to enable comparison view
            </p>
          </CardContent>
        </Card>
      )}

      {selectedRunsData.length === 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Select runs from the table above to start comparing optimization results
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

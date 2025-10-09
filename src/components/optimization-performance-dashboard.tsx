"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap,
  Battery,
  DollarSign,
  Target,
  AlertTriangle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"

interface PerformanceMetrics {
  dmo: {
    total_runs: number
    successful_runs: number
    failed_runs: number
    avg_duration_sec: number
    avg_cost_savings: number
    avg_efficiency: number
    last_run_status: string
    trend: 'up' | 'down' | 'stable'
  }
  rmo: {
    total_runs: number
    successful_runs: number
    failed_runs: number
    avg_duration_sec: number
    avg_response_time_ms: number
    avg_efficiency: number
    last_run_status: string
    trend: 'up' | 'down' | 'stable'
  }
  so: {
    total_runs: number
    successful_runs: number
    failed_runs: number
    avg_duration_sec: number
    avg_cycle_efficiency: number
    total_cycles: number
    last_run_status: string
    trend: 'up' | 'down' | 'stable'
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function OptimizationPerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')
  const [historicalData, setHistoricalData] = useState<any[]>([])

  useEffect(() => {
    fetchPerformanceData()
    fetchHistoricalData()
    
    const interval = setInterval(() => {
      fetchPerformanceData()
      fetchHistoricalData()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [timeRange])

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch(`/api/optimization/performance?range=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setMetrics(result.data)
      } else {
        // Mock data for development
        setMetrics({
          dmo: {
            total_runs: 30,
            successful_runs: 28,
            failed_runs: 2,
            avg_duration_sec: 45.3,
            avg_cost_savings: 125000,
            avg_efficiency: 94.5,
            last_run_status: 'success',
            trend: 'up'
          },
          rmo: {
            total_runs: 336,
            successful_runs: 328,
            failed_runs: 8,
            avg_duration_sec: 12.7,
            avg_response_time_ms: 450,
            avg_efficiency: 96.2,
            last_run_status: 'success',
            trend: 'stable'
          },
          so: {
            total_runs: 672,
            successful_runs: 660,
            failed_runs: 12,
            avg_duration_sec: 8.5,
            avg_cycle_efficiency: 93.8,
            total_cycles: 140,
            last_run_status: 'success',
            trend: 'up'
          }
        })
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistoricalData = async () => {
    try {
      const response = await fetch(`/api/optimization/historical?range=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setHistoricalData(result.data)
      } else {
        // Mock historical data
        const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30
        const mockData = Array.from({ length: days }, (_, i) => ({
          date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dmo_success: Math.floor(Math.random() * 5) + 25,
          rmo_success: Math.floor(Math.random() * 20) + 40,
          so_success: Math.floor(Math.random() * 30) + 60,
          efficiency: Math.floor(Math.random() * 10) + 90,
          cost_savings: Math.floor(Math.random() * 50000) + 100000
        }))
        setHistoricalData(mockData)
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
    }
  }

  const calculateSuccessRate = (successful: number, total: number) => {
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  if (loading || !metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  const distributionData = [
    { name: 'DMO Success', value: metrics.dmo.successful_runs, color: '#10B981' },
    { name: 'RMO Success', value: metrics.rmo.successful_runs, color: '#3B82F6' },
    { name: 'SO Success', value: metrics.so.successful_runs, color: '#F59E0B' },
    { name: 'Failed', value: metrics.dmo.failed_runs + metrics.rmo.failed_runs + metrics.so.failed_runs, color: '#EF4444' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Optimization Performance Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive analytics and KPIs for all optimization models</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={timeRange === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('24h')}
          >
            24h
          </Button>
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7d
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30d
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchPerformanceData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Runs</p>
                <p className="text-3xl font-bold">{metrics.dmo.total_runs + metrics.rmo.total_runs + metrics.so.total_runs}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all models</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {calculateSuccessRate(
                    metrics.dmo.successful_runs + metrics.rmo.successful_runs + metrics.so.successful_runs,
                    metrics.dmo.total_runs + metrics.rmo.total_runs + metrics.so.total_runs
                  )}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Cost Savings</p>
                <p className="text-3xl font-bold text-purple-600">₹{(metrics.dmo.avg_cost_savings / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Per optimization run</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                <p className="text-3xl font-bold text-orange-600">
                  {((metrics.dmo.avg_efficiency + metrics.rmo.avg_efficiency + metrics.so.avg_cycle_efficiency) / 3).toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all models</p>
          </CardContent>
        </Card>
      </div>

      {/* Model-Specific KPIs */}
      <Tabs defaultValue="dmo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dmo">DMO</TabsTrigger>
          <TabsTrigger value="rmo">RMO</TabsTrigger>
          <TabsTrigger value="so">SO</TabsTrigger>
        </TabsList>

        {/* DMO Tab */}
        <TabsContent value="dmo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {calculateSuccessRate(metrics.dmo.successful_runs, metrics.dmo.total_runs)}%
                  {getTrendIcon(metrics.dmo.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {metrics.dmo.successful_runs} / {metrics.dmo.total_runs} runs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg Duration</CardDescription>
                <CardTitle className="text-2xl">{metrics.dmo.avg_duration_sec.toFixed(1)}s</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Optimization execution time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cost Savings</CardDescription>
                <CardTitle className="text-2xl">₹{(metrics.dmo.avg_cost_savings / 1000).toFixed(0)}K</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Average per run</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Run Status Distribution</CardTitle>
              <CardDescription>DMO optimization run outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'Success', value: metrics.dmo.successful_runs, fill: '#10B981' },
                          { name: 'Failed', value: metrics.dmo.failed_runs, fill: '#EF4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                        label
                      />
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Successful
                    </span>
                    <Badge variant="outline">{metrics.dmo.successful_runs}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Failed
                    </span>
                    <Badge variant="destructive">{metrics.dmo.failed_runs}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Total
                    </span>
                    <Badge>{metrics.dmo.total_runs}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RMO Tab */}
        <TabsContent value="rmo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {calculateSuccessRate(metrics.rmo.successful_runs, metrics.rmo.total_runs)}%
                  {getTrendIcon(metrics.rmo.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {metrics.rmo.successful_runs} / {metrics.rmo.total_runs} runs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Response Time</CardDescription>
                <CardTitle className="text-2xl">{metrics.rmo.avg_response_time_ms}ms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Efficiency</CardDescription>
                <CardTitle className="text-2xl">{metrics.rmo.avg_efficiency.toFixed(1)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Optimization efficiency</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SO Tab */}
        <TabsContent value="so" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Success Rate</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {calculateSuccessRate(metrics.so.successful_runs, metrics.so.total_runs)}%
                  {getTrendIcon(metrics.so.trend)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {metrics.so.successful_runs} / {metrics.so.total_runs} runs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Cycles</CardDescription>
                <CardTitle className="text-2xl">{metrics.so.total_cycles}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Charge/discharge cycles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cycle Efficiency</CardDescription>
                <CardTitle className="text-2xl">{metrics.so.avg_cycle_efficiency.toFixed(1)}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Round-trip efficiency</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Historical Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Performance Trends</CardTitle>
          <CardDescription>Optimization success rates over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="dmo_success" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="DMO" />
              <Area type="monotone" dataKey="rmo_success" stackId="1" stroke="#10B981" fill="#10B981" name="RMO" />
              <Area type="monotone" dataKey="so_success" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="SO" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost Savings Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Savings Trend</CardTitle>
          <CardDescription>Average cost savings per optimization run</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => `₹${(value / 1000).toFixed(0)}K`} />
              <Legend />
              <Line type="monotone" dataKey="cost_savings" stroke="#8B5CF6" strokeWidth={2} name="Cost Savings (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Performance Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.dmo.failed_runs > 2 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">DMO Failure Rate High</p>
                <p className="text-sm text-muted-foreground">
                  Consider adjusting convergence thresholds or volume constraints to improve success rate.
                </p>
              </div>
            </div>
          )}
          
          {metrics.rmo.avg_response_time_ms > 500 && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">RMO Response Time</p>
                <p className="text-sm text-muted-foreground">
                  Response time is above target ({metrics.rmo.avg_response_time_ms}ms). Optimize queries or increase server resources.
                </p>
              </div>
            </div>
          )}
          
          {metrics.so.avg_cycle_efficiency < 95 && (
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <Battery className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">SO Cycle Efficiency</p>
                <p className="text-sm text-muted-foreground">
                  Current efficiency at {metrics.so.avg_cycle_efficiency.toFixed(1)}%. Review charge/discharge rates and degradation factors.
                </p>
              </div>
            </div>
          )}

          {metrics.dmo.successful_runs + metrics.rmo.successful_runs + metrics.so.successful_runs > 1000 && (
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Excellent Performance!</p>
                <p className="text-sm text-muted-foreground">
                  System is running optimally with high success rates across all models. Keep monitoring for anomalies.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  ScatterChart,
  Scatter,
  Legend,
  ReferenceLine,
  ErrorBar
} from "recharts"
import { 
  Zap, 
  TrendingUp, 
  Brain, 
  Activity, 
  AlertTriangle,
  Download,
  RefreshCw,
  Target,
  BarChart3
} from "lucide-react"

interface RealTimeData {
  timestamp: string
  value: number
  upper_bound: number
  lower_bound: number
  anomaly_score: number
}

interface ComparativeData {
  period: string
  current: number
  previous: number
  benchmark: number
  variance: number
}

interface PredictiveData {
  period: string
  actual: number | null
  predicted: number
  confidence_lower: number
  confidence_upper: number
  accuracy: number
}

export function RealTimeChart() {
  const [data, setData] = useState<RealTimeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [metric, setMetric] = useState<string>('load')

  useEffect(() => {
    const fetchData = () => {
      // Generate real-time data with anomalies
      const now = new Date()
      const newData: RealTimeData[] = Array.from({ length: 50 }, (_, i) => {
        const timestamp = new Date(now.getTime() - (49 - i) * 60000).toISOString()
        const baseValue = Math.sin(i / 10) * 30 + 70
        const noise = Math.random() * 10 - 5
        const value = baseValue + noise
        const isAnomaly = Math.random() < 0.05 // 5% chance of anomaly
        const anomalyValue = isAnomaly ? value + (Math.random() * 40 - 20) : value
        
        return {
          timestamp,
          value: anomalyValue,
          upper_bound: baseValue + 15,
          lower_bound: baseValue - 15,
          anomaly_score: isAnomaly ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3
        }
      })
      setData(newData)
      setIsLoading(false)
    }

    fetchData()
    
    // Update data every 2 seconds for real-time effect
    const interval = setInterval(fetchData, 2000)
    
    return () => clearInterval(interval)
  }, [metric])

  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    value: item.value,
    upperBound: item.upper_bound,
    lowerBound: item.lower_bound,
    anomalyScore: item.anomaly_score
  }))

  const anomalies = data.filter(item => item.anomaly_score > 0.7)
  const currentValue = data.length > 0 ? data[data.length - 1].value : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Real-time Monitoring
              </CardTitle>
              <CardDescription>
                Live data streaming with anomaly detection and alerting
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="load">System Load</SelectItem>
                  <SelectItem value="frequency">Frequency</SelectItem>
                  <SelectItem value="voltage">Voltage</SelectItem>
                  <SelectItem value="temperature">Temperature</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Initializing real-time data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="upperBound" 
                      fill="#ff6b6b" 
                      fillOpacity={0.1}
                      stroke="none"
                      name="Upper Bound"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lowerBound" 
                      fill="#4ecdc4" 
                      fillOpacity={0.1}
                      stroke="none"
                      name="Lower Bound"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Current Value"
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 3 }}
                    />
                    <Scatter 
                      data={chartData.filter(d => d.anomalyScore > 0.7)} 
                      fill="#ff6b6b" 
                      name="Anomalies"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{currentValue.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Current Value</div>
                  <Activity className="w-4 h-4 mx-auto mt-1 text-blue-600" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {((data.length - anomalies.length) / data.length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Normal Operation</div>
                  <Target className="w-4 h-4 mx-auto mt-1 text-green-600" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{anomalies.length}</div>
                  <div className="text-sm text-muted-foreground">Anomalies Detected</div>
                  <AlertTriangle className="w-4 h-4 mx-auto mt-1 text-red-600" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">2s</div>
                  <div className="text-sm text-muted-foreground">Update Interval</div>
                  <Zap className="w-4 h-4 mx-auto mt-1 text-purple-600" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Live Streaming</Badge>
            <Badge variant="outline">Anomaly Detection</Badge>
            <Badge variant="outline">Real-time Alerts</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function ComparativeChart() {
  const [data, setData] = useState<ComparativeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<string>('monthly')

  useEffect(() => {
    const fetchData = () => {
      // Generate comparative data
      const periods = timeframe === 'monthly' 
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        : timeframe === 'quarterly'
        ? ['Q1', 'Q2', 'Q3', 'Q4']
        : ['Week 1', 'Week 2', 'Week 3', 'Week 4']

      const comparativeData: ComparativeData[] = periods.map((period, i) => ({
        period,
        current: Math.random() * 100 + 50 + i * 5,
        previous: Math.random() * 90 + 45 + i * 3,
        benchmark: 80 + i * 2,
        variance: (Math.random() - 0.5) * 20
      }))
      setData(comparativeData)
      setIsLoading(false)
    }

    fetchData()
  }, [timeframe])

  const chartData = data.map(item => ({
    period: item.period,
    current: item.current,
    previous: item.previous,
    benchmark: item.benchmark,
    variance: item.variance,
    performance: ((item.current - item.previous) / item.previous * 100)
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Comparative Analysis
              </CardTitle>
              <CardDescription>
                Period-over-period comparison with benchmark analysis
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading comparative data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="current" fill="#8884d8" name="Current Period" />
                    <Bar dataKey="previous" fill="#82ca9d" name="Previous Period" />
                    <Bar dataKey="benchmark" fill="#ffc658" name="Benchmark" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Growth</span>
                        <span className="font-medium text-green-600">
                          {chartData.reduce((sum, item) => sum + item.performance, 0) / chartData.length > 0 
                            ? (chartData.reduce((sum, item) => sum + item.performance, 0) / chartData.length).toFixed(1) 
                            : '0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">vs Benchmark</span>
                        <span className="font-medium text-blue-600">
                          {chartData.length > 0 
                            ? ((chartData[chartData.length - 1].current - chartData[chartData.length - 1].benchmark) / chartData[chartData.length - 1].benchmark * 100).toFixed(1)
                            : '0'}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Variance</span>
                        <span className="font-medium text-purple-600">
                          {chartData.length > 0 
                            ? (Math.abs(chartData[chartData.length - 1].variance)).toFixed(1)
                            : '0'}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trend Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="period" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="performance" stroke="#82ca9d" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          chartData.length > 0 && chartData[chartData.length - 1].performance > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span>
                          {chartData.length > 0 && chartData[chartData.length - 1].performance > 0 ? 'Positive' : 'Negative'} growth trend
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          chartData.length > 0 && chartData[chartData.length - 1].current > chartData[chartData.length - 1].benchmark ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span>
                          {chartData.length > 0 && chartData[chartData.length - 1].current > chartData[chartData.length - 1].benchmark ? 'Outperforming' : 'Underperforming'} benchmark
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Period Comparison</Badge>
            <Badge variant="outline">Benchmark Analysis</Badge>
            <Badge variant="outline">Trend Detection</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PredictiveChart() {
  const [data, setData] = useState<PredictiveData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [model, setModel] = useState<string>('linear')

  useEffect(() => {
    const fetchData = () => {
      // Generate predictive data
      const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const predictiveData: PredictiveData[] = periods.map((period, i) => {
        const trend = i * 5 + 50
        const seasonal = Math.sin(i / 2) * 10
        const noise = Math.random() * 8 - 4
        const actual = i < 6 ? trend + seasonal + noise : null // Historical data for first 6 months
        const predicted = trend + seasonal
        const confidence = 15 - i * 0.5 // Decreasing confidence over time
        
        return {
          period,
          actual,
          predicted,
          confidence_lower: predicted - confidence,
          confidence_upper: predicted + confidence,
          accuracy: Math.max(60, 95 - i * 3) // Decreasing accuracy over time
        }
      })
      setData(predictiveData)
      setIsLoading(false)
    }

    fetchData()
  }, [model])

  const chartData = data.map(item => ({
    period: item.period,
    actual: item.actual,
    predicted: item.predicted,
    confidenceLower: item.confidence_lower,
    confidenceUpper: item.confidence_upper,
    accuracy: item.accuracy
  }))

  const overallAccuracy = data
    .filter(item => item.actual !== null)
    .reduce((sum, item, _, array) => {
      const accuracy = item.accuracy
      return sum + (accuracy / array.length)
    }, 0)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                AI-powered forecasting with confidence intervals and accuracy metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear Regression</SelectItem>
                  <SelectItem value="arima">ARIMA</SelectItem>
                  <SelectItem value="neural">Neural Network</SelectItem>
                  <SelectItem value="ensemble">Ensemble Model</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Training predictive models...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="confidenceUpper" 
                      fill="#8884d8" 
                      fillOpacity={0.1}
                      stroke="none"
                      name="Upper Confidence"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="confidenceLower" 
                      fill="#8884d8" 
                      fillOpacity={0.1}
                      stroke="none"
                      name="Lower Confidence"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#82ca9d" 
                      strokeWidth={3}
                      name="Actual"
                      connectNulls={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted"
                    />
                    <ErrorBar 
                      dataKey="predicted" 
                      strokeWidth={1}
                      width={4}
                      stroke="#8884d8"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {overallAccuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Model Accuracy</div>
                  <Brain className="w-4 h-4 mx-auto mt-1 text-purple-600" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {chartData.filter(d => d.actual !== null).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Training Points</div>
                  <BarChart3 className="w-4 h-4 mx-auto mt-1 text-blue-600" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {chartData.filter(d => d.actual === null).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Forecast Points</div>
                  <TrendingUp className="w-4 h-4 mx-auto mt-1 text-green-600" />
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {model.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Model</div>
                  <Activity className="w-4 h-4 mx-auto mt-1 text-orange-600" />
                </div>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Forecast Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Next Period Forecast</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Predicted Value:</span>
                          <span className="font-medium">
                            {chartData.length > 0 && chartData.find(d => d.actual === null)?.predicted?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence Range:</span>
                          <span className="font-medium">
                            {chartData.length > 0 && chartData.find(d => d.actual === null) 
                              ? `${chartData.find(d => d.actual === null)!.confidenceLower.toFixed(1)} - ${chartData.find(d => d.actual === null)!.confidenceUpper.toFixed(1)}`
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Model Performance</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>R² Score:</span>
                          <span className="font-medium">{(overallAccuracy / 100 * 0.95).toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>MAE:</span>
                          <span className="font-medium">{(100 - overallAccuracy) * 0.1.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Badge variant="outline">AI Forecasting</Badge>
            <Badge variant="outline">Confidence Intervals</Badge>
            <Badge variant="outline">Model Accuracy</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
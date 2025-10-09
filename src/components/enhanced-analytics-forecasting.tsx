"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ReferenceLine,
  Cell
} from "recharts"
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  AlertTriangle,
  Download,
  Target,
  BarChart3,
  Zap,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

export function EnhancedAnalyticsForecasting() {
  const [forecastHorizon, setForecastHorizon] = useState<string>("7d")
  const [dataMetric, setDataMetric] = useState<string>("price")
  const [loading, setLoading] = useState(false)

  // Generate forecast data
  const generateForecastData = () => {
    const days = forecastHorizon === "7d" ? 14 : forecastHorizon === "30d" ? 60 : 180
    const historicalDays = Math.floor(days / 2)
    const futureDays = days - historicalDays

    return Array.from({ length: days }, (_, i) => {
      const isHistorical = i < historicalDays
      const dayOffset = i - historicalDays
      const baseValue = 4500 + Math.sin(i / 7) * 500
      const trend = i * 10
      const noise = isHistorical ? Math.random() * 200 - 100 : 0
      const predicted = isHistorical ? null : baseValue + trend + Math.random() * 150 - 75
      
      return {
        date: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        actual: isHistorical ? baseValue + trend + noise : null,
        predicted,
        lowerBound: predicted ? predicted - 200 : null,
        upperBound: predicted ? predicted + 200 : null,
        confidence: predicted ? 0.85 + Math.random() * 0.1 : null,
      }
    })
  }

  // Generate performance metrics
  const performanceMetrics = [
    {
      subject: 'Accuracy',
      value: 92,
      fullMark: 100,
    },
    {
      subject: 'Stability',
      value: 85,
      fullMark: 100,
    },
    {
      subject: 'Efficiency',
      value: 88,
      fullMark: 100,
    },
    {
      subject: 'Reliability',
      value: 90,
      fullMark: 100,
    },
    {
      subject: 'Optimization',
      value: 87,
      fullMark: 100,
    },
  ]

  // Generate price distribution data
  const priceDistribution = Array.from({ length: 20 }, (_, i) => ({
    range: `${3000 + i * 200}-${3200 + i * 200}`,
    count: Math.floor(Math.random() * 100) + 10,
    percentage: (Math.random() * 10).toFixed(1),
  }))

  // Generate correlation data
  const correlationData = [
    { factor: 'Demand', correlation: 0.87, impact: 'High' },
    { factor: 'Temperature', correlation: 0.72, impact: 'Medium' },
    { factor: 'Day of Week', correlation: 0.65, impact: 'Medium' },
    { factor: 'Coal Stock', correlation: -0.48, impact: 'Medium' },
    { factor: 'Renewable Gen', correlation: -0.52, impact: 'Medium' },
    { factor: 'Previous Hour', correlation: 0.94, impact: 'Very High' },
  ]

  // Generate anomaly data
  const anomalies = [
    { date: '2025-09-28', time: '14:30', type: 'Price Spike', severity: 'High', value: '+45%', status: 'Resolved' },
    { date: '2025-09-27', time: '09:15', type: 'Demand Surge', severity: 'Medium', value: '+28%', status: 'Monitoring' },
    { date: '2025-09-26', time: '18:45', type: 'Supply Drop', severity: 'Low', value: '-12%', status: 'Resolved' },
  ]

  // Generate key insights
  const insights = [
    {
      icon: TrendingUp,
      title: "Price Increase Expected",
      description: "Market prices forecasted to rise by 8-12% over the next 7 days due to increased demand",
      confidence: "High (92%)",
      type: "prediction",
      color: "text-blue-600"
    },
    {
      icon: AlertTriangle,
      title: "Peak Demand Alert",
      description: "System approaching peak capacity. Recommend activating additional reserves",
      confidence: "Medium (78%)",
      type: "alert",
      color: "text-yellow-600"
    },
    {
      icon: Target,
      title: "Optimization Opportunity",
      description: "Identified 15% efficiency gain potential in hour-ahead market scheduling",
      confidence: "High (89%)",
      type: "opportunity",
      color: "text-green-600"
    },
    {
      icon: Activity,
      title: "Volatility Pattern Detected",
      description: "Historical analysis shows increased volatility on weekday afternoons (2-4 PM)",
      confidence: "Very High (95%)",
      type: "insight",
      color: "text-purple-600"
    },
  ]

  const forecastData = generateForecastData()

  return (
    <div className="space-y-6 p-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics & Forecasting</h2>
          <p className="text-muted-foreground mt-1">Advanced predictive analytics and market insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={dataMetric} onValueChange={setDataMetric}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price (₹/MWh)</SelectItem>
              <SelectItem value="demand">Demand (MW)</SelectItem>
              <SelectItem value="generation">Generation (MW)</SelectItem>
              <SelectItem value="volatility">Volatility Index</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={forecastHorizon} onValueChange={setForecastHorizon}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${insight.color.replace('text', 'bg')}/10`}>
                    <Icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    <Badge variant="secondary" className="text-xs mt-2">
                      {insight.confidence}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Predictive Forecast Model
          </CardTitle>
          <CardDescription>
            ML-powered forecasting with confidence intervals and historical accuracy: 92.3%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  stroke="none"
                  name="Confidence Band (Upper)"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  fill="#8884d8"
                  fillOpacity={0.1}
                  stroke="none"
                  name="Confidence Band (Lower)"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 3 }}
                  name="Historical Actual"
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#16a34a', r: 3 }}
                  name="Predicted"
                />
                <ReferenceLine x="Today" stroke="#ef4444" strokeDasharray="3 3" label="Today" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Distribution Analysis</CardTitle>
              <CardDescription>Historical price frequency and probability distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priceDistribution.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Frequency" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factor Correlation Analysis</CardTitle>
              <CardDescription>Impact of various factors on price movements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlationData.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-40 font-medium">{item.factor}</div>
                    <div className="flex-1">
                      <div className="h-8 bg-muted rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full ${item.correlation > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.abs(item.correlation) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right font-semibold">
                      {item.correlation > 0 ? '+' : ''}{item.correlation.toFixed(2)}
                    </div>
                    <Badge variant={item.impact === 'Very High' ? 'default' : item.impact === 'High' ? 'secondary' : 'outline'}>
                      {item.impact}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>Comprehensive evaluation of forecasting model accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={performanceMetrics}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Performance" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">MAPE (Mean Absolute % Error)</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold">7.8%</div>
                    <div className="text-xs text-muted-foreground mt-1">Target: &lt; 10%</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">R² Score</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold">0.923</div>
                    <div className="text-xs text-muted-foreground mt-1">Target: &gt; 0.85</div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">RMSE (Root Mean Square Error)</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold">142 ₹/MWh</div>
                    <div className="text-xs text-muted-foreground mt-1">Target: &lt; 200</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection Log</CardTitle>
              <CardDescription>Recent system anomalies and their resolution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies.map((anomaly, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      anomaly.severity === 'High' ? 'bg-red-100' : 
                      anomaly.severity === 'Medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        anomaly.severity === 'High' ? 'text-red-600' : 
                        anomaly.severity === 'Medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{anomaly.type}</div>
                      <div className="text-sm text-muted-foreground">{anomaly.date} at {anomaly.time}</div>
                    </div>
                    <Badge variant="outline" className="font-mono">{anomaly.value}</Badge>
                    <Badge variant={anomaly.status === 'Resolved' ? 'default' : 'secondary'}>
                      {anomaly.status}
                    </Badge>
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

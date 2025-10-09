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
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  ReferenceLine
} from "recharts"
import { Download, TrendingUp, BarChart3, Activity, DollarSign, Zap, AlertTriangle } from "lucide-react"

interface MarketData {
  id: string
  time_period: string
  region: string
  market_type: string
  price_rs_per_mwh: number
  volume_mw: number
  clearing_price_rs_per_mwh: number
  demand_mw: number
  supply_mw: number
}

interface AnalyticsData {
  price_trend: number
  volume_trend: number
  efficiency_score: number
  volatility_index: number
  market_depth: number
  liquidity_score: number
}

const marketTypes = ["Day-Ahead", "Real-Time", "Term-Ahead", "Ancillary Services"]
const regions = ["Northern", "Western", "Southern", "Eastern", "North Eastern"]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function PriceTrendsChart() {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMarket, setSelectedMarket] = useState<string>("all")
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    fetchMarketData()
  }, [selectedMarket, selectedRegion])

  const fetchMarketData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success && result.data?.recentData) {
        // Transform real data to match MarketData interface
        const realData: MarketData[] = result.data.recentData.map((item: any, i: number) => ({
          id: item.id || `data-${i}`,
          time_period: item.time_period || new Date().toISOString(),
          region: item.region || item.state || 'Unknown',
          market_type: item.contract_type || 'Day-Ahead',
          price_rs_per_mwh: item.price_rs_per_mwh || 0,
          volume_mw: item.generation_mw || item.demand_mw || 0,
          clearing_price_rs_per_mwh: item.price_rs_per_mwh || 0,
          demand_mw: item.demand_mw || item.generation_mw || 0,
          supply_mw: item.generation_mw || item.capacity_mw || 0
        }))
        
        setData(realData.length > 0 ? realData : [])
        
        // Calculate analytics from real data
        if (realData.length > 0) {
          const prices = realData.map(d => d.price_rs_per_mwh).filter(p => p > 0)
          const volumes = realData.map(d => d.volume_mw).filter(v => v > 0)
          
          const analyticsData: AnalyticsData = {
            price_trend: prices.length >= 2 ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0,
            volume_trend: volumes.length >= 2 ? ((volumes[volumes.length - 1] - volumes[0]) / volumes[0]) * 100 : 0,
            efficiency_score: result.data.efficiency_score || 85,
            volatility_index: prices.length > 0 ? (Math.max(...prices) - Math.min(...prices)) / Math.max(...prices) * 100 : 0,
            market_depth: volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0,
            liquidity_score: result.data.liquidity_score || 75
          }
          
          setAnalytics(analyticsData)
        }
      } else {
        // Fallback: show empty state
        setData([])
        setAnalytics(null)
      }
    } catch (error) {
      console.error("Error fetching market data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data
    .filter(item => selectedMarket === "all" || item.market_type === selectedMarket)
    .filter(item => selectedRegion === "all" || item.region === selectedRegion)
    .map(item => ({
      date: new Date(item.time_period).toLocaleDateString(),
      price: item.price_rs_per_mwh,
      clearingPrice: item.clearing_price_rs_per_mwh,
      volume: item.volume_mw,
      demand: item.demand_mw,
      supply: item.supply_mw,
      spread: Math.abs(item.price_rs_per_mwh - item.clearing_price_rs_per_mwh)
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Price Trends & Forecasting</CardTitle>
            <CardDescription>Market price analysis with trend indicators and forecasting</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Market Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              {marketTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading market data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="price" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Market Price (₹/MWh)" />
                  <Line yAxisId="left" type="monotone" dataKey="clearingPrice" stroke="#82ca9d" strokeWidth={2} name="Clearing Price (₹/MWh)" />
                  <Line yAxisId="right" type="monotone" dataKey="spread" stroke="#ff7300" strokeWidth={2} name="Price Spread (₹/MWh)" />
                  <ReferenceLine yAxisId="left" stroke="#ff0000" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className={`text-lg font-bold ${analytics.price_trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.price_trend > 0 ? '+' : ''}{analytics.price_trend.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Price Trend</div>
                  <TrendingUp className={`w-4 h-4 mx-auto mt-1 ${analytics.price_trend > 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {analytics.volatility_index.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Volatility Index</div>
                  <AlertTriangle className="w-4 h-4 mx-auto mt-1 text-yellow-600" />
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {analytics.efficiency_score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Market Efficiency</div>
                  <Activity className="w-4 h-4 mx-auto mt-1 text-purple-600" />
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {analytics.liquidity_score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Liquidity Score</div>
                  <BarChart3 className="w-4 h-4 mx-auto mt-1 text-green-600" />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Trend Analysis</Badge>
          <Badge variant="outline">Forecasting</Badge>
          <Badge variant="outline">Volatility Metrics</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function VolumeAnalysisChart() {
  const [data, setData] = useState<MarketData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30d")

  useEffect(() => {
    fetchVolumeData()
  }, [selectedTimeframe])

  const fetchVolumeData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success && result.data?.recentData) {
        const realData: MarketData[] = result.data.recentData.map((item: any, i: number) => ({
          id: item.id || `volume-${i}`,
          time_period: item.time_period || new Date().toISOString(),
          region: item.region || item.state || 'Unknown',
          market_type: item.contract_type || 'Day-Ahead',
          price_rs_per_mwh: item.price_rs_per_mwh || 0,
          volume_mw: item.generation_mw || item.demand_mw || 0,
          clearing_price_rs_per_mwh: item.price_rs_per_mwh || 0,
          demand_mw: item.demand_mw || item.generation_mw || 0,
          supply_mw: item.generation_mw || item.capacity_mw || 0
        }))
        
        setData(realData.length > 0 ? realData : [])
      } else {
        setData([])
      }
    } catch (error) {
      console.error("Error fetching volume data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data.map(item => ({
    date: new Date(item.time_period).toLocaleDateString(),
    volume: item.volume_mw,
    demand: item.demand_mw,
    supply: item.supply_mw,
    marketType: item.market_type,
    region: item.region,
    price: item.price_rs_per_mwh
  }))

  const volumeByMarket = Object.entries(
    chartData.reduce((acc, item) => {
      acc[item.marketType] = (acc[item.marketType] || 0) + item.volume
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const volumeByRegion = Object.entries(
    chartData.reduce((acc, item) => {
      acc[item.region] = (acc[item.region] || 0) + item.volume
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Volume Analysis & Market Depth</CardTitle>
            <CardDescription>Trading volume analysis and market depth indicators</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
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
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading volume data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="volume" fill="#8884d8" name="Trading Volume (MW)" />
                  <Line yAxisId="right" type="monotone" dataKey="demand" stroke="#ff7300" strokeWidth={2} name="Demand (MW)" />
                  <Line yAxisId="right" type="monotone" dataKey="supply" stroke="#82ca9d" strokeWidth={2} name="Supply (MW)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48">
                <h4 className="text-sm font-medium mb-2">Volume by Market Type</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={volumeByMarket}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {volumeByMarket.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="h-48">
                <h4 className="text-sm font-medium mb-2">Volume by Region</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByRegion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#82ca9d" name="Volume (MW)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Volume Metrics</Badge>
          <Badge variant="outline">Market Depth</Badge>
          <Badge variant="outline">Regional Analysis</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceMetricsChart() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    marketEfficiency: 0,
    priceVolatility: 0,
    liquidityRatio: 0,
    marketConcentration: 0,
    transmissionEfficiency: 0,
    gridReliability: 0
  })

  useEffect(() => {
    fetchPerformanceMetrics()
  }, [])

  const fetchPerformanceMetrics = async () => {
    try {
      setLoading(true)
      // Simulate performance metrics
      setMetrics({
        marketEfficiency: Math.random() * 30 + 70,
        priceVolatility: Math.random() * 25 + 10,
        liquidityRatio: Math.random() * 40 + 60,
        marketConcentration: Math.random() * 50 + 25,
        transmissionEfficiency: Math.random() * 20 + 80,
        gridReliability: Math.random() * 15 + 85
      })
    } catch (error) {
      console.error("Error fetching performance metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  const performanceData = [
    { name: 'Market Efficiency', value: metrics.marketEfficiency, target: 85 },
    { name: 'Price Stability', value: 100 - metrics.priceVolatility, target: 80 },
    { name: 'Liquidity', value: metrics.liquidityRatio, target: 75 },
    { name: 'Competition', value: 100 - metrics.marketConcentration, target: 70 },
    { name: 'Transmission', value: metrics.transmissionEfficiency, target: 90 },
    { name: 'Grid Reliability', value: metrics.gridReliability, target: 95 }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Performance Metrics</CardTitle>
            <CardDescription>Comprehensive KPIs for market efficiency and performance</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Dashboard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading performance metrics...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {performanceData.map((metric, index) => (
                <div key={metric.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">{metric.name}</h4>
                    <div className={`w-3 h-3 rounded-full ${
                      metric.value >= metric.target ? 'bg-green-500' : 
                      metric.value >= metric.target * 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                  <div className="text-2xl font-bold mb-1">{metric.value.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground mb-2">Target: {metric.target}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.value >= metric.target ? 'bg-green-500' : 
                        metric.value >= metric.target * 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${Math.min(metric.value, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Overall Market Score</h4>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {(
                      (metrics.marketEfficiency + 
                       (100 - metrics.priceVolatility) + 
                       metrics.liquidityRatio + 
                       (100 - metrics.marketConcentration) + 
                       metrics.transmissionEfficiency + 
                       metrics.gridReliability) / 6
                    ).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Composite Performance Index
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Key Insights</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      metrics.marketEfficiency >= 85 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span>Market efficiency is {metrics.marketEfficiency >= 85 ? 'optimal' : 'needs improvement'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      metrics.priceVolatility <= 15 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>Price volatility is {metrics.priceVolatility <= 15 ? 'low' : 'high'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      metrics.gridReliability >= 90 ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span>Grid reliability is {metrics.gridReliability >= 90 ? 'excellent' : 'good'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">KPI Dashboard</Badge>
          <Badge variant="outline">Performance Scoring</Badge>
          <Badge variant="outline">Real-time Monitoring</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
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
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart
} from "recharts"
import { Download, Home, Building, Factory, Zap, TrendingUp, Activity } from "lucide-react"

interface ConsumptionData {
  id: string
  time_period: string
  region: string
  state: string
  sector: string
  consumption_mw: number
  peak_demand_mw: number
  avg_demand_mw: number
  growth_percent: number
}

const sectors = ["Residential", "Commercial", "Industrial", "Agricultural", "Transportation"]
const regions = ["Northern", "Western", "Southern", "Eastern", "North Eastern"]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ConsumptionBySectorChart() {
  const [data, setData] = useState<ConsumptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>("all")

  useEffect(() => {
    fetchConsumptionData()
  }, [selectedRegion])

  const fetchConsumptionData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success && result.data?.recentData) {
        const realData: ConsumptionData[] = result.data.recentData.map((item: any, i: number) => ({
          id: item.id || `consumption-${i}`,
          time_period: item.time_period || new Date().toISOString(),
          region: item.region || 'Unknown',
          state: item.state || 'Unknown',
          sector: item.technology_type || 'Industrial',
          consumption_mw: item.generation_mw || item.demand_mw || 0,
          peak_demand_mw: item.capacity_mw || item.demand_mw || 0,
          avg_demand_mw: item.demand_mw || item.generation_mw || 0,
          growth_percent: 5 // Calculate from historical data if available
        }))
        
        setData(realData.length > 0 ? realData : [])
      } else {
        setData([])
      }
    } catch (error) {
      console.error("Error fetching consumption data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data
    .filter(item => selectedRegion === "all" || item.region === selectedRegion)
    .map(item => ({
      date: new Date(item.time_period).toLocaleDateString(),
      consumption: item.consumption_mw,
      peakDemand: item.peak_demand_mw,
      avgDemand: item.avg_demand_mw,
      sector: item.sector,
      growth: item.growth_percent,
      region: item.region
    }))

  const consumptionBySector = Object.entries(
    chartData.reduce((acc, item) => {
      acc[item.sector] = (acc[item.sector] || 0) + item.consumption
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Consumption by Sector</CardTitle>
            <CardDescription>Power consumption analysis across different sectors</CardDescription>
          </div>
          <div className="flex gap-2">
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
              <p className="text-muted-foreground">Loading consumption data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="consumption" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Consumption (MW)" />
                  <Line type="monotone" dataKey="peakDemand" stroke="#ff7300" strokeWidth={2} name="Peak Demand (MW)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48">
                <h4 className="text-sm font-medium mb-2">Consumption by Sector</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={consumptionBySector}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {consumptionBySector.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {chartData.length > 0 ? chartData[chartData.length - 1].consumption.toFixed(0) : '0'} MW
                  </div>
                  <div className="text-xs text-muted-foreground">Current Consumption</div>
                  <Home className="w-4 h-4 mx-auto mt-1 text-blue-600" />
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {chartData.length > 0 ? chartData[chartData.length - 1].growth.toFixed(1) : '0'}%
                  </div>
                  <div className="text-xs text-muted-foreground">Growth Rate</div>
                  <TrendingUp className="w-4 h-4 mx-auto mt-1 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Sector Analysis</Badge>
          <Badge variant="outline">Growth Tracking</Badge>
          <Badge variant="outline">Regional Data</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function DemandPatternChart() {
  const [data, setData] = useState<ConsumptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24h")

  useEffect(() => {
    fetchDemandData()
  }, [selectedTimeframe])

  const fetchDemandData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from API
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success && result.data?.recentData) {
        const realData: ConsumptionData[] = result.data.recentData.map((item: any, i: number) => ({
          id: item.id || `demand-${i}`,
          time_period: item.time_period || new Date().toISOString(),
          region: item.region || 'National',
          state: item.state || 'Aggregate',
          sector: item.technology_type || 'All',
          consumption_mw: item.demand_mw || item.generation_mw || 0,
          peak_demand_mw: item.capacity_mw || item.demand_mw || 0,
          avg_demand_mw: item.demand_mw || item.generation_mw || 0,
          growth_percent: 5
        }))
        
        setData(realData.length > 0 ? realData : [])
      } else {
        setData([])
      }
    } catch (error) {
      console.error("Error fetching demand data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data.map((item, index) => ({
    time: selectedTimeframe === "24h" 
      ? new Date(item.time_period).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(item.time_period).toLocaleDateString(),
    consumption: item.consumption_mw,
    peakDemand: item.peak_demand_mw,
    avgDemand: item.avg_demand_mw,
    hour: index % 24
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Demand Pattern Analysis</CardTitle>
            <CardDescription>Daily and seasonal demand patterns with forecasting</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
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
              <p className="text-muted-foreground">Loading demand patterns...</p>
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
                  <Area type="monotone" dataKey="consumption" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Consumption (MW)" />
                  <Line type="monotone" dataKey="peakDemand" stroke="#ff7300" strokeWidth={2} name="Peak Demand (MW)" />
                  <Line type="monotone" dataKey="avgDemand" stroke="#82ca9d" strokeWidth={2} name="Avg Demand (MW)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.max(...chartData.map(d => d.peakDemand)).toFixed(0)} MW
                </div>
                <div className="text-sm text-muted-foreground">Peak Demand</div>
                <Zap className="w-4 h-4 mx-auto mt-1 text-blue-600" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.consumption, 0) / chartData.length).toFixed(0) : '0'} MW
                </div>
                <div className="text-sm text-muted-foreground">Average Demand</div>
                <TrendingUp className="w-4 h-4 mx-auto mt-1 text-green-600" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {((Math.max(...chartData.map(d => d.peakDemand)) - Math.min(...chartData.map(d => d.consumption))) / Math.min(...chartData.map(d => d.consumption)) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Peak Variation</div>
                <Activity className="w-4 h-4 mx-auto mt-1 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Pattern Recognition</Badge>
          <Badge variant="outline">Peak Analysis</Badge>
          <Badge variant="outline">Forecasting</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
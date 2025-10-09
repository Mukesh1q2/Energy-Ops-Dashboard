"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
  AreaChart
} from "recharts"
import { Download, Zap, Activity, TrendingUp, AlertTriangle } from "lucide-react"

interface TransmissionData {
  id: string
  time_period: string
  region: string
  corridor: string
  flow_mw: number
  capacity_mw: number
  losses_percent: number
  reliability_percent: number
  voltage_kv: number
}

const corridors = [
  "Northern-Western", "Western-Southern", "Southern-Eastern", 
  "Eastern-North Eastern", "Northern-Eastern", "Inter-regional"
]
const regions = ["Northern", "Western", "Southern", "Eastern", "North Eastern"]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function TransmissionFlowChart() {
  const [data, setData] = useState<TransmissionData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCorridor, setSelectedCorridor] = useState<string>("all")

  useEffect(() => {
    fetchTransmissionData()
  }, [selectedCorridor])

  const fetchTransmissionData = async () => {
    try {
      setLoading(true)
      // Simulate transmission flow data
      const mockData: TransmissionData[] = Array.from({ length: 24 }, (_, i) => ({
        id: `flow-${i}`,
        time_period: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        region: regions[Math.floor(Math.random() * regions.length)],
        corridor: corridors[Math.floor(Math.random() * corridors.length)],
        flow_mw: Math.random() * 2000 + 1000,
        capacity_mw: 3000,
        losses_percent: Math.random() * 5 + 2,
        reliability_percent: Math.random() * 10 + 90,
        voltage_kv: 400
      }))
      setData(mockData)
    } catch (error) {
      console.error("Error fetching transmission data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data
    .filter(item => selectedCorridor === "all" || item.corridor === selectedCorridor)
    .map(item => ({
      time: new Date(item.time_period).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      flow: item.flow_mw,
      capacity: item.capacity_mw,
      utilization: (item.flow_mw / item.capacity_mw) * 100,
      losses: item.losses_percent,
      reliability: item.reliability_percent,
      corridor: item.corridor
    }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transmission Flow Analysis</CardTitle>
            <CardDescription>Real-time power flow across transmission corridors</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedCorridor} onValueChange={setSelectedCorridor}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Transmission Corridor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Corridors</SelectItem>
                {corridors.map(corridor => (
                  <SelectItem key={corridor} value={corridor}>{corridor}</SelectItem>
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
              <p className="text-muted-foreground">Loading transmission data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="flow" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Power Flow (MW)" />
                  <Line yAxisId="left" type="monotone" dataKey="capacity" stroke="#ff7300" strokeWidth={2} name="Capacity (MW)" />
                  <Line yAxisId="right" type="monotone" dataKey="utilization" stroke="#82ca9d" strokeWidth={2} name="Utilization (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {chartData.length > 0 ? chartData[chartData.length - 1].flow.toFixed(0) : '0'} MW
                </div>
                <div className="text-sm text-muted-foreground">Current Flow</div>
                <Zap className="w-4 h-4 mx-auto mt-1 text-blue-600" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {chartData.length > 0 ? chartData[chartData.length - 1].utilization.toFixed(1) : '0'}%
                </div>
                <div className="text-sm text-muted-foreground">Utilization</div>
                <TrendingUp className="w-4 h-4 mx-auto mt-1 text-green-600" />
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {chartData.length > 0 ? chartData[chartData.length - 1].reliability.toFixed(1) : '0'}%
                </div>
                <div className="text-sm text-muted-foreground">Reliability</div>
                <Activity className="w-4 h-4 mx-auto mt-1 text-purple-600" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Real-time Flow</Badge>
          <Badge variant="outline">Capacity Utilization</Badge>
          <Badge variant="outline">Corridor Analysis</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function TransmissionLossesChart() {
  const [data, setData] = useState<TransmissionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLossesData()
  }, [])

  const fetchLossesData = async () => {
    try {
      setLoading(true)
      // Simulate transmission losses data
      const mockData: TransmissionData[] = Array.from({ length: 30 }, (_, i) => ({
        id: `losses-${i}`,
        time_period: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        region: regions[Math.floor(Math.random() * regions.length)],
        corridor: corridors[Math.floor(Math.random() * corridors.length)],
        flow_mw: Math.random() * 2000 + 1000,
        capacity_mw: 3000,
        losses_percent: Math.random() * 6 + 2,
        reliability_percent: Math.random() * 10 + 90,
        voltage_kv: 400
      }))
      setData(mockData)
    } catch (error) {
      console.error("Error fetching losses data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data.map(item => ({
    date: new Date(item.time_period).toLocaleDateString(),
    losses: item.losses_percent,
    flow: item.flow_mw,
    region: item.region,
    corridor: item.corridor
  }))

  const lossesByRegion = Object.entries(
    chartData.reduce((acc, item) => {
      acc[item.region] = (acc[item.region] || 0) + item.losses
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: value / chartData.filter(d => d.region === name).length }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transmission Losses Analysis</CardTitle>
            <CardDescription>Power losses analysis across transmission network</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading losses data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="losses" stroke="#ff7300" strokeWidth={2} name="Losses (%)" />
                  <Line type="monotone" dataKey="flow" stroke="#8884d8" strokeWidth={2} name="Flow (MW)" yAxisId="right" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48">
                <h4 className="text-sm font-medium mb-2">Average Losses by Region</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lossesByRegion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ff7300" name="Avg Losses (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Loss Reduction Targets</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current Average</span>
                    <span className="font-medium text-red-600">
                      {(chartData.reduce((sum, item) => sum + item.losses, 0) / chartData.length).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Target (2025)</span>
                    <span className="font-medium text-yellow-600">3.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Target (2030)</span>
                    <span className="font-medium text-green-600">2.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Loss Analytics</Badge>
          <Badge variant="outline">Regional Comparison</Badge>
          <Badge variant="outline">Reduction Targets</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
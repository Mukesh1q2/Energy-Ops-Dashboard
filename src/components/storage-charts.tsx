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
  ComposedChart,
  Scatter
} from "recharts"
import { Download, Battery, Activity, TrendingUp, Zap } from "lucide-react"

interface StorageData {
  id: string
  time_period: string
  region: string
  state: string
  storage_type: string
  capacity_mw: number
  charge_mw: number
  discharge_mw: number
  state_of_charge_percent: number
  efficiency_percent: number
  cycles: number
}

const storageTypes = ["Battery", "Pumped Hydro", "Compressed Air", "Flywheel", "Thermal"]
const regions = ["Northern", "Western", "Southern", "Eastern", "North Eastern"]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function StorageCapacityChart() {
  const [data, setData] = useState<StorageData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>("all")
  const [selectedStorageType, setSelectedStorageType] = useState<string>("all")
  const [selectedDataSource, setSelectedDataSource] = useState<string>("all")
  const [availableFilters, setAvailableFilters] = useState<{
    regions: string[]
    storageTypes: string[]
    dataSources: any[]
  }>({
    regions: [],
    storageTypes: [],
    dataSources: []
  })

  useEffect(() => {
    fetchStorageData()
    fetchFilterOptions()
  }, [selectedRegion, selectedStorageType, selectedDataSource])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`/api/filters/dynamic?module=storage-operations`)
      const result = await response.json()
      if (result.success) {
        setAvailableFilters(result.data.filterOptions)
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const fetchStorageData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedRegion !== "all") params.append('region', selectedRegion)
      if (selectedStorageType !== "all") params.append('storageType', selectedStorageType)
      
      const response = await fetch(`/api/storage/data?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data.storageData)
        // Update filter options with real data
        if (result.data.filterOptions) {
          setAvailableFilters(prev => ({
            ...prev,
            regions: result.data.filterOptions.regions,
            storageTypes: result.data.filterOptions.storageTypes
          }))
        }
      } else {
        // Fallback to mock data if no real data available
        generateMockStorageData()
      }
    } catch (error) {
      console.error("Error fetching storage data:", error)
      // Generate mock data on error
      generateMockStorageData()
    } finally {
      setLoading(false)
    }
  }

  const generateMockStorageData = () => {
    const mockData: StorageData[] = [
      {
        id: "1",
        time_period: new Date().toISOString(),
        region: "Northern",
        state: "Delhi",
        storage_type: "Battery",
        capacity_mw: 500,
        charge_mw: 200,
        discharge_mw: 180,
        state_of_charge_percent: 75,
        efficiency_percent: 95,
        cycles: 2
      },
      {
        id: "2",
        time_period: new Date().toISOString(),
        region: "Western",
        state: "Maharashtra",
        storage_type: "Pumped Hydro",
        capacity_mw: 1000,
        charge_mw: 400,
        discharge_mw: 350,
        state_of_charge_percent: 60,
        efficiency_percent: 85,
        cycles: 1
      },
      {
        id: "3",
        time_period: new Date().toISOString(),
        region: "Southern",
        state: "Tamil Nadu",
        storage_type: "Battery",
        capacity_mw: 300,
        charge_mw: 150,
        discharge_mw: 120,
        state_of_charge_percent: 80,
        efficiency_percent: 92,
        cycles: 3
      },
      {
        id: "4",
        time_period: new Date().toISOString(),
        region: "Eastern",
        state: "West Bengal",
        storage_type: "Battery",
        capacity_mw: 400,
        charge_mw: 180,
        discharge_mw: 160,
        state_of_charge_percent: 65,
        efficiency_percent: 90,
        cycles: 2
      },
      {
        id: "5",
        time_period: new Date().toISOString(),
        region: "Northern",
        state: "Punjab",
        storage_type: "Pumped Hydro",
        capacity_mw: 800,
        charge_mw: 350,
        discharge_mw: 320,
        state_of_charge_percent: 70,
        efficiency_percent: 88,
        cycles: 1
      }
    ]
    setData(mockData)
    
    // Set filter options
    if (availableFilters.regions.length === 0) {
      setAvailableFilters({
        regions,
        storageTypes,
        dataSources: []
      })
    }
  }

  const chartData = data
    .filter(item => selectedRegion === "all" || item.region === selectedRegion)
    .filter(item => selectedStorageType === "all" || item.storage_type === selectedStorageType)
    .map(item => ({
      region: item.region,
      storageType: item.storage_type,
      capacity: item.capacity_mw,
      charge: item.charge_mw,
      discharge: item.discharge_mw,
      efficiency: item.efficiency_percent,
      stateOfCharge: item.state_of_charge_percent
    }))

  const pieData = Object.entries(
    chartData.reduce((acc, item) => {
      acc[item.storageType] = (acc[item.storageType] || 0) + item.capacity
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Storage Capacity Analysis</CardTitle>
            <CardDescription>Current storage capacity and distribution by type and region</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 flex-wrap">
          <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Data Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {availableFilters.dataSources.map(source => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {availableFilters.regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedStorageType} onValueChange={setSelectedStorageType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Storage Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableFilters.storageTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading storage data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              <h4 className="text-sm font-medium mb-2">Capacity by Storage Type</h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80">
              <h4 className="text-sm font-medium mb-2">Capacity by Region</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="capacity" fill="#8884d8" name="Capacity (MW)" />
                  <Bar dataKey="charge" fill="#82ca9d" name="Charge (MW)" />
                  <Bar dataKey="discharge" fill="#ffc658" name="Discharge (MW)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Region Filter</Badge>
          <Badge variant="outline">Storage Type Filter</Badge>
          <Badge variant="outline">Real-time Data</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function StoragePerformanceChart() {
  const [data, setData] = useState<StorageData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24h")
  const [selectedDataSource, setSelectedDataSource] = useState<string>("all")

  useEffect(() => {
    fetchPerformanceData()
  }, [selectedTimeframe, selectedDataSource])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('timeframe', selectedTimeframe)
      if (selectedDataSource !== "all") params.append('dataSource', selectedDataSource)
      
      const response = await fetch(`/api/storage/data?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data.storageData)
      } else {
        // Fallback to time series mock data
        const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
          id: `perf-${i}`,
          time_period: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          region: "Northern",
          state: "Delhi",
          storage_type: "Battery",
          capacity_mw: 500,
          charge_mw: Math.random() * 200 + 100,
          discharge_mw: Math.random() * 180 + 80,
          state_of_charge_percent: Math.random() * 40 + 40,
          efficiency_percent: Math.random() * 10 + 85,
          cycles: Math.floor(Math.random() * 3) + 1
        }))
        setData(timeSeriesData)
      }
    } catch (error) {
      console.error("Error fetching performance data:", error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data.map(item => ({
    time: new Date(item.time_period).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    charge: item.charge_mw,
    discharge: item.discharge_mw,
    stateOfCharge: item.state_of_charge_percent,
    efficiency: item.efficiency_percent,
    cycles: item.cycles
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Storage Performance Metrics</CardTitle>
            <CardDescription>Real-time storage performance and efficiency metrics</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Data Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
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
              <p className="text-muted-foreground">Loading performance data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-64">
              <h4 className="text-sm font-medium mb-2">Charge/Discharge Cycles</h4>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="charge" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Charge (MW)" yAxisId="left" />
                  <Area type="monotone" dataKey="discharge" stackId="2" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} name="Discharge (MW)" yAxisId="left" />
                  <Line type="monotone" dataKey="stateOfCharge" stroke="#8884d8" strokeWidth={2} name="State of Charge (%)" yAxisId="right" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {chartData.length > 0 ? chartData[chartData.length - 1].efficiency.toFixed(1) : '0'}%
                </div>
                <div className="text-sm text-muted-foreground">Current Efficiency</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {chartData.length > 0 ? chartData[chartData.length - 1].stateOfCharge.toFixed(1) : '0'}%
                </div>
                <div className="text-sm text-muted-foreground">State of Charge</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {chartData.reduce((sum, item) => sum + item.cycles, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cycles</div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Time Series</Badge>
          <Badge variant="outline">Real-time Updates</Badge>
          <Badge variant="outline">Performance Metrics</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
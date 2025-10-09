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
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Legend,
  Cell
} from "recharts"
import { Download, Calendar, Filter, FileSpreadsheet } from "lucide-react"
import { downloadCSV, downloadExcel, formatNumber, formatDateTime } from "@/lib/export-utils"
import { useToast } from "@/contexts/toast-context"
import { RefreshButton } from "@/components/refresh-button"

interface GeneratorSchedulingData {
  id: string
  time_period: string
  region: string
  state: string
  plant_id: string
  plant_name: string
  technology_type: string
  contract_name: string | null
  scheduled_mw: number
  actual_mw: number | null
}

interface ContractSchedulingData {
  id: string
  time_period: string
  region: string
  state: string
  contract_name: string
  contract_type: string
  scheduled_mw: number
  actual_mw: number | null
  cumulative_mw: number | null
}

interface MarketBiddingData {
  id: string
  time_period: string
  region: string
  state: string
  plant_id: string
  plant_name: string
  market_type: string
  bid_price_rs_per_mwh: number
  bid_volume_mw: number
  clearing_price_rs_per_mwh: number | null
  cleared_volume_mw: number | null
}

const technologyTypes = [
  "Coal", "Gas", "Hydro", "Nuclear", "Solar", "Wind", "Biomass", "Storage"
]

const contractTypes = [
  "PPA", "Tender", "Merchant", "REC", "Banking"
]

const marketTypes = [
  "Day-Ahead", "Real-Time", "Term-Ahead", "Ancillary Services"
]

const unitNames = [
  "Plant-001", "Plant-002", "Plant-003", "Plant-004", "Plant-005"
]

const contractNames = [
  "Contract-A", "Contract-B", "Contract-C", "Contract-D", "Contract-E"
]

export function GeneratorSchedulingChart() {
  const toast = useToast()
  const [data, setData] = useState<GeneratorSchedulingData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedTechnology, setSelectedTechnology] = useState<string>("all")
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [selectedContract, setSelectedContract] = useState<string>("all")
  const [filterOptions, setFilterOptions] = useState<{
    technologyTypes: string[]
    unitNames: string[]
    contractNames: string[]
  }>({
    technologyTypes: [],
    unitNames: [],
    contractNames: []
  })

  useEffect(() => {
    fetchFilterOptions()
    fetchData()
  }, [selectedTechnology, selectedUnit, selectedContract])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/dmo/filters?type=generator')
      const result = await response.json()
      
      if (result.success) {
        setFilterOptions({
          technologyTypes: result.data.technologyTypes,
          unitNames: result.data.unitNames,
          contractNames: result.data.contractNames
        })
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedTechnology !== "all") params.append("technologyType", selectedTechnology)
      if (selectedUnit !== "all") params.append("unitName", selectedUnit)
      if (selectedContract !== "all") params.append("contractName", selectedContract)

      const response = await fetch(`/api/dmo/generator-scheduling?${params}`)
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        setData(result.data)
        setLastUpdated(new Date())
        toast.success("Data loaded", "Generator scheduling data updated")
      } else {
        // Use simulated data when no real data exists
        generateSimulatedData()
        if (result.success && result.data.length === 0) {
          toast.info("No data found", "Showing simulated generator scheduling data")
        } else {
          toast.warning("Using simulated data", "Unable to fetch real generator scheduling data")
        }
      }
    } catch (error) {
      console.error("Error fetching generator scheduling data:", error)
      // Use simulated data on error
      generateSimulatedData()
      toast.error(
        "Failed to load data",
        error instanceof Error ? error.message : "Using simulated generator scheduling data"
      )
    } finally {
      setLoading(false)
    }
  }

  const generateSimulatedData = () => {
    const mockData: GeneratorSchedulingData[] = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now)
      time.setHours(now.getHours() - (23 - i))
      
      technologyTypes.forEach(tech => {
        mockData.push({
          id: `sim-${i}-${tech}`,
          time_period: time.toISOString(),
          region: ['Northern', 'Western', 'Southern'][Math.floor(Math.random() * 3)],
          state: 'Maharashtra',
          plant_id: `PLT-${Math.floor(Math.random() * 900) + 100}`,
          plant_name: `${tech} Plant ${Math.floor(Math.random() * 5) + 1}`,
          technology_type: tech,
          contract_name: contractNames[Math.floor(Math.random() * contractNames.length)],
          scheduled_mw: Math.random() * 400 + 100,
          actual_mw: Math.random() * 420 + 90
        })
      })
    }
    
    setData(mockData)
    
    // Set filter options
    if (filterOptions.technologyTypes.length === 0) {
      setFilterOptions({
        technologyTypes,
        unitNames,
        contractNames
      })
    }
  }

  const handleExportCSV = () => {
    try {
      downloadCSV(
        data,
        `dmo_generator_scheduling_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'time_period', label: 'Time Period', format: (v) => formatDateTime(v) },
          { key: 'technology_type', label: 'Technology' },
          { key: 'plant_name', label: 'Plant Name' },
          { key: 'contract_name', label: 'Contract' },
          { key: 'scheduled_mw', label: 'Scheduled (MW)', format: (v) => formatNumber(v, 2) },
          { key: 'actual_mw', label: 'Actual (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'region', label: 'Region' },
          { key: 'state', label: 'State' }
        ]
      )
      toast.success("CSV exported", `Exported ${data.length} generator scheduling records`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export CSV")
    }
  }

  const handleExportExcel = () => {
    try {
      downloadExcel(
        data,
        `dmo_generator_scheduling_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'time_period', label: 'Time Period', format: (v) => formatDateTime(v) },
          { key: 'technology_type', label: 'Technology' },
          { key: 'plant_name', label: 'Plant Name' },
          { key: 'contract_name', label: 'Contract' },
          { key: 'scheduled_mw', label: 'Scheduled (MW)', format: (v) => formatNumber(v, 2) },
          { key: 'actual_mw', label: 'Actual (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'region', label: 'Region' },
          { key: 'state', label: 'State' }
        ]
      )
      toast.success("Excel exported", `Exported ${data.length} generator scheduling records`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export Excel")
    }
  }

  const chartData = data.map(item => ({
    date: new Date(item.time_period).toLocaleDateString(),
    scheduled: item.scheduled_mw,
    actual: item.actual_mw || 0,
    technology: item.technology_type
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generator/Storage Scheduling</CardTitle>
            <CardDescription>Scheduled vs actual generation by technology and unit</CardDescription>
          </div>
          <div className="flex gap-2">
            <RefreshButton
              onRefresh={fetchData}
              isLoading={loading}
              lastUpdated={lastUpdated}
              showLabel={false}
            />
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || data.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={loading || data.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Technology Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Technologies</SelectItem>
              {filterOptions.technologyTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Unit Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {filterOptions.unitNames.map(unit => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Contract Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              {filterOptions.contractNames.map(contract => (
                <SelectItem key={contract} value={contract}>{contract}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="scheduled" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Scheduled MW"
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                  name="Actual MW"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Technology Type</Badge>
          <Badge variant="outline">Unit Name</Badge>
          <Badge variant="outline">Contract Name</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function ContractSchedulingChart() {
  const toast = useToast()
  const [data, setData] = useState<ContractSchedulingData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedContractType, setSelectedContractType] = useState<string>("all")
  const [selectedContract, setSelectedContract] = useState<string>("all")
  const [filterOptions, setFilterOptions] = useState<{
    contractTypes: string[]
    contractNames: string[]
  }>({
    contractTypes: [],
    contractNames: []
  })

  useEffect(() => {
    fetchFilterOptions()
    fetchData()
  }, [selectedContractType, selectedContract])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/dmo/filters?type=contract')
      const result = await response.json()
      
      if (result.success) {
        setFilterOptions({
          contractTypes: result.data.contractTypes,
          contractNames: result.data.contractNames
        })
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedContractType !== "all") params.append("contractType", selectedContractType)
      if (selectedContract !== "all") params.append("contractName", selectedContract)

      const response = await fetch(`/api/dmo/contract-scheduling?${params}`)
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        setData(result.data)
        setLastUpdated(new Date())
        toast.success("Data loaded", "Contract scheduling data updated")
      } else {
        // Use simulated data when no real data exists
        generateSimulatedContractData()
        if (result.success && result.data.length === 0) {
          toast.info("No data found", "Showing simulated contract scheduling data")
        } else {
          toast.warning("Using simulated data", "Unable to fetch real contract scheduling data")
        }
      }
    } catch (error) {
      console.error("Error fetching contract scheduling data:", error)
      generateSimulatedContractData()
      toast.error(
        "Failed to load data",
        error instanceof Error ? error.message : "Using simulated contract scheduling data"
      )
    } finally {
      setLoading(false)
    }
  }

  const generateSimulatedContractData = () => {
    const mockData: ContractSchedulingData[] = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now)
      time.setHours(now.getHours() - (23 - i))
      
      contractTypes.forEach(type => {
        mockData.push({
          id: `contract-${i}-${type}`,
          time_period: time.toISOString(),
          region: ['Northern', 'Western', 'Southern'][Math.floor(Math.random() * 3)],
          state: 'Gujarat',
          contract_name: `${type}-Contract-${Math.floor(Math.random() * 10) + 1}`,
          contract_type: type,
          scheduled_mw: Math.random() * 600 + 200,
          actual_mw: Math.random() * 630 + 190,
          cumulative_mw: Math.random() * 4000 + 1000
        })
      })
    }
    
    setData(mockData)
    
    if (filterOptions.contractTypes.length === 0) {
      setFilterOptions({
        contractTypes,
        contractNames
      })
    }
  }

  const handleExportCSV = () => {
    try {
      downloadCSV(
        data,
        `dmo_contract_scheduling_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'time_period', label: 'Time Period', format: (v) => formatDateTime(v) },
          { key: 'contract_type', label: 'Contract Type' },
          { key: 'contract_name', label: 'Contract Name' },
          { key: 'scheduled_mw', label: 'Scheduled (MW)', format: (v) => formatNumber(v, 2) },
          { key: 'actual_mw', label: 'Actual (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'cumulative_mw', label: 'Cumulative (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'region', label: 'Region' },
          { key: 'state', label: 'State' }
        ]
      )
      toast.success("CSV exported", `Exported ${data.length} contract scheduling records`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export CSV")
    }
  }

  const handleExportExcel = () => {
    try {
      downloadExcel(
        data,
        `dmo_contract_scheduling_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'time_period', label: 'Time Period', format: (v) => formatDateTime(v) },
          { key: 'contract_type', label: 'Contract Type' },
          { key: 'contract_name', label: 'Contract Name' },
          { key: 'scheduled_mw', label: 'Scheduled (MW)', format: (v) => formatNumber(v, 2) },
          { key: 'actual_mw', label: 'Actual (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'cumulative_mw', label: 'Cumulative (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'region', label: 'Region' },
          { key: 'state', label: 'State' }
        ]
      )
      toast.success("Excel exported", `Exported ${data.length} contract scheduling records`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export Excel")
    }
  }

  const chartData = data.map(item => ({
    date: new Date(item.time_period).toLocaleDateString(),
    scheduled: item.scheduled_mw,
    actual: item.actual_mw || 0,
    cumulative: item.cumulative_mw || 0,
    contract: item.contract_name,
    contractType: item.contract_type
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Contract-wise Scheduling</CardTitle>
            <CardDescription>Scheduling data by contract type and name</CardDescription>
          </div>
          <div className="flex gap-2">
            <RefreshButton
              onRefresh={fetchData}
              isLoading={loading}
              lastUpdated={lastUpdated}
              showLabel={false}
            />
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || data.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={loading || data.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={selectedContractType} onValueChange={setSelectedContractType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Contract Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contract Types</SelectItem>
              {filterOptions.contractTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Contract Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contracts</SelectItem>
              {filterOptions.contractNames.map(contract => (
                <SelectItem key={contract} value={contract}>{contract}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="scheduled" fill="#8884d8" name="Scheduled MW" />
                <Bar dataKey="actual" fill="#82ca9d" name="Actual MW" />
                <Bar dataKey="cumulative" fill="#ffc658" name="Cumulative MW" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Contract Type</Badge>
          <Badge variant="outline">Contract Name</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export function MarketBiddingChart() {
  const toast = useToast()
  const [data, setData] = useState<MarketBiddingData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<string>("all")
  const [selectedMarketType, setSelectedMarketType] = useState<string>("all")
  const [filterOptions, setFilterOptions] = useState<{
    unitNames: string[]
    marketTypes: string[]
  }>({
    unitNames: [],
    marketTypes: []
  })

  useEffect(() => {
    fetchFilterOptions()
    fetchData()
  }, [selectedUnit, selectedMarketType])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/dmo/filters?type=market')
      const result = await response.json()
      
      if (result.success) {
        setFilterOptions({
          unitNames: result.data.unitNames,
          marketTypes: result.data.marketTypes
        })
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedUnit !== "all") params.append("unitName", selectedUnit)
      if (selectedMarketType !== "all") params.append("marketType", selectedMarketType)

      const response = await fetch(`/api/dmo/market-bidding?${params}`)
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        setData(result.data)
        setLastUpdated(new Date())
        toast.success("Data loaded", "Market bidding data updated")
      } else {
        // Use simulated data when no real data exists
        generateSimulatedMarketData()
        if (result.success && result.data.length === 0) {
          toast.info("No data found", "Showing simulated market bidding data")
        } else {
          toast.warning("Using simulated data", "Unable to fetch real market bidding data")
        }
      }
    } catch (error) {
      console.error("Error fetching market bidding data:", error)
      generateSimulatedMarketData()
      toast.error(
        "Failed to load data",
        error instanceof Error ? error.message : "Using simulated market bidding data"
      )
    } finally {
      setLoading(false)
    }
  }

  const generateSimulatedMarketData = () => {
    const mockData: MarketBiddingData[] = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const time = new Date(now)
      time.setHours(now.getHours() - (23 - i))
      
      marketTypes.forEach(market => {
        mockData.push({
          id: `bid-${i}-${market}`,
          time_period: time.toISOString(),
          region: ['Northern', 'Western'][Math.floor(Math.random() * 2)],
          state: 'Tamil Nadu',
          plant_id: `PLT-${Math.floor(Math.random() * 900) + 100}`,
          plant_name: `Plant ${Math.floor(Math.random() * 20) + 1}`,
          market_type: market,
          bid_price_rs_per_mwh: Math.random() * 4000 + 2500,
          bid_volume_mw: Math.random() * 250 + 50,
          clearing_price_rs_per_mwh: Math.random() * 3900 + 2400,
          cleared_volume_mw: Math.random() * 250 + 45
        })
      })
    }
    
    setData(mockData)
    
    if (filterOptions.unitNames.length === 0) {
      setFilterOptions({
        unitNames,
        marketTypes
      })
    }
  }

  const handleExportCSV = () => {
    try {
      downloadCSV(
        data,
        `dmo_market_bidding_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'time_period', label: 'Time Period', format: (v) => formatDateTime(v) },
          { key: 'market_type', label: 'Market Type' },
          { key: 'plant_name', label: 'Plant Name' },
          { key: 'bid_price_rs_per_mwh', label: 'Bid Price (Rs/MWh)', format: (v) => formatNumber(v, 2) },
          { key: 'bid_volume_mw', label: 'Bid Volume (MW)', format: (v) => formatNumber(v, 2) },
          { key: 'clearing_price_rs_per_mwh', label: 'Clearing Price (Rs/MWh)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'cleared_volume_mw', label: 'Cleared Volume (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'region', label: 'Region' },
          { key: 'state', label: 'State' }
        ]
      )
      toast.success("CSV exported", `Exported ${data.length} market bidding records`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export CSV")
    }
  }

  const handleExportExcel = () => {
    try {
      downloadExcel(
        data,
        `dmo_market_bidding_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'time_period', label: 'Time Period', format: (v) => formatDateTime(v) },
          { key: 'market_type', label: 'Market Type' },
          { key: 'plant_name', label: 'Plant Name' },
          { key: 'bid_price_rs_per_mwh', label: 'Bid Price (Rs/MWh)', format: (v) => formatNumber(v, 2) },
          { key: 'bid_volume_mw', label: 'Bid Volume (MW)', format: (v) => formatNumber(v, 2) },
          { key: 'clearing_price_rs_per_mwh', label: 'Clearing Price (Rs/MWh)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'cleared_volume_mw', label: 'Cleared Volume (MW)', format: (v) => formatNumber(v || 0, 2) },
          { key: 'region', label: 'Region' },
          { key: 'state', label: 'State' }
        ]
      )
      toast.success("Excel exported", `Exported ${data.length} market bidding records`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export Excel")
    }
  }

  const scatterData = data.map(item => ({
    bidPrice: item.bid_price_rs_per_mwh,
    bidVolume: item.bid_volume_mw,
    clearingPrice: item.clearing_price_rs_per_mwh || 0,
    marketType: item.market_type,
    date: new Date(item.time_period).toLocaleDateString()
  }))

  const timeSeriesData = data.map(item => ({
    date: new Date(item.time_period).toLocaleDateString(),
    clearingPrice: item.clearing_price_rs_per_mwh || 0,
    bidPrice: item.bid_price_rs_per_mwh,
    marketType: item.market_type
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Bidding</CardTitle>
            <CardDescription>Bid price distribution and clearing price trends</CardDescription>
          </div>
          <div className="flex gap-2">
            <RefreshButton
              onRefresh={fetchData}
              isLoading={loading}
              lastUpdated={lastUpdated}
              showLabel={false}
            />
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading || data.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={loading || data.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Unit Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {filterOptions.unitNames.map(unit => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedMarketType} onValueChange={setSelectedMarketType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Market Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Market Types</SelectItem>
              {filterOptions.marketTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="h-44">
              <h4 className="text-sm font-medium mb-2">Bid Price Distribution</h4>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={scatterData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bidPrice" name="Bid Price (Rs/MWh)" />
                  <YAxis dataKey="bidVolume" name="Bid Volume (MW)" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Bids" dataKey="bidVolume" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-44">
              <h4 className="text-sm font-medium mb-2">Clearing Price Trends</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clearingPrice" stroke="#8884d8" name="Clearing Price (Rs/MWh)" />
                  <Line type="monotone" dataKey="bidPrice" stroke="#82ca9d" name="Average Bid Price (Rs/MWh)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Badge variant="outline">Unit Name</Badge>
          <Badge variant="outline">Market Type</Badge>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, TrendingUp, Zap, Download, FileSpreadsheet, RefreshCw } from "lucide-react"
import { downloadCSV, downloadExcel, formatNumber } from "@/lib/export-utils"
import { useToast } from "@/contexts/toast-context"
import { RefreshButton } from "@/components/refresh-button"

interface StateCapacity {
  state: string
  capacity_mw: number
  percentage: number
  rank: number
}

export function IndiaMapSimple() {
  const toast = useToast()
  const [capacityData, setCapacityData] = useState<StateCapacity[]>([])
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [useFallback, setUseFallback] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchStateData()
  }, [])

  const fetchStateData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/capacity/states')
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        setCapacityData(result.data)
        setUseFallback(result.meta?.fallback || false)
        setLastUpdated(new Date())
        toast.success("Data loaded successfully", `Loaded capacity data for ${result.data.length} states`)
      } else {
        // Use local simulated data
        generateSampleData()
        setUseFallback(true)
        toast.warning("Using simulated data", "Unable to fetch real data from API")
      }
    } catch (error) {
      console.error("Error fetching state capacity data:", error)
      // Use local simulated data on error
      generateSampleData()
      setUseFallback(true)
      toast.error(
        "Failed to load data",
        error instanceof Error ? error.message : "Using simulated data as fallback"
      )
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = () => {
    const indianStates = [
      "Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka", "Rajasthan",
      "Uttar Pradesh", "Madhya Pradesh", "Andhra Pradesh", "Telangana",
      "West Bengal", "Punjab", "Haryana", "Kerala", "Odisha", "Bihar",
      "Chhattisgarh", "Jharkhand", "Assam"
    ]

    const sampleData: StateCapacity[] = indianStates.map(state => ({
      state,
      capacity_mw: Math.floor(Math.random() * 50000) + 5000,
      percentage: 0,
      rank: 0
    }))

    const total = sampleData.reduce((sum, d) => sum + d.capacity_mw, 0)
    sampleData.forEach(d => {
      d.percentage = (d.capacity_mw / total) * 100
    })

    // Sort and add ranks
    sampleData.sort((a, b) => b.capacity_mw - a.capacity_mw)
    sampleData.forEach((d, idx) => {
      d.rank = idx + 1
    })

    setCapacityData(sampleData)
    setLastUpdated(new Date())
  }

  const handleRefresh = () => {
    fetchStateData()
  }

  const getColorByRank = (rank: number) => {
    if (rank <= 3) return "bg-gradient-to-r from-yellow-400 to-yellow-600"
    if (rank <= 6) return "bg-gradient-to-r from-green-400 to-green-600"
    if (rank <= 10) return "bg-gradient-to-r from-blue-400 to-blue-600"
    return "bg-gradient-to-r from-gray-300 to-gray-500"
  }

  const getTextColorByRank = (rank: number) => {
    if (rank <= 10) return "text-white"
    return "text-gray-700 dark:text-gray-300"
  }

  const selectedStateData = selectedState 
    ? capacityData.find(d => d.state === selectedState)
    : null

  const handleExportCSV = () => {
    try {
      downloadCSV(
        capacityData,
        `india_state_capacity_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'rank', label: 'Rank' },
          { key: 'state', label: 'State' },
          { key: 'capacity_mw', label: 'Capacity (MW)', format: (v) => formatNumber(v, 0) },
          { key: 'percentage', label: 'Share (%)', format: (v) => formatNumber(v, 2) }
        ]
      )
      toast.success("CSV exported", `Exported data for ${capacityData.length} states`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export CSV")
    }
  }

  const handleExportExcel = () => {
    try {
      downloadExcel(
        capacityData,
        `india_state_capacity_${new Date().toISOString().split('T')[0]}`,
        [
          { key: 'rank', label: 'Rank' },
          { key: 'state', label: 'State' },
          { key: 'capacity_mw', label: 'Capacity (MW)', format: (v) => formatNumber(v, 0) },
          { key: 'percentage', label: 'Share (%)', format: (v) => formatNumber(v, 2) }
        ]
      )
      toast.success("Excel exported", `Exported data for ${capacityData.length} states`)
    } catch (error) {
      toast.error("Export failed", error instanceof Error ? error.message : "Failed to export Excel")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>India State-wise Capacity Visualization</CardTitle>
              <CardDescription>
                Interactive state-wise installed capacity distribution
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {useFallback && (
                <Badge variant="secondary" className="text-xs">
                  Simulated Data
                </Badge>
              )}
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Badge variant="outline" className={loading ? "" : "animate-pulse"}>
                <MapPin className="w-3 h-3 mr-1" />
                {capacityData.length} States
              </Badge>
              <RefreshButton
                onRefresh={handleRefresh}
                isLoading={loading}
                lastUpdated={lastUpdated}
                showLabel={true}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={loading || capacityData.length === 0}
              >
                <Download className="w-3 h-3 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={loading || capacityData.length === 0}
              >
                <FileSpreadsheet className="w-3 h-3 mr-1" />
                Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent>
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading state data...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Grid Layout - Visual Map Alternative */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {capacityData.map((state) => (
              <div
                key={state.state}
                className={`
                  relative p-4 rounded-lg cursor-pointer transition-all duration-300
                  ${getColorByRank(state.rank)}
                  ${selectedState === state.state ? 'ring-4 ring-primary scale-105' : ''}
                  ${hoveredState === state.state ? 'scale-110 shadow-xl' : 'shadow-md'}
                  ${state.rank <= 3 ? 'animate-pulse' : ''}
                  hover:scale-110
                `}
                onClick={() => setSelectedState(selectedState === state.state ? null : state.state)}
                onMouseEnter={() => setHoveredState(state.state)}
                onMouseLeave={() => setHoveredState(null)}
              >
                <div className="flex flex-col items-center text-center">
                  {state.rank <= 3 && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white">
                        {state.rank}
                      </div>
                    </div>
                  )}
                  
                  <MapPin className={`w-6 h-6 mb-2 ${getTextColorByRank(state.rank)}`} />
                  
                  <p className={`text-xs font-semibold mb-1 ${getTextColorByRank(state.rank)}`}>
                    {state.state}
                  </p>
                  
                  <p className={`text-sm font-bold ${getTextColorByRank(state.rank)}`}>
                    {(state.capacity_mw / 1000).toFixed(1)}
                  </p>
                  
                  <p className={`text-xs ${getTextColorByRank(state.rank)}`}>
                    GW
                  </p>
                  
                  {hoveredState === state.state && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded shadow-lg z-50 whitespace-nowrap border-2 border-primary">
                      <p className="text-xs font-semibold">{state.state}</p>
                      <p className="text-xs">{state.capacity_mw.toLocaleString()} MW</p>
                      <p className="text-xs text-muted-foreground">{state.percentage.toFixed(2)}%</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded"></div>
              <span className="text-xs">Top 3 States</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
              <span className="text-xs">Rank 4-6</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
              <span className="text-xs">Rank 7-10</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-gray-300 to-gray-500 rounded"></div>
              <span className="text-xs">Others</span>
            </div>
          </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Selected State Details */}
      {selectedStateData && (
        <Card className="border-2 border-primary animate-in slide-in-from-bottom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {selectedStateData.state} - Detailed View
            </CardTitle>
            <CardDescription>Capacity breakdown and ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {selectedStateData.capacity_mw.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">MW</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Share</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {selectedStateData.percentage.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">of Total</p>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  #{selectedStateData.rank}
                </p>
                <p className="text-xs text-muted-foreground">Position</p>
              </div>
              
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-2">
                  {selectedStateData.rank <= 3 ? '🏆 Top Performer' : 
                   selectedStateData.rank <= 10 ? '⭐ High Capacity' : '✓ Active'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 10 Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top 10 States by Capacity
          </CardTitle>
          <CardDescription>Leading states in installed capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {capacityData.slice(0, 10).map((state, index) => (
              <div
                key={state.state}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedState === state.state
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                } ${index < 3 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
                onClick={() => setSelectedState(state.state)}
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={index < 3 ? 'default' : 'outline'}
                    className={index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : ''}
                  >
                    #{state.rank}
                  </Badge>
                  <span className="font-medium">{state.state}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold">{state.capacity_mw.toLocaleString()} MW</p>
                  <p className="text-xs text-muted-foreground">
                    {state.percentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

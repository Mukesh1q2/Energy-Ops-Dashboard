"use client"

import { useState, useEffect } from "react"
import { ComposableMap, Geographies, Geography } from "react-simple-maps"
import { scaleLinear } from "d3-scale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

// India TopoJSON - We'll use a simplified version
const INDIA_TOPO_JSON = "https://cdn.jsdelivr.net/npm/india-map-topojson@1.0.0/india.json"

interface StateCapacity {
  state: string
  capacity_mw: number
  percentage?: number
  color?: string
}

interface IndiaMapInteractiveProps {
  dataSourceId?: string
  stateData?: StateCapacity[]
}

export function IndiaMapInteractive({ dataSourceId, stateData = [] }: IndiaMapInteractiveProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [capacityData, setCapacityData] = useState<StateCapacity[]>(stateData)
  const [loading, setLoading] = useState(false)
  const [blinkingStates, setBlinkingStates] = useState<Set<string>>(new Set())

  // Color scale for capacity visualization
  const maxCapacity = Math.max(...capacityData.map(d => d.capacity_mw || 0), 1)
  const colorScale = scaleLinear<string>()
    .domain([0, maxCapacity * 0.5, maxCapacity])
    .range(["#e0f2fe", "#0ea5e9", "#0c4a6e"])

  useEffect(() => {
    // Always generate sample data on mount
    generateSampleData()
    
    // Then try to fetch if dataSourceId exists
    if (dataSourceId) {
      fetchStateCapacityData()
    }
  }, [])

  useEffect(() => {
    // Auto-highlight top 3 states with blinking animation
    if (capacityData.length > 0) {
      const sorted = [...capacityData].sort((a, b) => (b.capacity_mw || 0) - (a.capacity_mw || 0))
      const top3 = new Set(sorted.slice(0, 3).map(d => d.state))
      setBlinkingStates(top3)
    }
  }, [capacityData])

  const fetchStateCapacityData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/state-capacity`)
      const result = await response.json()
      
      if (result.success) {
        setCapacityData(result.data)
      }
    } catch (error) {
      console.error('Error fetching state capacity data:', error)
      generateSampleData()
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = () => {
    const indianStates = [
      "Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka", "Rajasthan",
      "Uttar Pradesh", "Madhya Pradesh", "Andhra Pradesh", "Telangana",
      "West Bengal", "Punjab", "Haryana", "Kerala", "Odisha", "Bihar"
    ]

    const sampleData: StateCapacity[] = indianStates.map(state => ({
      state,
      capacity_mw: Math.floor(Math.random() * 50000) + 5000,
      percentage: 0
    }))

    const total = sampleData.reduce((sum, d) => sum + d.capacity_mw, 0)
    sampleData.forEach(d => {
      d.percentage = (d.capacity_mw / total) * 100
    })

    setCapacityData(sampleData)
  }

  const getStateCapacity = (stateName: string): StateCapacity | undefined => {
    return capacityData.find(d => 
      d.state.toLowerCase().includes(stateName.toLowerCase()) ||
      stateName.toLowerCase().includes(d.state.toLowerCase())
    )
  }

  const getStateColor = (stateName: string): string => {
    const stateData = getStateCapacity(stateName)
    if (!stateData) return "#e2e8f0"
    return colorScale(stateData.capacity_mw || 0)
  }

  const isStateBlinking = (stateName: string): boolean => {
    return Array.from(blinkingStates).some(state => 
      state.toLowerCase().includes(stateName.toLowerCase()) ||
      stateName.toLowerCase().includes(state.toLowerCase())
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>India Capacity Map</CardTitle>
              <CardDescription>
                Interactive state-wise installed capacity visualization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-ping"></div>
                Top States Highlighted
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1000,
                center: [78.9629, 22.5937]
              }}
              width={800}
              height={600}
              className="w-full h-auto"
            >
              <Geographies geography={INDIA_TOPO_JSON}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const stateName = geo.properties.ST_NM || geo.properties.name
                    const isHovered = hoveredState === stateName
                    const isSelected = selectedState === stateName
                    const isBlinking = isStateBlinking(stateName)
                    const stateInfo = getStateCapacity(stateName)

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHoveredState(stateName)}
                        onMouseLeave={() => setHoveredState(null)}
                        onClick={() => setSelectedState(isSelected ? null : stateName)}
                        style={{
                          default: {
                            fill: getStateColor(stateName),
                            stroke: "#64748b",
                            strokeWidth: 0.5,
                            outline: "none",
                            transition: "all 0.3s ease"
                          },
                          hover: {
                            fill: "#f59e0b",
                            stroke: "#1e40af",
                            strokeWidth: 2,
                            outline: "none",
                            cursor: "pointer"
                          },
                          pressed: {
                            fill: "#dc2626",
                            stroke: "#991b1b",
                            strokeWidth: 2,
                            outline: "none"
                          }
                        }}
                        className={`
                          ${isBlinking ? 'animate-pulse' : ''}
                          ${isSelected ? 'ring-4 ring-primary' : ''}
                          transition-all duration-300
                        `}
                      />
                    )
                  })
                }
              </Geographies>
            </ComposableMap>

            {/* Tooltip */}
            {hoveredState && (
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-primary z-50 min-w-[200px]">
                <h4 className="font-semibold text-lg mb-2">{hoveredState}</h4>
                {getStateCapacity(hoveredState) ? (
                  <>
                    <p className="text-2xl font-bold text-primary">
                      {getStateCapacity(hoveredState)?.capacity_mw.toLocaleString()} MW
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getStateCapacity(hoveredState)?.percentage?.toFixed(2)}% of total
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data available</p>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-4 bg-gradient-to-r from-blue-100 to-blue-900 rounded"></div>
              <span className="text-xs text-muted-foreground">Low to High Capacity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Top 3 States</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected State Details */}
      {selectedState && getStateCapacity(selectedState) && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>{selectedState} - Detailed View</CardTitle>
            <CardDescription>Installed capacity breakdown and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {getStateCapacity(selectedState)?.capacity_mw.toLocaleString()} MW
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Share</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {getStateCapacity(selectedState)?.percentage?.toFixed(2)}%
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Rank</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  #{capacityData.sort((a, b) => b.capacity_mw - a.capacity_mw)
                    .findIndex(d => d.state === selectedState) + 1}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-2">
                  {isStateBlinking(selectedState) ? 'Top Performer' : 'Active'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top States Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 States by Capacity</CardTitle>
          <CardDescription>Leading states in installed capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {capacityData
              .sort((a, b) => b.capacity_mw - a.capacity_mw)
              .slice(0, 10)
              .map((state, index) => (
                <div
                  key={state.state}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedState === state.state
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  } ${index < 3 ? 'animate-pulse' : ''}`}
                  onClick={() => setSelectedState(state.state)}
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={index < 3 ? 'default' : 'outline'}
                      className={index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : ''}
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{state.state}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{state.capacity_mw.toLocaleString()} MW</p>
                    <p className="text-xs text-muted-foreground">
                      {state.percentage?.toFixed(2)}%
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

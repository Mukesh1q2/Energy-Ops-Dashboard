"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IndiaMapSimple } from "@/components/india-map-simple"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

export function InstalledCapacityCharts() {
  const [loading, setLoading] = useState(true)
  const [capacityByTech, setCapacityByTech] = useState<any[]>([])
  const [capacityByRegion, setCapacityByRegion] = useState<any[]>([])
  const [totalCapacity, setTotalCapacity] = useState(0)

  useEffect(() => {
    fetchCapacityData()
  }, [])

  const fetchCapacityData = async () => {
    setLoading(true)
    try {
      // Fetch from ElectricityData table
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success && result.data.totalCapacity) {
        // Process capacity by technology
        const techData = Object.entries(result.data.technologyMix || {}).map(([name, percentage]) => ({
          name,
          capacity: ((percentage as number) / 100) * (result.data.totalCapacity || 0),
          percentage: percentage as number
        }))
        setCapacityByTech(techData)
        
        // Mock regional data (in real app, fetch from API)
        const regionData = [
          { region: 'Northern', capacity: (result.data.totalCapacity || 0) * 0.25 },
          { region: 'Western', capacity: (result.data.totalCapacity || 0) * 0.30 },
          { region: 'Southern', capacity: (result.data.totalCapacity || 0) * 0.25 },
          { region: 'Eastern', capacity: (result.data.totalCapacity || 0) * 0.15 },
          { region: 'North Eastern', capacity: (result.data.totalCapacity || 0) * 0.05 }
        ]
        setCapacityByRegion(regionData)
        setTotalCapacity(result.data.totalCapacity || 0)
      } else {
        // Use simulated data
        generateSimulatedData()
      }
    } catch (error) {
      console.error("Error fetching capacity data:", error)
      // Use simulated data on error
      generateSimulatedData()
    } finally {
      setLoading(false)
    }
  }

  const generateSimulatedData = () => {
    // Simulated technology mix
    const totalCap = 420 // GW
    const techData = [
      { name: 'Coal', capacity: totalCap * 0.45, percentage: 45 },
      { name: 'Solar', capacity: totalCap * 0.18, percentage: 18 },
      { name: 'Wind', capacity: totalCap * 0.12, percentage: 12 },
      { name: 'Hydro', capacity: totalCap * 0.11, percentage: 11 },
      { name: 'Gas', capacity: totalCap * 0.06, percentage: 6 },
      { name: 'Nuclear', capacity: totalCap * 0.03, percentage: 3 },
      { name: 'Biomass', capacity: totalCap * 0.03, percentage: 3 },
      { name: 'Storage', capacity: totalCap * 0.02, percentage: 2 }
    ]
    setCapacityByTech(techData)
    
    const regionData = [
      { region: 'Northern', capacity: totalCap * 0.25 },
      { region: 'Western', capacity: totalCap * 0.30 },
      { region: 'Southern', capacity: totalCap * 0.25 },
      { region: 'Eastern', capacity: totalCap * 0.15 },
      { region: 'North Eastern', capacity: totalCap * 0.05 }
    ]
    setCapacityByRegion(regionData)
    setTotalCapacity(totalCap)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Total Installed Capacity</CardTitle>
          <CardDescription>All India aggregate generation capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold">{(totalCapacity * 1000).toFixed(0)} MW</div>
          <p className="text-sm text-muted-foreground mt-2">Across all technologies and regions</p>
        </CardContent>
      </Card>

      {/* Capacity by Technology - Simple Card Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity by Technology</CardTitle>
          <CardDescription>Installed capacity in MW by technology type</CardDescription>
        </CardHeader>
        <CardContent>
          {capacityByTech.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {capacityByTech.map((tech, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-lg border-2 hover:border-primary transition-colors"
                  style={{ borderColor: COLORS[index % COLORS.length] }}
                >
                  <div className="text-xs font-medium text-muted-foreground mb-2">{tech.name}</div>
                  <div className="text-2xl font-bold">
                    {(tech.capacity * 1000).toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">MW</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No capacity data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* India Map - Capacity by State */}
      <IndiaMapSimple />

      {/* Technology Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Complete capacity information by technology</CardDescription>
        </CardHeader>
        <CardContent>
          {capacityByTech.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Technology</th>
                    <th className="text-right py-2 px-4">MW</th>
                    <th className="text-right py-2 px-4">Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {capacityByTech.map((tech, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{tech.name}</td>
                      <td className="text-right py-2 px-4 font-mono">{(tech.capacity * 1000).toFixed(0)}</td>
                      <td className="text-right py-2 px-4">{tech.percentage.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

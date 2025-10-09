"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function SupplyStatusCharts() {
  const [loading, setLoading] = useState(true)
  const [supplyData, setSupplyData] = useState<any[]>([])
  const [reliability, setReliability] = useState(0)
  const [outages, setOutages] = useState(0)

  useEffect(() => {
    fetchSupplyData()
  }, [])

  const fetchSupplyData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success) {
        // Calculate reliability (mock)
        const reliabilityScore = 95 + Math.random() * 4
        setReliability(reliabilityScore)
        setOutages(Math.floor(Math.random() * 5))
        
        // Mock hourly supply status
        const mockData = Array.from({ length: 24 }, (_, i) => ({
          hour: `${i}:00`,
          supply: (result.data.totalGeneration || 0) * (0.85 + Math.random() * 0.15),
          demand: (result.data.totalGeneration || 0) * (0.8 + Math.random() * 0.2),
          reliability: 95 + Math.random() * 5
        }))
        setSupplyData(mockData)
      }
    } catch (error) {
      console.error("Error fetching supply data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const avgSupply = supplyData.reduce((sum, d) => sum + d.supply, 0) / supplyData.length
  const avgDemand = supplyData.reduce((sum, d) => sum + d.demand, 0) / supplyData.length
  const supplyDemandGap = avgSupply - avgDemand

  // Regional reliability data (mock)
  const regionalReliability = [
    { region: 'Northern', reliability: 96.5, availability: 98.2, uptime: 97.8 },
    { region: 'Western', reliability: 97.2, availability: 98.9, uptime: 98.5 },
    { region: 'Southern', reliability: 95.8, availability: 97.5, uptime: 96.9 },
    { region: 'Eastern', reliability: 94.3, availability: 96.8, uptime: 95.7 },
    { region: 'North Eastern', reliability: 93.1, availability: 95.4, uptime: 94.2 }
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reliability Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reliability.toFixed(2)}%</div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-xs text-muted-foreground">Excellent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Outages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outages}</div>
            <div className="flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <p className="text-xs text-muted-foreground">Under monitoring</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgSupply.toFixed(0)} MW</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Supply-Demand Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${supplyDemandGap >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {supplyDemandGap >= 0 ? '+' : ''}{supplyDemandGap.toFixed(0)} MW
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {supplyDemandGap >= 0 ? 'Surplus' : 'Deficit'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supply vs Demand Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Supply vs Demand - 24 Hour Profile</CardTitle>
          <CardDescription>Real-time monitoring of supply and demand balance</CardDescription>
        </CardHeader>
        <CardContent>
          {supplyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={supplyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis label={{ value: 'Power (MW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="supply" stroke="#8884d8" name="Supply (MW)" strokeWidth={2} />
                <Line type="monotone" dataKey="demand" stroke="#ff7300" name="Demand (MW)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No supply data available
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regional Reliability */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Reliability</CardTitle>
            <CardDescription>Supply reliability metrics by region</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionalReliability}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis domain={[90, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="reliability" fill="#8884d8" name="Reliability %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Regional Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Regional Performance Index</CardTitle>
            <CardDescription>Multi-dimensional performance comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={regionalReliability}>
                <PolarGrid />
                <PolarAngleAxis dataKey="region" />
                <PolarRadiusAxis domain={[90, 100]} />
                <Radar name="Reliability" dataKey="reliability" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Availability" dataKey="availability" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Outage History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Outages & Incidents</CardTitle>
          <CardDescription>Historical outage data and resolution times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {outages === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-lg font-medium">No Active Outages</p>
                <p className="text-sm text-muted-foreground">All systems operating normally</p>
              </div>
            ) : (
              <>
                {Array.from({ length: outages }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium">Outage #{i + 1}</p>
                        <p className="text-sm text-muted-foreground">Region: {['Northern', 'Western', 'Eastern'][i % 3]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor(Math.random() * 60)} min
                      </Badge>
                      <Badge variant="secondary">Under Investigation</Badge>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

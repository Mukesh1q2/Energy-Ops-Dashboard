
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Download, RefreshCw, AlertCircle } from "lucide-react"

interface RmoData {
  TechnologyType: string;
  Region: string;
  State: string;
  ContractType: string;
  PlantName: string;
  ContractName: string;
  TimePeriod: string;
  TimeBlock: number;
  DAMPrice: number;
  GDAMPrice: number;
  RTMPrice: number;
  ScheduledMW: number;
  ModelResultsMW: number;
  ModelID: string;
  ModelTriggerTime: string;
}

// Hook to fetch RMO data from uploaded Excel
function useRmoData() {
  const [data, setData] = useState<RmoData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/rmo/data')
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        setData(result.data)
      } else {
        setError(result.error || 'No RMO data found')
        // Fallback to empty array if no data
        setData([])
      }
    } catch (err) {
      console.error('Error fetching RMO data:', err)
      setError('Failed to fetch RMO data')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}

export function RmoPriceChart() {
  const { data, loading, error, refetch } = useRmoData()
  
  const chartData = data.map(item => ({
    time: new Date(item.TimePeriod).toLocaleTimeString(),
    DAMPrice: item.DAMPrice,
    GDAMPrice: item.GDAMPrice,
    RTMPrice: item.RTMPrice,
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading RMO data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            {error || 'No RMO data uploaded yet'}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Please upload an RMO Excel file in the Sandbox to see charts here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>RMO Price Chart</CardTitle>
            <CardDescription>DAM, GDAM, and RTM Price over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="DAMPrice" stroke="#8884d8" />
              <Line type="monotone" dataKey="GDAMPrice" stroke="#82ca9d" />
              <Line type="monotone" dataKey="RTMPrice" stroke="#ffc658" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function RmoScheduleChart() {
  const { data, loading, error, refetch } = useRmoData()
  
  const chartData = data.map(item => ({
    time: new Date(item.TimePeriod).toLocaleTimeString(),
    Scheduled: item.ScheduledMW,
    Actual: item.ModelResultsMW || item.ScheduledMW,
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading RMO data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            {error || 'No RMO data uploaded yet'}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Please upload an RMO Excel file in the Sandbox to see charts here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>RMO Schedule vs Actual</CardTitle>
            <CardDescription>Scheduled MW vs Model Results MW</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Scheduled" fill="#8884d8" />
              <Bar dataKey="Actual" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function RmoOptimizationChart() {
  const { data, loading, error, refetch } = useRmoData()
  
  const chartData = data.map(item => ({
    time: new Date(item.TimePeriod).toLocaleTimeString(),
    DAMPrice: item.DAMPrice,
    RTMPrice: item.RTMPrice,
    Scheduled: item.ScheduledMW,
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading RMO data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error || data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-muted-foreground text-center mb-4">
            {error || 'No RMO data uploaded yet'}
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Please upload an RMO Excel file in the Sandbox to see charts here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>RMO Optimization Analysis</CardTitle>
            <CardDescription>Price comparison and scheduling optimization</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="DAMPrice" stroke="#8884d8" name="DAM Price" />
              <Line yAxisId="left" type="monotone" dataKey="RTMPrice" stroke="#ffc658" name="RTM Price" />
              <Line yAxisId="right" type="monotone" dataKey="Scheduled" stroke="#82ca9d" name="Scheduled MW" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

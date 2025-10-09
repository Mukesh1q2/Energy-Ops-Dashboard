"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InteractiveChartDashboard } from "./enhanced-charts"
import { 
  RealTimeChart, 
  ComparativeChart, 
  PredictiveChart 
} from "./advanced-analytics"
import { 
  Activity, 
  TrendingUp, 
  Brain, 
  Zap, 
  RefreshCw, 
  Download,
  Settings,
  Fullscreen,
  Share2
} from "lucide-react"

export function InteractiveDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isRealTime, setIsRealTime] = useState(true)

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    // Set up real-time updates
    let interval: NodeJS.Timeout
    if (isRealTime) {
      interval = setInterval(() => {
        setLastUpdate(new Date())
      }, 5000) // Update every 5 seconds
    }

    return () => {
      clearTimeout(timer)
      if (interval) clearInterval(interval)
    }
  }, [isRealTime])

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setLastUpdate(new Date())
    }, 1000)
  }

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime)
  }

  const dashboardStats = {
    totalCharts: 12,
    activeUsers: 247,
    dataPoints: 15420,
    updateFrequency: isRealTime ? '5s' : 'Manual'
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Interactive Analytics Dashboard
              </CardTitle>
              <CardDescription>
                Advanced data visualization with real-time updates and interactive features
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={isRealTime ? "default" : "outline"} 
                size="sm" 
                onClick={toggleRealTime}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isRealTime ? 'Live' : 'Paused'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Fullscreen className="w-4 h-4 mr-2" />
                Fullscreen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold text-blue-600">{dashboardStats.totalCharts}</div>
              <div className="text-xs text-muted-foreground">Active Charts</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold text-green-600">{dashboardStats.activeUsers}</div>
              <div className="text-xs text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold text-purple-600">{dashboardStats.dataPoints.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Data Points</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-xl font-bold text-orange-600">{dashboardStats.updateFrequency}</div>
              <div className="text-xs text-muted-foreground">Update Frequency</div>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">Real-time Data</Badge>
              <Badge variant="outline">Interactive Charts</Badge>
              <Badge variant="outline">Advanced Analytics</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Loading Dashboard</h3>
              <p className="text-muted-foreground">Preparing your interactive analytics...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="charts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Interactive Charts
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real-time Analytics
            </TabsTrigger>
            <TabsTrigger value="comparative" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Comparative Analysis
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Predictive Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <InteractiveChartDashboard />
          </TabsContent>

          <TabsContent value="realtime" className="space-y-4">
            <RealTimeChart />
          </TabsContent>

          <TabsContent value="comparative" className="space-y-4">
            <ComparativeChart />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            <PredictiveChart />
          </TabsContent>
        </Tabs>
      )}

      {/* Dashboard Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Dashboard Settings
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share Dashboard
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Dashboard v2.0 • Advanced Analytics Platform
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
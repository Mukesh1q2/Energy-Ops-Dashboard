"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Zap,
  Battery,
  BarChart3,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchReportStats()
  }, [])

  const fetchReportStats = async () => {
    try {
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const reports = [
    {
      id: 'dmo-summary',
      title: 'Day-Ahead Market (DMO) Summary',
      description: 'Complete analysis of DMO optimization runs and performance',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50',
      metrics: { runs: 45, avgRevenue: '₹ 2.4M', efficiency: '94.2%' }
    },
    {
      id: 'rtm-summary',
      title: 'Real-Time Market (RMO) Summary',
      description: 'RMO optimization results and real-time bidding analysis',
      icon: Zap,
      color: 'text-purple-600 bg-purple-50',
      metrics: { runs: 128, avgRevenue: '₹ 1.8M', efficiency: '91.5%' }
    },
    {
      id: 'storage-ops',
      title: 'Storage Operations (SO) Report',
      description: 'Battery storage optimization and cycle analysis',
      icon: Battery,
      color: 'text-green-600 bg-green-50',
      metrics: { runs: 67, avgRevenue: '₹ 980K', efficiency: '88.7%' }
    },
    {
      id: 'daily-summary',
      title: 'Daily Operations Summary',
      description: 'End-of-day report with all optimization activities',
      icon: Calendar,
      color: 'text-orange-600 bg-orange-50',
      metrics: { dataPoints: '12.5K', accuracy: '96.8%', uptime: '99.9%' }
    },
    {
      id: 'weekly-analytics',
      title: 'Weekly Analytics Report',
      description: 'Week-over-week performance trends and insights',
      icon: BarChart3,
      color: 'text-indigo-600 bg-indigo-50',
      metrics: { totalRevenue: '₹ 18.2M', avgPrice: '₹ 3,245', volume: '5,600 MWh' }
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metrics Dashboard',
      description: 'System performance, latency, and reliability metrics',
      icon: Activity,
      color: 'text-pink-600 bg-pink-50',
      metrics: { avgLatency: '45ms', successRate: '99.4%', errors: '12' }
    }
  ]

  const quickStats = [
    {
      label: 'Total Data Points',
      value: stats?.totalRecords?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: Activity
    },
    {
      label: 'Optimization Runs',
      value: '240',
      change: '+8.2%',
      trend: 'up',
      icon: Zap
    },
    {
      label: 'Average Revenue',
      value: '₹ 5.2M',
      change: '+15.3%',
      trend: 'up',
      icon: TrendingUp
    },
    {
      label: 'System Uptime',
      value: '99.9%',
      change: '+0.1%',
      trend: 'up',
      icon: Clock
    }
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive reports and insights from your energy operations
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center text-xs">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabs for Report Categories */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = report.icon
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${report.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary">PDF</Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Object.entries(report.metrics).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-muted-foreground capitalize">{key}</p>
                          <p className="text-sm font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="optimization">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.filter(r => ['dmo-summary', 'rtm-summary', 'storage-ops'].includes(r.id)).map((report) => {
              const Icon = report.icon
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${report.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary">PDF</Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Object.entries(report.metrics).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-muted-foreground capitalize">{key}</p>
                          <p className="text-sm font-semibold">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle>Operations Reports</CardTitle>
              <CardDescription>Daily and weekly operational summaries</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Operational reports will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reports</CardTitle>
              <CardDescription>System performance and reliability metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Performance reports will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Report Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Report Activity</CardTitle>
          <CardDescription>Latest report generations and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { report: 'DMO Summary Report', user: 'System', time: '2 hours ago', action: 'Generated' },
              { report: 'Weekly Analytics', user: 'Admin', time: '5 hours ago', action: 'Downloaded' },
              { report: 'Storage Operations', user: 'System', time: '1 day ago', action: 'Generated' },
              { report: 'Performance Metrics', user: 'Admin', time: '2 days ago', action: 'Viewed' }
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{activity.report}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.action} by {activity.user}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

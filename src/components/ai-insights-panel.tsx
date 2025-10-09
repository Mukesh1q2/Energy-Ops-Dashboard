"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Sparkles,
  Target,
  Activity,
  Zap,
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Insight {
  id: string
  type: 'anomaly' | 'trend' | 'pattern' | 'recommendation' | 'forecast'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  impact?: string
  confidence: number
  action_label?: string
  action_url?: string
  created_at: string
}

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchInsights()
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchInsights, 120000)
    return () => clearInterval(interval)
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/insights')
      const result = await response.json()
      
      if (result.success) {
        setInsights(result.data)
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5" />
      case 'trend':
        return <TrendingUp className="w-5 h-5" />
      case 'pattern':
        return <Activity className="w-5 h-5" />
      case 'recommendation':
        return <Lightbulb className="w-5 h-5" />
      case 'forecast':
        return <Target className="w-5 h-5" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'high':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      critical: 'destructive',
      high: 'default',
      medium: 'secondary',
      low: 'outline'
    }
    return variants[severity] || 'outline'
  }

  const filterInsights = (type: string) => {
    if (type === 'all') return insights
    return insights.filter(i => i.type === type)
  }

  const filteredInsights = filterInsights(activeTab)

  if (loading && insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>Loading intelligent analytics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-purple-200 dark:border-purple-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Intelligent analytics and actionable recommendations
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="anomaly">Anomalies</TabsTrigger>
            <TabsTrigger value="trend">Trends</TabsTrigger>
            <TabsTrigger value="recommendation">Tips</TabsTrigger>
            <TabsTrigger value="forecast">Forecasts</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value={activeTab} className="space-y-3 mt-0">
              {filteredInsights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">No insights available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI is analyzing your data...
                  </p>
                </div>
              ) : (
                filteredInsights.map((insight) => (
                  <Card
                    key={insight.id}
                    className={cn(
                      "border-l-4 transition-all hover:shadow-md cursor-pointer",
                      getSeverityColor(insight.severity)
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className={cn(
                            "p-2 rounded-lg",
                            insight.severity === 'critical' && "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
                            insight.severity === 'high' && "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
                            insight.severity === 'medium' && "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400",
                            insight.severity === 'low' && "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                          )}>
                            {getInsightIcon(insight.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-sm">{insight.title}</h4>
                            <Badge variant={getSeverityBadge(insight.severity)} className="text-xs">
                              {insight.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          {insight.impact && (
                            <div className="flex items-start gap-2 mb-2 p-2 rounded bg-background/50">
                              <Zap className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Impact:</span> {insight.impact}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {insight.confidence}% confident
                              </Badge>
                              <span className="text-xs text-muted-foreground capitalize">
                                {insight.type}
                              </span>
                            </div>
                            {insight.action_label && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  if (insight.action_url) {
                                    window.location.href = insight.action_url
                                  }
                                }}
                              >
                                {insight.action_label}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  )
}

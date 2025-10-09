"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  TrendingUp,
  Zap,
  Map,
  Users,
  Target,
  GitCompare,
  Plus,
  Maximize2
} from "lucide-react"
import { 
  GeneratorSchedulingChart, 
  ContractSchedulingChart, 
  MarketBiddingChart 
} from "./dmo-charts"
import { 
  StorageCapacityChart, 
  StoragePerformanceChart 
} from "./storage-charts"
import { 
  PriceTrendsChart, 
  VolumeAnalysisChart, 
  PerformanceMetricsChart 
} from "./analytics-charts"
import {
  TransmissionFlowChart,
  TransmissionLossesChart
} from "./transmission-charts"
import {
  ConsumptionBySectorChart,
  DemandPatternChart
} from "./consumption-charts"

export function InteractiveChartGallery() {
  const [activeCategory, setActiveCategory] = useState('generation')
  const [expandedChart, setExpandedChart] = useState<string | null>(null)

  const categories = [
    {
      id: 'generation',
      label: 'Generation',
      icon: Zap,
      color: 'text-blue-500',
      charts: [
        { 
          id: 'gen-scheduling', 
          component: GeneratorSchedulingChart,
          title: 'Generator Scheduling',
          description: 'Day-ahead generator dispatch schedules'
        },
        { 
          id: 'contract-scheduling', 
          component: ContractSchedulingChart,
          title: 'Contract Scheduling',
          description: 'Bilateral contract schedules and commitments'
        }
      ]
    },
    {
      id: 'market',
      label: 'Market Analysis',
      icon: TrendingUp,
      color: 'text-purple-500',
      charts: [
        { 
          id: 'market-bidding', 
          component: MarketBiddingChart,
          title: 'Market Bidding',
          description: 'Day-ahead market bidding strategies'
        },
        { 
          id: 'price-trends', 
          component: PriceTrendsChart,
          title: 'Price Trends',
          description: 'Market clearing price analysis'
        },
        { 
          id: 'volume-analysis', 
          component: VolumeAnalysisChart,
          title: 'Volume Analysis',
          description: 'Trading volume patterns and trends'
        }
      ]
    },
    {
      id: 'transmission',
      label: 'Transmission',
      icon: Map,
      color: 'text-orange-500',
      charts: [
        { 
          id: 'transmission-flow', 
          component: TransmissionFlowChart,
          title: 'Transmission Flow',
          description: 'Power flow across transmission corridors'
        },
        { 
          id: 'transmission-losses', 
          component: TransmissionLossesChart,
          title: 'Transmission Losses',
          description: 'Line losses and efficiency metrics'
        }
      ]
    },
    {
      id: 'consumption',
      label: 'Consumption',
      icon: Users,
      color: 'text-green-500',
      charts: [
        { 
          id: 'consumption-sector', 
          component: ConsumptionBySectorChart,
          title: 'Consumption by Sector',
          description: 'Industrial, residential, and commercial demand'
        },
        { 
          id: 'demand-pattern', 
          component: DemandPatternChart,
          title: 'Demand Patterns',
          description: '24-hour load curve analysis'
        }
      ]
    },
    {
      id: 'storage',
      label: 'Storage Operations',
      icon: Target,
      color: 'text-yellow-500',
      charts: [
        { 
          id: 'storage-capacity', 
          component: StorageCapacityChart,
          title: 'Storage Capacity',
          description: 'Battery capacity and state of charge'
        },
        { 
          id: 'storage-performance', 
          component: StoragePerformanceChart,
          title: 'Storage Performance',
          description: 'Charge/discharge efficiency metrics'
        }
      ]
    },
    {
      id: 'optimization',
      label: 'Optimization',
      icon: GitCompare,
      color: 'text-pink-500',
      charts: [
        { 
          id: 'performance-metrics', 
          component: PerformanceMetricsChart,
          title: 'Performance Metrics',
          description: 'Optimization results and KPIs'
        }
      ]
    }
  ]

  const activeCharts = categories.find(c => c.id === activeCategory)?.charts || []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Interactive Chart Gallery
            </CardTitle>
            <CardDescription>
              Comprehensive visualization across all energy sectors
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Chart
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex items-center gap-2"
                >
                  <Icon className={`w-4 h-4 ${category.color}`} />
                  <span className="hidden md:inline">{category.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm">
                  {category.charts.length} Chart{category.charts.length !== 1 ? 's' : ''} Available
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {category.charts.map((chart) => {
                  const ChartComponent = chart.component
                  const isExpanded = expandedChart === chart.id

                  return (
                    <div
                      key={chart.id}
                      className={`transition-all ${
                        isExpanded ? 'lg:col-span-2' : ''
                      }`}
                    >
                      <Card className="border-2 hover:border-primary/50 transition-colors">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg">{chart.title}</CardTitle>
                              <CardDescription className="text-sm">
                                {chart.description}
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setExpandedChart(
                                isExpanded ? null : chart.id
                              )}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ChartComponent />
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>

              {category.charts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No charts available in this category</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chart
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

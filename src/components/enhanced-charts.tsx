"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  FunnelChart,
  Funnel,
  Treemap,
  ReferenceLine,
  Brush
} from "recharts"
import { Download, RefreshCw, ZoomIn, ZoomOut, Filter, TrendingUp } from "lucide-react"

interface EnhancedChartData {
  id: string
  timestamp: string
  value: number
  category: string
  metadata?: Record<string, any>
}

interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter' | 'radar' | 'funnel' | 'treemap'
  title: string
  description: string
  dataKey: string
  colorScheme: string[]
  showLegend: boolean
  showGrid: boolean
  interactive: boolean
}

const colorSchemes = {
  default: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'],
  vibrant: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'],
  professional: ['#2c3e50', '#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6'],
  monochrome: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7', '#ecf0f1']
}

export function EnhancedLineChart({ 
  data, 
  config, 
  onZoom, 
  onFilter 
}: { 
  data: EnhancedChartData[], 
  config: ChartConfig,
  onZoom?: (range: [number, number]) => void,
  onFilter?: (filters: Record<string, any>) => void 
}) {
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, data.length - 1])
  const [filteredData, setFilteredData] = useState(data)

  useEffect(() => {
    const [start, end] = zoomRange
    setFilteredData(data.slice(start, end + 1))
  }, [data, zoomRange])

  const chartData = filteredData.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    value: item.value,
    category: item.category
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          <div className="flex gap-2">
            {config.interactive && (
              <>
                <Button variant="outline" size="sm" onClick={() => setZoomRange([0, data.length - 1])}>
                  <ZoomOut className="w-4 h-4 mr-2" />
                  Reset Zoom
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </>
            )}
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
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              {config.showLegend && <Legend />}
              <Line 
                type="monotone" 
                dataKey={config.dataKey} 
                stroke={config.colorScheme[0]} 
                strokeWidth={2}
                dot={{ fill: config.colorScheme[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: config.colorScheme[0], strokeWidth: 2 }}
              />
              {config.interactive && (
                <Brush 
                  dataKey="time" 
                  height={30} 
                  stroke={config.colorScheme[1]}
                  startIndex={zoomRange[0]}
                  endIndex={zoomRange[1]}
                  onChange={(e) => {
                    if (e.startIndex !== undefined && e.endIndex !== undefined) {
                      setZoomRange([e.startIndex, e.endIndex])
                      onZoom?.([e.startIndex, e.endIndex])
                    }
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {config.interactive && (
          <div className="mt-4 flex gap-2">
            <Badge variant="outline">Interactive Zoom</Badge>
            <Badge variant="outline">Real-time Updates</Badge>
            <Badge variant="outline">Advanced Filtering</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EnhancedComposedChart({ 
  data, 
  config 
}: { 
  data: EnhancedChartData[], 
  config: ChartConfig 
}) {
  const chartData = data.map(item => ({
    time: new Date(item.timestamp).toLocaleDateString(),
    primary: item.value,
    secondary: item.value * 0.8 + Math.random() * 20,
    tertiary: item.value * 0.6 + Math.random() * 15,
    category: item.category
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
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
            <ComposedChart data={chartData}>
              {config.showGrid && <CartesianGrid strokeDasharray="3 3" />}
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              {config.showLegend && <Legend />}
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="primary" 
                stackId="1" 
                stroke={config.colorScheme[0]} 
                fill={config.colorScheme[0]} 
                fillOpacity={0.3}
              />
              <Bar yAxisId="left" dataKey="secondary" fill={config.colorScheme[1]} />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="tertiary" 
                stroke={config.colorScheme[2]} 
                strokeWidth={2}
              />
              <ReferenceLine yAxisId="left" stroke="#ff0000" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function EnhancedRadarChart({ 
  data, 
  config 
}: { 
  data: EnhancedChartData[], 
  config: ChartConfig 
}) {
  const radarData = Object.entries(
    data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.value
      return acc
    }, {} as Record<string, number>)
  ).map(([subject, value]) => ({ subject, value, fullMark: 100 }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
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
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar 
                name="Performance" 
                dataKey="value" 
                stroke={config.colorScheme[0]} 
                fill={config.colorScheme[0]} 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {config.showLegend && <Legend />}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function EnhancedTreemapChart({ 
  data, 
  config 
}: { 
  data: EnhancedChartData[], 
  config: ChartConfig 
}) {
  const treemapData = Object.entries(
    data.reduce((acc, item) => {
      const category = item.category
      if (!acc[category]) {
        acc[category] = { name: category, size: 0, color: '' }
      }
      acc[category].size += item.value
      acc[category].color = config.colorScheme[Object.keys(acc).length - 1 % config.colorScheme.length]
      return acc
    }, {} as Record<string, { name: string; size: number; color: string }>)
  ).map(([_, value]) => value)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
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
            <Treemap
              data={treemapData}
              dataKey="size"
              aspectRatio={4/3}
              stroke="#fff"
              fill="#8884d8"
            >
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    return (
                      <div className="bg-background border border-border rounded p-2">
                        <p className="font-medium">{payload[0].payload.name}</p>
                        <p className="text-sm">Value: {payload[0].value.toLocaleString()}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function InteractiveChartDashboard() {
  const [selectedChartType, setSelectedChartType] = useState<string>('composed')
  const [selectedColorScheme, setSelectedColorScheme] = useState<keyof typeof colorSchemes>('default')
  const [data, setData] = useState<EnhancedChartData[]>([])

  useEffect(() => {
    // Generate sample data
    const sampleData: EnhancedChartData[] = Array.from({ length: 50 }, (_, i) => ({
      id: `data-${i}`,
      timestamp: new Date(Date.now() - (49 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: Math.random() * 100 + 50,
      category: ['Category A', 'Category B', 'Category C', 'Category D'][Math.floor(Math.random() * 4)]
    }))
    setData(sampleData)
  }, [])

  const chartConfigs: Record<string, ChartConfig> = {
    line: {
      type: 'line',
      title: 'Enhanced Line Chart',
      description: 'Interactive line chart with zoom and filtering capabilities',
      dataKey: 'value',
      colorScheme: colorSchemes[selectedColorScheme],
      showLegend: true,
      showGrid: true,
      interactive: true
    },
    composed: {
      type: 'composed',
      title: 'Advanced Composed Chart',
      description: 'Multi-axis composed chart with areas, bars, and lines',
      dataKey: 'primary',
      colorScheme: colorSchemes[selectedColorScheme],
      showLegend: true,
      showGrid: true,
      interactive: true
    },
    radar: {
      type: 'radar',
      title: 'Performance Radar Chart',
      description: 'Multi-dimensional performance analysis',
      dataKey: 'value',
      colorScheme: colorSchemes[selectedColorScheme],
      showLegend: true,
      showGrid: true,
      interactive: false
    },
    treemap: {
      type: 'treemap',
      title: 'Hierarchical Treemap',
      description: 'Hierarchical data visualization with size encoding',
      dataKey: 'size',
      colorScheme: colorSchemes[selectedColorScheme],
      showLegend: false,
      showGrid: false,
      interactive: false
    }
  }

  const renderChart = () => {
    const config = chartConfigs[selectedChartType]
    
    switch (config.type) {
      case 'line':
        return <EnhancedLineChart data={data} config={config} />
      case 'composed':
        return <EnhancedComposedChart data={data} config={config} />
      case 'radar':
        return <EnhancedRadarChart data={data} config={config} />
      case 'treemap':
        return <EnhancedTreemapChart data={data} config={config} />
      default:
        return <EnhancedComposedChart data={data} config={config} />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Chart Dashboard</CardTitle>
          <CardDescription>Advanced data visualization with multiple chart types and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={selectedChartType} onValueChange={setSelectedChartType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Chart Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="composed">Composed Chart</SelectItem>
                <SelectItem value="radar">Radar Chart</SelectItem>
                <SelectItem value="treemap">Treemap Chart</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedColorScheme} onValueChange={(value: keyof typeof colorSchemes) => setSelectedColorScheme(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Color Scheme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="vibrant">Vibrant</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="monochrome">Monochrome</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-sm text-muted-foreground">Data Points</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.reduce((max, item) => Math.max(max, item.value), 0).toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">Max Value</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.reduce((sum, item) => sum + item.value, 0) / data.length > 0 
                  ? (data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(0) 
                  : '0'}
              </div>
              <div className="text-sm text-muted-foreground">Average</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {new Set(data.map(item => item.category)).size}
              </div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {renderChart()}
    </div>
  )
}
"use client"

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, TrendingUp, BarChart3, Filter, Download } from 'lucide-react'
import { generateTimeblockLabels } from '@/lib/data-source-manager'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DynamicTimeblockChartProps {
  dataSourceId?: string
  moduleType: 'dmo' | 'rmo' | 'so'
  chartType?: 'line' | 'bar'
  title?: string
  description?: string
  height?: number
  showFilters?: boolean
  filters?: Record<string, any>
}

interface ChartDataPoint {
  timeblock_index: number
  timeblock_label: string
  scheduled_mw?: number
  actual_mw?: number
  dam_price?: number
  rtm_price?: number
  gdam_price?: number
}

export function DynamicTimeblockChart({
  dataSourceId,
  moduleType,
  chartType = 'line',
  title,
  description,
  height = 400,
  showFilters = true,
  filters,
}: DynamicTimeblockChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterColumns, setFilterColumns] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({})
  const [dataType, setDataType] = useState<'price' | 'volume'>('price')

  // Generate timeblock labels based on module type
  const timeblockLabels = useMemo(() => {
    return generateTimeblockLabels(moduleType)
  }, [moduleType])

  // Fetch filterable columns
  useEffect(() => {
    if (!dataSourceId || !showFilters) return

    const fetchFilters = async () => {
      try {
        const response = await fetch(`/api/dmo/data-sources/${dataSourceId}/columns`)
        const result = await response.json()
        if (result.success) {
          setFilterColumns(result.columns)
        }
      } catch (error) {
        console.error('Failed to fetch filter columns:', error)
      }
    }

    fetchFilters()
  }, [dataSourceId, showFilters])

  // Fetch chart data
  useEffect(() => {
    if (!dataSourceId) {
      // Generate empty data with proper timeblock structure
      const emptyData = timeblockLabels.map((label) => ({
        timeblock_index: label.blockIndex,
        timeblock_label: label.timeLabel,
        scheduled_mw: 0,
        actual_mw: 0,
        dam_price: 0,
        rtm_price: 0,
        // SO-specific fields
        battery_soc: 0,
        charging_mw: 0,
        discharging_mw: 0,
        energy_price: 0,
        net_power_mw: 0,
      }))
      setChartData(emptyData)
      return
    }

    fetchChartData()
  }, [dataSourceId, selectedFilters, moduleType, filters])

  const fetchChartData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Determine the correct API endpoint based on module type
      const apiEndpoint = moduleType === 'so' ? '/api/so/chart-data' : '/api/dmo/chart-data'
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId,
          moduleType,
          filters: { ...(filters || {}), ...(selectedFilters || {}) },
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Map data to timeblock structure
        const mappedData = timeblockLabels.map((label) => {
          const dataPoint = result.data.find(
            (d: any) => d.timeblock_index === label.blockIndex
          )
          return {
            timeblock_index: label.blockIndex,
            timeblock_label: label.timeLabel,
            ...(dataPoint || {
              scheduled_mw: 0,
              actual_mw: 0,
              dam_price: 0,
              rtm_price: 0,
            }),
          }
        })
        setChartData(mappedData)
      } else {
        setError(result.error || 'Failed to fetch chart data')
      }
    } catch (error) {
      console.error('Chart data fetch error:', error)
      setError('Network or server error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (columnName: string, value: any) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [columnName]: value,
    }))
  }

  const clearFilters = () => {
    setSelectedFilters({})
  }

  const customTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (!active || !payload || !payload.length) return null

    const timeLabel =
      timeblockLabels.find((l) => l.blockIndex === parseInt(label))?.timeLabel || label

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
        <p className="font-semibold text-sm">
          Block {label} ({timeLabel})
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toFixed(2)} {dataType === 'price' ? 'Rs/MWh' : 'MW'}
          </p>
        ))}
      </div>
    )
  }

  const chartTitle = title || `${moduleType.toUpperCase()} ${dataType === 'price' ? 'Price' : 'Volume'} by Timeblock`
  const chartDescription =
    description ||
    `${moduleType === 'rmo' ? '48 blocks (30-min intervals)' : '96 blocks (15-min intervals)'}`

  const ChartComponent = chartType === 'bar' ? BarChart : LineChart
  const DataComponent = chartType === 'bar' ? Bar : Line

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {chartType === 'bar' ? (
                <BarChart3 className="h-5 w-5" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              {chartTitle}
            </CardTitle>
            <CardDescription>{chartDescription}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select value={dataType} onValueChange={(v: any) => setDataType(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moduleType === 'so' ? (
                  <>
                    <SelectItem value="price">Energy Price</SelectItem>
                    <SelectItem value="volume">Power Data</SelectItem>
                    <SelectItem value="soc">Battery SOC</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="price">Price Data</SelectItem>
                    <SelectItem value="volume">Volume Data</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {!dataSourceId && (
              <Badge variant="secondary" className="text-xs">
                Demo Data
              </Badge>
            )}
          </div>
        </div>

        {showFilters && filterColumns.length > 0 && (
          <div className="flex items-center gap-2 pt-3 border-t flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {filterColumns.slice(0, 3).map((col) => (
              <Select
                key={col.id}
                value={selectedFilters[col.column_name] || 'all'}
                onValueChange={(value) =>
                  handleFilterChange(col.column_name, value === 'all' ? null : value)
                }
              >
                <SelectTrigger className="w-[150px] h-8 text-xs">
                  <SelectValue placeholder={col.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {col.label}</SelectItem>
                  {col.sample_values?.map((val: any, idx: number) => (
                    <SelectItem key={idx} value={String(val)}>
                      {String(val)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {Object.keys(selectedFilters).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <div className="text-center py-8 text-destructive">
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchChartData} className="mt-2">
              Retry
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && !error && (
          <ResponsiveContainer width="100%" height={height}>
            <ChartComponent data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="timeblock_index"
                tickFormatter={(value) => {
                  const label = timeblockLabels.find((l) => l.blockIndex === value)
                  return label ? `B${value}` : value
                }}
                label={{
                  value: `Time Block (${moduleType === 'rmo' ? '30-min' : '15-min'} intervals)`,
                  position: 'insideBottom',
                  offset: -5,
                }}
                interval="preserveStartEnd"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                label={{
                  value: dataType === 'price' ? 'Price (Rs/MWh)' : 
                         dataType === 'soc' ? 'State of Charge (%)' : 'Power (MW)',
                  angle: -90,
                  position: 'insideLeft',
                }}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />

              {moduleType === 'so' ? (
                // Storage Operations chart data
                dataType === 'price' ? (
                  <DataComponent
                    type="monotone"
                    dataKey="energy_price"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Energy Price"
                    strokeWidth={chartType === 'line' ? 2 : undefined}
                  />
                ) : dataType === 'soc' ? (
                  <DataComponent
                    type="monotone"
                    dataKey="battery_soc"
                    stroke="#ff7300"
                    fill="#ff7300"
                    name="Battery SOC (%)"
                    strokeWidth={chartType === 'line' ? 2 : undefined}
                  />
                ) : (
                  // Power data
                  <>
                    <DataComponent
                      type="monotone"
                      dataKey="charging_mw"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Charging MW"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                    <DataComponent
                      type="monotone"
                      dataKey="discharging_mw"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Discharging MW"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                    <DataComponent
                      type="monotone"
                      dataKey="net_power_mw"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="Net Power MW"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                  </>
                )
              ) : (
                // DMO/RMO chart data
                dataType === 'price' ? (
                  <>
                    <DataComponent
                      type="monotone"
                      dataKey="dam_price"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="DAM Price"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                    <DataComponent
                      type="monotone"
                      dataKey="rtm_price"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="RTM Price"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                    <DataComponent
                      type="monotone"
                      dataKey="gdam_price"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="GDAM Price"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                  </>
                ) : (
                  <>
                    <DataComponent
                      type="monotone"
                      dataKey="scheduled_mw"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Scheduled MW"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                    <DataComponent
                      type="monotone"
                      dataKey="actual_mw"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Actual MW"
                      strokeWidth={chartType === 'line' ? 2 : undefined}
                    />
                  </>
                )
              )}
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

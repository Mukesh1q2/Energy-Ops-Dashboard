"use client"

import { useState, useEffect, useCallback } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RefreshCw, Calendar as CalendarIcon, Download, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { useSocket } from '@/hooks/use-socket'

interface MarketSnapshotData {
  timeblocks: number[]
  dam_price: number[]
  rtm_price: number[]
  gdam_price: number[]
  scheduled_mw: number[]
  modelresult_mw: number[]
  purchase_bid_mw: number[]
  sell_bid_mw: number[]
}

interface MarketSnapshotProps {
  autoRefresh?: boolean
  showFilters?: boolean
  height?: number
}

export function MarketSnapshot({ 
  autoRefresh = true, 
  showFilters = true,
  height = 500 
}: MarketSnapshotProps) {
  const [data, setData] = useState<MarketSnapshotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [interval, setInterval] = useState<string>('15')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [metadata, setMetadata] = useState<any>(null)
  const { socket, isConnected } = useSocket()

  const fetchData = useCallback(async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/api/market-snapshot?date=${dateStr}&interval=${interval}`
      )
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setMetadata(result.metadata)
      } else {
        toast.error('Failed to fetch market data', {
          description: result.error
        })
      }
    } catch (error) {
      console.error('Error fetching market snapshot:', error)
      toast.error('Failed to fetch market data')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, interval])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh on Socket.IO events
  useEffect(() => {
    if (!socket || !autoRefresh) return

    const handleDataUpload = () => {
      console.log('Data uploaded via Socket.IO, refreshing market snapshot...')
      fetchData()
    }

    socket.on('data:uploaded', handleDataUpload)
    socket.on('market-snapshot:updated', handleDataUpload)

    return () => {
      socket.off('data:uploaded', handleDataUpload)
      socket.off('market-snapshot:updated', handleDataUpload)
    }
  }, [socket, autoRefresh, fetchData])

  // Also listen for custom browser events (from upload page)
  useEffect(() => {
    if (!autoRefresh) return

    const handleCustomDataUpload = () => {
      console.log('Data uploaded via custom event, refreshing market snapshot...')
      fetchData()
    }

    window.addEventListener('data:uploaded', handleCustomDataUpload)

    return () => {
      window.removeEventListener('data:uploaded', handleCustomDataUpload)
    }
  }, [autoRefresh, fetchData])

  const getChartOption = () => {
    if (!data || data.timeblocks.length === 0) {
      return {
        title: {
          text: 'No Data Available',
          left: 'center',
          top: 'center',
          textStyle: {
            fontSize: 16,
            color: '#999'
          }
        }
      }
    }

    return {
      title: {
        text: 'Day-Ahead Market Snapshot',
        subtext: `Date: ${format(selectedDate, 'dd MMM yyyy')} | Interval: ${interval}min`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#999'
          }
        },
        formatter: (params: any) => {
          const block = params[0].axisValue
          let tooltip = `<strong>Timeblock: ${block}</strong><br/>`
          
          params.forEach((param: any) => {
            const value = param.value !== null ? param.value.toFixed(2) : 'N/A'
            const unit = param.seriesName.includes('Price') ? 'Rs/kWh' : 'MW'
            tooltip += `${param.marker} ${param.seriesName}: ${value} ${unit}<br/>`
          })
          
          return tooltip
        }
      },
      legend: {
        data: [
          'Purchase Bid (MW)',
          'Sell Bid (MW)',
          'MCV (MW)',
          'Scheduled Volume (MW)',
          'MCP (Rs/kWh)'
        ],
        top: 40,
        textStyle: {
          fontSize: 12
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        name: 'Time Block',
        nameLocation: 'middle',
        nameGap: 30,
        data: data.timeblocks,
        axisLabel: {
          rotate: 45,
          formatter: (value: number) => {
            // Show every 4th block for better readability
            const index = data.timeblocks.indexOf(value)
            return index % 4 === 0 ? value : ''
          }
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Market Volume (MW)',
          nameLocation: 'middle',
          nameGap: 50,
          position: 'left',
          axisLabel: {
            formatter: '{value} MW'
          }
        },
        {
          type: 'value',
          name: 'Price (Rs/kWh)',
          nameLocation: 'middle',
          nameGap: 50,
          position: 'right',
          axisLabel: {
            formatter: '{value}'
          }
        }
      ],
      series: [
        {
          name: 'Purchase Bid (MW)',
          type: 'line',
          yAxisIndex: 0,
          data: data.purchase_bid_mw,
          areaStyle: {
            color: '#6495ED',
            opacity: 0.5
          },
          lineStyle: {
            color: '#6495ED',
            width: 1
          },
          itemStyle: {
            color: '#6495ED'
          },
          smooth: true,
          stack: 'bids'
        },
        {
          name: 'Sell Bid (MW)',
          type: 'line',
          yAxisIndex: 0,
          data: data.sell_bid_mw,
          areaStyle: {
            color: '#FFD700',
            opacity: 0.5
          },
          lineStyle: {
            color: '#FFD700',
            width: 1
          },
          itemStyle: {
            color: '#FFD700'
          },
          smooth: true,
          stack: 'bids'
        },
        {
          name: 'MCV (MW)',
          type: 'line',
          yAxisIndex: 0,
          data: data.modelresult_mw,
          areaStyle: {
            color: '#90EE90',
            opacity: 0.6
          },
          lineStyle: {
            color: '#32CD32',
            width: 2
          },
          itemStyle: {
            color: '#32CD32'
          },
          smooth: true
        },
        {
          name: 'Scheduled Volume (MW)',
          type: 'line',
          yAxisIndex: 0,
          data: data.scheduled_mw,
          areaStyle: {
            color: '#DDA0DD',
            opacity: 0.4
          },
          lineStyle: {
            color: '#9370DB',
            width: 2
          },
          itemStyle: {
            color: '#9370DB'
          },
          smooth: true
        },
        {
          name: 'MCP (Rs/kWh)',
          type: 'line',
          yAxisIndex: 1,
          data: data.dam_price,
          lineStyle: {
            color: '#000000',
            width: 3
          },
          itemStyle: {
            color: '#000000'
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 6
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          height: 20,
          bottom: 10
        }
      ],
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        },
        right: 20
      }
    }
  }

  const handleDownload = () => {
    if (!data) return
    
    // Convert data to CSV
    const headers = [
      'Timeblock',
      'DAM Price',
      'RTM Price',
      'GDAM Price',
      'Purchase Bid MW',
      'Sell Bid MW',
      'Scheduled MW',
      'Model Result MW'
    ]
    const rows = data.timeblocks.map((block, idx) => [
      block,
      data.dam_price[idx]?.toFixed(2) || '',
      data.rtm_price[idx]?.toFixed(2) || '',
      data.gdam_price[idx]?.toFixed(2) || '',
      data.purchase_bid_mw[idx]?.toFixed(2) || '',
      data.sell_bid_mw[idx]?.toFixed(2) || '',
      data.scheduled_mw[idx]?.toFixed(2) || '',
      data.modelresult_mw[idx]?.toFixed(2) || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `market-snapshot-${format(selectedDate, 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Data exported successfully')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Market Snapshot</CardTitle>
              <CardDescription>
                Day-Ahead Market analysis with real-time data
              </CardDescription>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Interval Selector */}
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'dd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Download Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                disabled={!data || data.timeblocks.length === 0}
              >
                <Download className="h-4 w-4" />
              </Button>

              {/* Connection Status */}
              {autoRefresh && (
                <Badge variant={isConnected ? "default" : "destructive"} className="ml-2">
                  {isConnected ? '● Live' : '○ Offline'}
                </Badge>
              )}
            </div>
          )}
        </div>

        {metadata && (
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>Records: {metadata.recordCount}</span>
            <span>•</span>
            <span>Blocks: {metadata.aggregatedBlocks}</span>
            <span>•</span>
            <span>Interval: {metadata.interval} min</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ReactECharts
            option={getChartOption()}
            style={{ height: `${height}px`, width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
        )}
      </CardContent>
    </Card>
  )
}

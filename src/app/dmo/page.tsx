"use client"

import { useState, useEffect, useCallback } from 'react'
import { MarketSnapshot } from '@/components/dmo/market-snapshot'
import { DMOUploadTabs } from '@/components/dmo/dmo-upload-tabs'
import { OneClickPlotButton } from '@/components/dmo/one-click-plot-button'
import { DynamicTimeblockChart } from '@/components/dmo/dynamic-timeblock-chart'
import { DashboardFilters, type Filters } from '@/components/dashboard-filters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Database, Activity, TrendingUp, Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface Stats {
  totalRecords: number
  avgDamPrice: number
  totalScheduledVolume: number
  lastUpdated: string | null
}

export default function DMODashboardPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalRecords: 0,
    avgDamPrice: 0,
    totalScheduledVolume: 0,
    lastUpdated: null
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentDataSourceId, setCurrentDataSourceId] = useState<string | null>(null)
  const [chartsGenerated, setChartsGenerated] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Filters>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      toast.error('Invalid file type', {
        description: 'Please upload an Excel (.xlsx, .xls) or CSV file'
      })
      return
    }

    setUploadedFile(file)
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  })

  // Fetch stats for selected date
  const fetchStats = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(`/api/market-snapshot/stats?date=${dateStr}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Fetch stats on mount and when date changes
  useEffect(() => {
    fetchStats()
  }, [selectedDate])

  // Listen for data uploads to refresh stats and get data source ID
  useEffect(() => {
    const handleDataUpload = async () => {
      fetchStats()
      // Fetch the latest data source ID
      try {
        const response = await fetch('/api/dmo/data-sources?latest=true')
        const result = await response.json()
        if (result.success && result.dataSource) {
          setCurrentDataSourceId(result.dataSource.id)
        }
      } catch (error) {
        console.error('Failed to fetch data source:', error)
      }
    }

    window.addEventListener('data:uploaded', handleDataUpload)
    return () => window.removeEventListener('data:uploaded', handleDataUpload)
  }, [selectedDate])

  // Listen for chart generation events
  useEffect(() => {
    const handleChartsGenerated = () => {
      setChartsGenerated(true)
      setTimeout(() => setChartsGenerated(false), 3000)
    }

    window.addEventListener('charts:generated', handleChartsGenerated)
    return () => window.removeEventListener('charts:generated', handleChartsGenerated)
  }, [])

  // Handle filter changes
  const handleFiltersChange = useCallback((filters: Filters) => {
    setActiveFilters(filters)
    // Trigger data refresh with filters
    window.dispatchEvent(new CustomEvent('filters:changed', { detail: filters }))
  }, [])

  // Handle dashboard refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Clear any cached data
      localStorage.removeItem('dmo_dashboard_cache')
      
      // Trigger refresh events
      await fetchStats()
      window.dispatchEvent(new CustomEvent('dashboard:refresh'))
      
      toast.success('Dashboard refreshed', {
        description: 'All data has been reloaded from the latest sources'
      })
    } catch (error) {
      toast.error('Refresh failed', {
        description: 'Unable to reload dashboard data'
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadedFile)

    try {
      const response = await fetch('/api/market-snapshot/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Market data uploaded successfully!', {
          description: `${result.data.recordsInserted} records inserted from ${result.data.fileName}`
        })
        
        if (result.data.errors.length > 0) {
          toast.warning('Some rows had errors', {
            description: `${result.data.skipped} rows skipped. Check console for details.`
          })
          console.warn('Upload errors:', result.data.errors)
        }
        
        setUploadedFile(null)
        
        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('data:uploaded'))
      } else {
        toast.error(result.error || 'Upload failed', {
          description: result.message || result.details?.[0]
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('Failed to upload file', {
        description: `Network or server error: ${errorMessage}`
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">DMO Dashboard</h1>
              <p className="text-muted-foreground">
                Day-Ahead Market Optimization - Real-time monitoring and analysis
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Dashboard'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Market snapshot data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg DAM Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgDamPrice > 0 ? `₹${stats.avgDamPrice.toFixed(2)}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Rs/MWh {format(selectedDate, 'MMM d')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalScheduledVolume > 0 ? `${stats.totalScheduledVolume.toFixed(0)}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">MW scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastUpdated ? format(new Date(stats.lastUpdated), 'HH:mm') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastUpdated ? format(new Date(stats.lastUpdated), 'MMM d, yyyy') : 'No data yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Filters */}
      {currentDataSourceId && (
        <DashboardFilters
          moduleType="dmo"
          dataType="all"
          onFiltersChange={handleFiltersChange}
          compact={false}
        />
      )}

      {/* DMO Data Upload - Tabbed Interface */}
      <DMOUploadTabs />

      {/* One-Click Plot Generator */}
      {currentDataSourceId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <OneClickPlotButton
              dataSourceId={currentDataSourceId}
              dashboardId="dmo-dashboard"
              moduleType="dmo"
              onComplete={() => fetchStats()}
            />
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
                <CardDescription>
                  Use One-Click Plot to automatically generate timeblock charts with proper 96-block (15-min) intervals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Charts will be generated with DAM, RTM, and GDAM price data</li>
                  <li>• Volume charts will show Scheduled and Actual MW</li>
                  <li>• Filters will be automatically configured from Excel headers</li>
                  <li>• X-axis will display Block 1-96 with corresponding time labels</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dynamic Timeblock Charts */}
      <div className="grid grid-cols-1 gap-6">
        <DynamicTimeblockChart
          dataSourceId={currentDataSourceId || undefined}
          moduleType="dmo"
          chartType="line"
          title="DMO Price Analysis"
          description="96 timeblocks with 15-minute intervals"
          height={450}
          showFilters={!!currentDataSourceId}
          filters={activeFilters}
        />
        
        <DynamicTimeblockChart
          dataSourceId={currentDataSourceId || undefined}
          moduleType="dmo"
          chartType="bar"
          title="DMO Volume Analysis"
          description="Scheduled vs Actual MW by timeblock"
          height={450}
          showFilters={!!currentDataSourceId}
          filters={activeFilters}
        />
      </div>

      {/* Market Snapshot Upload - Keep for backward compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Quick Upload - Market Snapshot
          </CardTitle>
          <CardDescription>
            Upload Excel or CSV files with market snapshot data (TimePeriod, Timeblock, DAMprice, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : uploadedFile 
                ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploadedFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <Badge variant="outline" className="text-xs">
                    {uploadedFile.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span>{(uploadedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedFile(null)
                  }}
                  className="mt-2"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium mb-1">
                  {isDragActive 
                    ? 'Drop the file here...'
                    : 'Drag & drop Excel/CSV file here, or click to browse'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported formats: .xlsx, .xls, .csv (max 100MB)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Required columns: TimePeriod, Timeblock, DAMprice, RTMprice, ScheduleMW, ModelresultMW
                </p>
              </div>
            )}
          </div>

          <Button
            onClick={handleUpload}
            disabled={!uploadedFile || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload to Database
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Market Snapshot Chart */}
      <MarketSnapshot 
        autoRefresh={true}
        showFilters={true}
        height={550}
      />

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Data Requirements</CardTitle>
          <CardDescription>
            Excel/CSV file format requirements for market snapshot data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-2">Required Columns:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 py-0.5 rounded">TimePeriod</code> - Date/time (YYYY-MM-DD HH:MM:SS)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">Timeblock</code> - Integer (1-96 for 15-min intervals)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">DAMprice</code> - Decimal (Rs/kWh)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">RTMprice</code> - Decimal (Rs/kWh)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">ScheduleMW</code> - Decimal (MW)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">ModelresultMW</code> - Decimal (MW)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Optional Columns:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 py-0.5 rounded">GDAMprice</code> - Green DAM Price</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">PurchaseBidMW</code> - Purchase bid volume</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">SellBidMW</code> - Sell bid volume</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">State</code> - State name</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">PlantName</code> - Plant identifier</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">Region</code> - Geographic region</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DynamicTimeblockChart } from '@/components/dmo/dynamic-timeblock-chart'
import { OneClickPlotButton } from '@/components/dmo/one-click-plot-button'
import { Upload, Database, Activity, TrendingUp, Calendar as CalendarIcon, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'

interface RMOStats {
  totalRecords: number
  avgRtmPrice: number
  totalScheduledVolume: number
  lastUpdated: string | null
}

export default function RMODashboardPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [stats, setStats] = useState<RMOStats>({
    totalRecords: 0,
    avgRtmPrice: 0,
    totalScheduledVolume: 0,
    lastUpdated: null
  })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentDataSourceId, setCurrentDataSourceId] = useState<string | null>(null)
  const [chartsGenerated, setChartsGenerated] = useState(false)

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

  // Fetch RMO stats for selected date
  const fetchStats = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      // Note: Using RMO data endpoint instead of market-snapshot
      const response = await fetch(`/api/rmo/data?date=${dateStr}`)
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        // Calculate RMO-specific stats from data
        const records = result.data
        const avgRtmPrice = records.reduce((sum: number, r: any) => sum + (r.RTMPrice || 0), 0) / records.length
        const totalScheduledVolume = records.reduce((sum: number, r: any) => sum + (r.ScheduledMW || 0), 0)
        
        setStats({
          totalRecords: records.length,
          avgRtmPrice,
          totalScheduledVolume,
          lastUpdated: new Date().toISOString()
        })
      } else {
        // Set empty stats if no data
        setStats({
          totalRecords: 0,
          avgRtmPrice: 0,
          totalScheduledVolume: 0,
          lastUpdated: null
        })
      }
    } catch (error) {
      console.error('Error fetching RMO stats:', error)
      toast.error('Failed to fetch RMO statistics')
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
      // Fetch the latest data source ID for RMO
      try {
        const response = await fetch('/api/dmo/data-sources?latest=true&module=rmo')
        const result = await response.json()
        if (result.success && result.dataSource) {
          setCurrentDataSourceId(result.dataSource.id)
        }
      } catch (error) {
        console.error('Failed to fetch RMO data source:', error)
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

  const handleUpload = async () => {
    if (!uploadedFile) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadedFile)
    formData.append('moduleType', 'rmo') // Specify RMO module

    try {
      // Note: For now, using general upload endpoint - could create RMO-specific one
      const response = await fetch('/api/upload/process-sheet', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('RMO data uploaded successfully!', {
          description: `${result.data.recordsProcessed || 'Data'} processed from ${result.data.fileName || uploadedFile.name}`
        })
        
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
      toast.error('Failed to upload file', {
        description: 'Network or server error occurred'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">RMO Dashboard</h1>
            <p className="text-muted-foreground">
              Real-Time Market Optimization - 48 timeblocks with 30-minute intervals
            </p>
          </div>
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
            <p className="text-xs text-muted-foreground">RMO data points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg RTM Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRtmPrice > 0 ? `₹${stats.avgRtmPrice.toFixed(2)}` : '-'}
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

      {/* One-Click Plot Generator */}
      {currentDataSourceId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <OneClickPlotButton
              dataSourceId={currentDataSourceId}
              dashboardId="rmo-dashboard"
              moduleType="rmo"
              onComplete={() => fetchStats()}
            />
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>RMO Quick Info</CardTitle>
                <CardDescription>
                  Generate timeblock charts with 48-block (30-min) intervals for real-time market optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Charts show RTM price data for real-time market operations</li>
                  <li>• Volume charts display Scheduled vs Actual MW</li>
                  <li>• Filters automatically configured from Excel headers</li>
                  <li>• X-axis shows Block 1-48 with 30-minute time intervals</li>
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
          moduleType="rmo"
          chartType="line"
          title="RMO Price Analysis"
          description="48 timeblocks with 30-minute intervals"
          height={450}
          showFilters={!!currentDataSourceId}
        />
        
        <DynamicTimeblockChart
          dataSourceId={currentDataSourceId || undefined}
          moduleType="rmo"
          chartType="bar"
          title="RMO Volume Analysis"
          description="Scheduled vs Actual MW by timeblock"
          height={450}
          showFilters={!!currentDataSourceId}
        />
      </div>

      {/* RMO Data Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            RMO Data Upload
          </CardTitle>
          <CardDescription>
            Upload Excel or CSV files with real-time market data (TimePeriod, Timeblock, RTMprice, etc.)
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
                  Supported formats: .xlsx, .xls, .csv (max 10MB)
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Required columns: TimePeriod, Timeblock, RTMprice, ScheduleMW
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
                Upload RMO Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>RMO Data Requirements</CardTitle>
          <CardDescription>
            Excel/CSV file format requirements for real-time market data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-2">Required Columns:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 py-0.5 rounded">TimePeriod</code> - Date/time (YYYY-MM-DD HH:MM:SS)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">Timeblock</code> - Integer (1-48 for 30-min intervals)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">RTMprice</code> - Decimal (Rs/kWh)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">ScheduleMW</code> - Decimal (MW)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">ModelresultMW</code> - Decimal (MW)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Optional Columns:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 py-0.5 rounded">DAMprice</code> - Day-ahead reference price</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">State</code> - State name</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">PlantName</code> - Plant identifier</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">Region</code> - Geographic region</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">ContractName</code> - Contract identifier</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">TechnologyType</code> - Power generation type</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
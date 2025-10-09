"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DynamicTimeblockChart } from '@/components/dmo/dynamic-timeblock-chart'
import { OneClickPlotButton } from '@/components/dmo/one-click-plot-button'
import { Upload, Database, Activity, TrendingUp, Calendar as CalendarIcon, Battery } from 'lucide-react'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'

interface SOStats {
  totalRecords: number
  avgBatterySOC: number
  totalEnergyStored: number
  totalArbitrageRevenue: number
  lastUpdated: string | null
}

export default function SODashboardPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [stats, setStats] = useState<SOStats>({
    totalRecords: 0,
    avgBatterySOC: 0,
    totalEnergyStored: 0,
    totalArbitrageRevenue: 0,
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

  // Fetch SO stats for selected date
  const fetchStats = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      // Note: Using SO data endpoint
      const response = await fetch(`/api/so/data?date=${dateStr}`)
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        // Calculate SO-specific stats from data
        const records = result.data
        const avgBatterySOC = records.reduce((sum: number, r: any) => sum + (r.BatterySOC || 0), 0) / records.length
        const totalEnergyStored = records.reduce((sum: number, r: any) => sum + (r.ChargingMW || 0), 0)
        const totalArbitrageRevenue = records.reduce((sum: number, r: any) => sum + ((r.EnergyPrice || 0) * (r.DischargingMW - r.ChargingMW || 0)), 0)
        
        setStats({
          totalRecords: records.length,
          avgBatterySOC,
          totalEnergyStored,
          totalArbitrageRevenue,
          lastUpdated: new Date().toISOString()
        })
      } else {
        // Set empty stats if no data
        setStats({
          totalRecords: 0,
          avgBatterySOC: 0,
          totalEnergyStored: 0,
          totalArbitrageRevenue: 0,
          lastUpdated: null
        })
      }
    } catch (error) {
      console.error('Error fetching SO stats:', error)
      toast.error('Failed to fetch SO statistics')
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
      // Fetch the latest data source ID for SO
      try {
        const response = await fetch('/api/dmo/data-sources?latest=true&module=so')
        const result = await response.json()
        if (result.success && result.dataSource) {
          setCurrentDataSourceId(result.dataSource.id)
        }
      } catch (error) {
        console.error('Failed to fetch SO data source:', error)
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
    formData.append('moduleType', 'so') // Specify SO module

    try {
      // Note: Using general upload endpoint - could create SO-specific one
      const response = await fetch('/api/upload/process-sheet', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success('SO data uploaded successfully!', {
          description: `${result.data.recordsProcessed || 'Storage data'} processed from ${result.data.fileName || uploadedFile.name}`
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
          <Battery className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SO Dashboard</h1>
            <p className="text-muted-foreground">
              Storage Operations - Battery energy management with 96 timeblocks (15-min intervals)
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
            <p className="text-xs text-muted-foreground">Storage data points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Battery SOC</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgBatterySOC > 0 ? `${stats.avgBatterySOC.toFixed(1)}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">State of Charge {format(selectedDate, 'MMM d')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Stored</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalEnergyStored > 0 ? `${stats.totalEnergyStored.toFixed(0)}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">MWh charged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arbitrage Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalArbitrageRevenue > 0 ? `₹${(stats.totalArbitrageRevenue / 1000).toFixed(0)}K` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">Energy trading revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* One-Click Plot Generator */}
      {currentDataSourceId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <OneClickPlotButton
              dataSourceId={currentDataSourceId}
              dashboardId="so-dashboard"
              moduleType="so"
              onComplete={() => fetchStats()}
            />
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>SO Quick Info</CardTitle>
                <CardDescription>
                  Generate storage operation charts with 96-block (15-min) intervals for battery energy management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Charts show battery SOC, charging/discharging power</li>
                  <li>• Energy arbitrage analysis and revenue tracking</li>
                  <li>• Round-trip efficiency and cycle depth monitoring</li>
                  <li>• X-axis shows Block 1-96 with 15-minute time intervals</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dynamic Timeblock Charts for Storage Operations */}
      <div className="grid grid-cols-1 gap-6">
        <DynamicTimeblockChart
          dataSourceId={currentDataSourceId || undefined}
          moduleType="so"
          chartType="line"
          title="Battery State of Charge"
          description="96 timeblocks showing battery SOC and energy prices"
          height={450}
          showFilters={!!currentDataSourceId}
        />
        
        <DynamicTimeblockChart
          dataSourceId={currentDataSourceId || undefined}
          moduleType="so"
          chartType="bar"
          title="Charging/Discharging Power"
          description="Charging vs Discharging power by timeblock"
          height={450}
          showFilters={!!currentDataSourceId}
        />

        <DynamicTimeblockChart
          dataSourceId={currentDataSourceId || undefined}
          moduleType="so"
          chartType="line"
          title="Energy Arbitrage Analysis"
          description="Net power and energy price correlation"
          height={450}
          showFilters={!!currentDataSourceId}
        />
      </div>

      {/* SO Data Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Storage Operations Data Upload
          </CardTitle>
          <CardDescription>
            Upload Excel or CSV files with battery storage data (TimePeriod, Timeblock, BatterySOC, ChargingMW, etc.)
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
                  Required columns: TimePeriod, Timeblock, BatterySOC, ChargingMW, DischargingMW
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
                Upload Storage Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>SO Data Requirements</CardTitle>
          <CardDescription>
            Excel/CSV file format requirements for storage operations data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sm mb-2">Required Columns:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 py-0.5 rounded">TimePeriod</code> - Date/time (YYYY-MM-DD HH:MM:SS)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">Timeblock</code> - Integer (1-96 for 15-min intervals)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">BatterySOC</code> - Decimal (0-100 %)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">ChargingMW</code> - Decimal (MW charging power)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">DischargingMW</code> - Decimal (MW discharging power)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Optional Columns:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <code className="bg-muted px-1 py-0.5 rounded">EnergyPrice</code> - Energy market price</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">BatteryType</code> - Battery technology type</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">Efficiency</code> - Round-trip efficiency (%)</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">State</code> - State name</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">PlantName</code> - Storage facility name</li>
                <li>• <code className="bg-muted px-1 py-0.5 rounded">CapacityMWh</code> - Total storage capacity</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-2">Storage Metrics:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Efficiency:</span> Typically 85-95% round-trip
              </div>
              <div>
                <span className="font-medium">Cycle Life:</span> 3,650-7,300 cycles (10-20 years)
              </div>
              <div>
                <span className="font-medium">Response Time:</span> Milliseconds to seconds
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
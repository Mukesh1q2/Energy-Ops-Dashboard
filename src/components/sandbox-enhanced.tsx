"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileSpreadsheet, 
  Database, 
  Globe,
  Zap,
  Upload,
  Plus,
  ArrowRight,
  CheckCircle,
  Loader2,
  Sparkles,
  BarChart3,
  AlertCircle
} from "lucide-react"
import { DataSourceManagerEnhanced } from "./data-source-manager-enhanced"
import { OptimizationControlCard } from "./optimization-control-card"
import { TestScriptUpload } from "@/components/sandbox/test-script-upload"
import { TestScriptLogs } from "@/components/sandbox/test-script-logs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface DataSource {
  id: string
  name: string
  type: 'file' | 'database' | 'api' | 'optimization'
  status: 'connected' | 'disconnected' | 'error'
  recordCount?: number
  lastSync?: Date
}

interface ChartSuggestion {
  chart_type: string
  label: string
  confidence: number
  chart_config: any
}

export function SandboxEnhanced() {
  const [activeSource, setActiveSource] = useState<'upload' | 'database' | 'api' | 'optimization'>('upload')
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [selectedDataSource, setSelectedDataSource] = useState<string>('')
  const [showAutoplotDialog, setShowAutoplotDialog] = useState(false)
  const [chartSuggestions, setChartSuggestions] = useState<ChartSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [autoplotProgress, setAutoplotProgress] = useState(0)
  const [selectedCharts, setSelectedCharts] = useState<Set<number>>(new Set())
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDataSources()
    
    // Listen for upload events from data source manager
    const handleDataUpload = (event: CustomEvent) => {
      const { dataSourceId, fileName, recordCount } = event.detail
      
      // Auto-select the uploaded data source
      setSelectedDataSource(dataSourceId)
      
      // Refresh data sources to include the new one
      fetchDataSources()
      
      // Show success message with chart generation suggestion
      setSuccess(`🎉 File "${fileName}" uploaded successfully with ${recordCount} records! Ready to generate charts.`)
      
      // Clear any previous errors
      setError(null)
    }
    
    window.addEventListener('sandbox:data-uploaded', handleDataUpload as EventListener)
    
    return () => {
      window.removeEventListener('sandbox:data-uploaded', handleDataUpload as EventListener)
    }
  }, [])

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources')
      const result = await response.json()
      if (result.success) {
        setDataSources(result.data.filter((ds: DataSource) => ds.status === 'connected'))
        if (result.data.length > 0 && !selectedDataSource) {
          setSelectedDataSource(result.data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching data sources:', error)
    }
  }

  const handleOneClickPlot = async () => {
    if (!selectedDataSource) {
      setError('Please select a data source first')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Call the new API that generates charts for ALL dashboards (DMO/RMO/SO)
      const response = await fetch('/api/sandbox/generate-all-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_source_id: selectedDataSource })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`🎉 Successfully created ${result.count} charts across DMO/RMO/SO dashboards! Redirecting...`)
        
        // Redirect to DMO dashboard after success
        setTimeout(() => {
          window.location.href = '/dmo'
        }, 2000)
      } else {
        setError(result.error || 'Failed to generate charts for dashboards')
      }
    } catch (err) {
      setError('Network error while generating charts')
      console.error('Error generating charts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSelectedCharts = async () => {
    if (selectedCharts.size === 0) {
      setError('Please select at least one chart')
      return
    }

    setLoading(true)
    let successCount = 0

    try {
      const chartsToAdd = Array.from(selectedCharts).map(idx => chartSuggestions[idx])

      for (const chart of chartsToAdd) {
        try {
          const response = await fetch('/api/dashboard/charts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dashboard_id: 'default',
              data_source_id: selectedDataSource,
              name: chart.label,
              chart_config: chart.chart_config,
              created_by: 'autoplot'
            })
          })

          if (response.ok) {
            successCount++
          }
        } catch (err) {
          console.error('Error adding chart:', err)
        }
      }

      setSuccess(`Successfully added ${successCount} chart(s) to dashboard!`)
      setShowAutoplotDialog(false)
      setSelectedCharts(new Set())
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } catch (err) {
      setError('Failed to add charts to dashboard')
    } finally {
      setLoading(false)
    }
  }

  const toggleChartSelection = (index: number) => {
    const newSelection = new Set(selectedCharts)
    if (newSelection.has(index)) {
      newSelection.delete(index)
    } else {
      newSelection.add(index)
    }
    setSelectedCharts(newSelection)
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileSpreadsheet className="w-6 h-6 text-blue-600" />
      case 'database':
        return <Database className="w-6 h-6 text-green-600" />
      case 'api':
        return <Globe className="w-6 h-6 text-purple-600" />
      case 'optimization':
        return <Zap className="w-6 h-6 text-yellow-600" />
      default:
        return <FileSpreadsheet className="w-6 h-6 text-gray-600" />
    }
  }

  const getSourceDescription = (type: string) => {
    switch (type) {
      case 'file':
        return 'Upload Excel or CSV files for testing and validation'
      case 'database':
        return 'Connect to Azure SQL, PostgreSQL, or MySQL databases'
      case 'api':
        return 'Fetch real-time data from external REST APIs'
      case 'optimization':
        return 'Run DMO, RMO, or SO optimization models'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Alerts */}
      {(success || error) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{error ? "Error" : "Success"}</AlertTitle>
          <AlertDescription>{error || success}</AlertDescription>
        </Alert>
      )}

      {/* Header Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Sandbox
              </CardTitle>
              <CardDescription className="text-base">
                Your workspace to experiment with data sources and generate insights
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {dataSources.length > 0 && (
                <>
                  <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map(source => (
                        <SelectItem key={source.id} value={source.id}>
                          <div className="flex items-center gap-2">
                            {getSourceIcon(source.type)}
                            <span className="font-medium">{source.name}</span>
                            {source.recordCount && (
                              <Badge variant="secondary" className="text-xs">
                                {source.recordCount.toLocaleString()} rows
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleOneClickPlot}
                    disabled={!selectedDataSource || loading}
                    size="lg"
                    className="w-[280px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        One-Click Plot for All Dashboards
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Data Source Options */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Data Source</CardTitle>
          <CardDescription>
            Select how you want to bring data into the sandbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Option 1: Excel Upload */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                activeSource === 'upload' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveSource('upload')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <FileSpreadsheet className="w-12 h-12 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Excel Upload</CardTitle>
                <CardDescription className="text-xs">
                  {getSourceDescription('file')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant={activeSource === 'upload' ? 'default' : 'outline'}>
                  Local Testing
                </Badge>
              </CardContent>
            </Card>

            {/* Option 2: Database Connection */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                activeSource === 'database' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveSource('database')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Database className="w-12 h-12 text-green-600" />
                </div>
                <CardTitle className="text-lg">Database</CardTitle>
                <CardDescription className="text-xs">
                  {getSourceDescription('database')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant={activeSource === 'database' ? 'default' : 'outline'}>
                  Azure Production
                </Badge>
              </CardContent>
            </Card>

            {/* Option 3: API Endpoints */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                activeSource === 'api' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveSource('api')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Globe className="w-12 h-12 text-purple-600" />
                </div>
                <CardTitle className="text-lg">API Endpoints</CardTitle>
                <CardDescription className="text-xs">
                  {getSourceDescription('api')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant={activeSource === 'api' ? 'default' : 'outline'}>
                  Real-time Data
                </Badge>
              </CardContent>
            </Card>

            {/* Option 4: Optimization Models */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                activeSource === 'optimization' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveSource('optimization')}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Zap className="w-12 h-12 text-yellow-600" />
                </div>
                <CardTitle className="text-lg">Optimization</CardTitle>
                <CardDescription className="text-xs">
                  {getSourceDescription('optimization')}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Badge variant={activeSource === 'optimization' ? 'default' : 'outline'}>
                  DMO/RMO/SO
                </Badge>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {activeSource === 'upload' && <><Upload className="w-5 h-5" /> Upload & Manage Files</>}
            {activeSource === 'database' && <><Database className="w-5 h-5" /> Database Connections</>}
            {activeSource === 'api' && <><Globe className="w-5 h-5" /> API Endpoints</>}
            {activeSource === 'optimization' && <><Zap className="w-5 h-5" /> Optimization Models</>}
          </CardTitle>
          <CardDescription>
            {activeSource === 'upload' && 'Upload Excel/CSV files for local testing and validation'}
            {activeSource === 'database' && 'Configure connections to Azure SQL, PostgreSQL, or MySQL'}
            {activeSource === 'api' && 'Set up REST API endpoints for real-time data ingestion'}
            {activeSource === 'optimization' && 'Configure and run DMO, RMO, or SO optimization models'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSource === 'optimization' ? (
            <div className="space-y-6">
              <OptimizationControlCard dataSourceId={selectedDataSource} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TestScriptUpload />
                <TestScriptLogs />
              </div>
            </div>
          ) : (
            <DataSourceManagerEnhanced />
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {dataSources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Data Sources</CardDescription>
              <CardTitle className="text-3xl">{dataSources.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Excel Files</CardDescription>
              <CardTitle className="text-3xl">
                {dataSources.filter(ds => ds.type === 'file').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Databases</CardDescription>
              <CardTitle className="text-3xl">
                {dataSources.filter(ds => ds.type === 'database').length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>API Endpoints</CardDescription>
              <CardTitle className="text-3xl">
                {dataSources.filter(ds => ds.type === 'api').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Autoplot Dialog */}
      <Dialog open={showAutoplotDialog} onOpenChange={setShowAutoplotDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              One-Click Plot - Chart Suggestions
            </DialogTitle>
            <DialogDescription>
              AI-generated chart recommendations based on your data structure
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4 py-8">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Analyzing your data...</p>
                <p className="text-sm text-muted-foreground">Generating intelligent chart suggestions</p>
              </div>
              <Progress value={autoplotProgress} className="w-full" />
            </div>
          ) : (
            <>
              {chartSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No suggestions available</p>
                  <p className="text-sm text-muted-foreground">
                    Try uploading a data source with numeric and date columns
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {chartSuggestions.length} chart suggestions found
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedCharts.size === chartSuggestions.length) {
                          setSelectedCharts(new Set())
                        } else {
                          setSelectedCharts(new Set(chartSuggestions.map((_, idx) => idx)))
                        }
                      }}
                    >
                      {selectedCharts.size === chartSuggestions.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {chartSuggestions.map((suggestion, index) => (
                      <Card
                        key={index}
                        className={`cursor-pointer transition-all ${
                          selectedCharts.has(index) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleChartSelection(index)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-5 h-5 text-primary" />
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.chart_type}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <CardTitle className="text-base">{suggestion.label}</CardTitle>
                            </div>
                            {selectedCharts.has(index) && (
                              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs text-muted-foreground space-y-1">
                            {suggestion.chart_config.x && (
                              <p>X-Axis: <span className="font-medium">{suggestion.chart_config.x}</span></p>
                            )}
                            {suggestion.chart_config.y && (
                              <p>Y-Axis: <span className="font-medium">{suggestion.chart_config.y}</span></p>
                            )}
                            {suggestion.chart_config.group_by && (
                              <p>Group By: <span className="font-medium">{suggestion.chart_config.group_by}</span></p>
                            )}
                            {suggestion.chart_config.agg && (
                              <p>Aggregation: <span className="font-medium">{suggestion.chart_config.agg}</span></p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutoplotDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelectedCharts}
              disabled={selectedCharts.size === 0 || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add {selectedCharts.size > 0 && `${selectedCharts.size} `}
              Chart{selectedCharts.size !== 1 ? 's' : ''} to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

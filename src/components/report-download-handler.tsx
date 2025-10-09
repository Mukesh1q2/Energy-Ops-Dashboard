"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, FileText, File, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { OptimizationReportGenerator } from "./optimization-report-generator"

interface ReportDownloadOptions {
  reportType: 'optimization' | 'performance' | 'comparison'
  format: 'pdf' | 'excel' | 'both'
  models: string[]
  timeRange: '24h' | '7d' | '30d' | 'custom'
  startDate?: string
  endDate?: string
  includeCharts: boolean
  includeRawData: boolean
  includeAnalytics: boolean
}

interface DownloadProgress {
  status: 'idle' | 'generating' | 'success' | 'error'
  message: string
  progress: number
}

export function ReportDownloadHandler() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    status: 'idle',
    message: '',
    progress: 0
  })

  const [options, setOptions] = useState<ReportDownloadOptions>({
    reportType: 'optimization',
    format: 'pdf',
    models: ['DMO', 'RMO', 'SO'],
    timeRange: '24h',
    includeCharts: true,
    includeRawData: false,
    includeAnalytics: true
  })

  const handleModelToggle = (model: string) => {
    setOptions(prev => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model]
    }))
  }

  const handleDownload = async () => {
    if (options.models.length === 0) {
      toast.error('Please select at least one model')
      return
    }

    setDownloadProgress({
      status: 'generating',
      message: 'Preparing report...',
      progress: 10
    })

    try {
      // Fetch report data
      setDownloadProgress({
        status: 'generating',
        message: 'Fetching data...',
        progress: 30
      })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        throw new Error('Failed to fetch report data')
      }

      const reportData = await response.json()

      // Generate report based on format
      setDownloadProgress({
        status: 'generating',
        message: 'Generating report...',
        progress: 60
      })

      if (options.format === 'pdf' || options.format === 'both') {
        await generatePDFReport(reportData, options)
      }

      if (options.format === 'excel' || options.format === 'both') {
        await generateExcelReport(reportData, options)
      }

      setDownloadProgress({
        status: 'success',
        message: 'Report downloaded successfully!',
        progress: 100
      })

      toast.success('Report downloaded successfully')

      // Reset after 2 seconds
      setTimeout(() => {
        setDownloadProgress({
          status: 'idle',
          message: '',
          progress: 0
        })
        setIsDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      console.error('Error generating report:', error)
      setDownloadProgress({
        status: 'error',
        message: error.message || 'Failed to generate report',
        progress: 0
      })
      toast.error(error.message || 'Failed to generate report')
    }
  }

  const generatePDFReport = async (data: any, options: ReportDownloadOptions) => {
    // Use the OptimizationReportGenerator for PDF
    const { generatePDF } = OptimizationReportGenerator
    
    const mockOptimizationData = {
      jobInfo: {
        jobId: 'report-' + Date.now(),
        modelType: options.models.join(', '),
        timestamp: new Date().toISOString(),
        duration: '45.3s',
        status: 'completed'
      },
      kpis: data.kpis || {
        costSavings: 125000,
        efficiency: 94.5,
        peakShaving: 18.5,
        gridDependenceReduction: 22.3
      },
      executionLogs: data.logs || [],
      keyDecisions: data.decisions || []
    }

    const pdfBlob = await generatePDF(mockOptimizationData)
    
    // Trigger download
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateExcelReport = async (data: any, options: ReportDownloadOptions) => {
    // Use the OptimizationReportGenerator for Excel
    const { generateExcel } = OptimizationReportGenerator
    
    const mockOptimizationData = {
      jobInfo: {
        jobId: 'report-' + Date.now(),
        modelType: options.models.join(', '),
        timestamp: new Date().toISOString(),
        duration: '45.3s',
        status: 'completed'
      },
      kpis: data.kpis || {
        costSavings: 125000,
        efficiency: 94.5,
        peakShaving: 18.5,
        gridDependenceReduction: 22.3
      },
      executionLogs: data.logs || [],
      keyDecisions: data.decisions || []
    }

    const excelBlob = await generateExcel(mockOptimizationData)
    
    // Trigger download
    const url = URL.createObjectURL(excelBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${options.reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const quickDownloadPDF = async (runId: string) => {
    try {
      toast.info('Generating PDF report...')
      
      const response = await fetch(`/api/optimization/runs/${runId}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Failed to fetch run data')
      }
      
      await generatePDFReport(result.data, {
        reportType: 'optimization',
        format: 'pdf',
        models: [result.data.model_type],
        timeRange: '24h',
        includeCharts: true,
        includeRawData: false,
        includeAnalytics: true
      })
      
      toast.success('PDF report downloaded')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to download report')
    }
  }

  const quickDownloadExcel = async (runId: string) => {
    try {
      toast.info('Generating Excel report...')
      
      const response = await fetch(`/api/optimization/runs/${runId}`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Failed to fetch run data')
      }
      
      await generateExcelReport(result.data, {
        reportType: 'optimization',
        format: 'excel',
        models: [result.data.model_type],
        timeRange: '24h',
        includeCharts: true,
        includeRawData: true,
        includeAnalytics: true
      })
      
      toast.success('Excel report downloaded')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Failed to download report')
    }
  }

  return (
    <>
      {/* Custom Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Download Report</DialogTitle>
            <DialogDescription>
              Configure and download custom optimization reports
            </DialogDescription>
          </DialogHeader>

          {downloadProgress.status === 'idle' ? (
            <div className="space-y-4 py-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select 
                  value={options.reportType} 
                  onValueChange={(val: any) => setOptions({ ...options, reportType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="optimization">Optimization Run Report</SelectItem>
                    <SelectItem value="performance">Performance Dashboard</SelectItem>
                    <SelectItem value="comparison">Run Comparison Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select 
                  value={options.format} 
                  onValueChange={(val: any) => setOptions({ ...options, format: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Only</SelectItem>
                    <SelectItem value="excel">Excel Only</SelectItem>
                    <SelectItem value="both">Both PDF & Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Models */}
              <div className="space-y-2">
                <Label>Include Models</Label>
                <div className="flex gap-4">
                  {['DMO', 'RMO', 'SO'].map(model => (
                    <div key={model} className="flex items-center space-x-2">
                      <Checkbox
                        id={`model-${model}`}
                        checked={options.models.includes(model)}
                        onCheckedChange={() => handleModelToggle(model)}
                      />
                      <Label htmlFor={`model-${model}`} className="cursor-pointer">{model}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select 
                  value={options.timeRange} 
                  onValueChange={(val: any) => setOptions({ ...options, timeRange: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {options.timeRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={options.startDate || ''}
                      onChange={(e) => setOptions({ ...options, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={options.endDate || ''}
                      onChange={(e) => setOptions({ ...options, endDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Include Options */}
              <div className="space-y-3">
                <Label>Include in Report</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-charts"
                      checked={options.includeCharts}
                      onCheckedChange={(checked) => setOptions({ ...options, includeCharts: checked as boolean })}
                    />
                    <Label htmlFor="include-charts" className="cursor-pointer">Charts and Visualizations</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-raw"
                      checked={options.includeRawData}
                      onCheckedChange={(checked) => setOptions({ ...options, includeRawData: checked as boolean })}
                    />
                    <Label htmlFor="include-raw" className="cursor-pointer">Raw Data Tables</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-analytics"
                      checked={options.includeAnalytics}
                      onCheckedChange={(checked) => setOptions({ ...options, includeAnalytics: checked as boolean })}
                    />
                    <Label htmlFor="include-analytics" className="cursor-pointer">Analytics and Insights</Label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <div className="flex flex-col items-center gap-4">
                {downloadProgress.status === 'generating' && (
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                )}
                {downloadProgress.status === 'success' && (
                  <CheckCircle className="w-12 h-12 text-green-500" />
                )}
                {downloadProgress.status === 'error' && (
                  <AlertCircle className="w-12 h-12 text-red-500" />
                )}
                
                <div className="text-center">
                  <p className="font-medium">{downloadProgress.message}</p>
                  {downloadProgress.status === 'generating' && (
                    <div className="w-full max-w-xs mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress.progress}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{downloadProgress.progress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {downloadProgress.status === 'idle' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Generate & Download
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Download Buttons (can be used elsewhere) */}
      <div className="hidden">
        <Button variant="ghost" size="sm" onClick={() => quickDownloadPDF('run-001')}>
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </Button>
        <Button variant="ghost" size="sm" onClick={() => quickDownloadExcel('run-001')}>
          <File className="w-4 h-4 mr-2" />
          Excel
        </Button>
      </div>
    </>
  )
}

// Export individual functions for use in other components
export const ReportDownloadUtils = {
  downloadPDF: async (runId: string) => {
    // Implementation here
  },
  downloadExcel: async (runId: string) => {
    // Implementation here
  },
  downloadBoth: async (runId: string) => {
    // Implementation here
  }
}

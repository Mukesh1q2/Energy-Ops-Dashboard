"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Send, 
  Settings, 
  BarChart3,
  PieChart,
  TrendingUp,
  Mail,
  Database,
  RefreshCw,
  Eye,
  Share2,
  Filter
} from "lucide-react"

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'dashboard' | 'analytical' | 'operational' | 'executive'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  schedule: 'immediate' | 'daily' | 'weekly' | 'monthly' | 'quarterly'
  lastGenerated?: Date
  nextScheduled?: Date
  status: 'active' | 'draft' | 'archived'
}

interface ScheduledReport {
  id: string
  templateId: string
  name: string
  recipients: string[]
  schedule: string
  format: string
  lastSent?: Date
  nextSend: Date
  status: 'active' | 'paused' | 'failed'
}

interface ReportHistory {
  id: string
  reportName: string
  generatedAt: Date
  format: string
  size: number
  generatedBy: string
  status: 'completed' | 'failed' | 'processing'
}

export function ReportingSystem() {
  const [activeTab, setActiveTab] = useState('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [reportFormat, setReportFormat] = useState<string>('pdf')
  const [dateRange, setDateRange] = useState<string>('last-30-days')

  // Mock data
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'exec-summary',
      name: 'Executive Summary',
      description: 'High-level overview for executive stakeholders',
      type: 'executive',
      format: 'pdf',
      schedule: 'weekly',
      lastGenerated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextScheduled: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'market-analysis',
      name: 'Market Analysis Report',
      description: 'Detailed market trends and analysis',
      type: 'analytical',
      format: 'pdf',
      schedule: 'monthly',
      lastGenerated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextScheduled: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'operations-daily',
      name: 'Daily Operations Report',
      description: 'Daily operational metrics and performance',
      type: 'operational',
      format: 'excel',
      schedule: 'daily',
      lastGenerated: new Date(Date.now() - 24 * 60 * 60 * 1000),
      nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'dashboard-snapshot',
      name: 'Dashboard Snapshot',
      description: 'Current dashboard state and KPIs',
      type: 'dashboard',
      format: 'pdf',
      schedule: 'immediate',
      status: 'draft'
    }
  ]

  const scheduledReports: ScheduledReport[] = [
    {
      id: 'sched-1',
      templateId: 'exec-summary',
      name: 'Weekly Executive Summary',
      recipients: ['ceo@company.com', 'cfo@company.com', 'board@company.com'],
      schedule: 'weekly',
      format: 'pdf',
      lastSent: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      nextSend: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: 'sched-2',
      templateId: 'market-analysis',
      name: 'Monthly Market Analysis',
      recipients: ['analysts@company.com', 'trading@company.com'],
      schedule: 'monthly',
      format: 'pdf',
      lastSent: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextSend: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    }
  ]

  const reportHistory: ReportHistory[] = [
    {
      id: 'hist-1',
      reportName: 'Executive Summary',
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      format: 'PDF',
      size: 2048000,
      generatedBy: 'System',
      status: 'completed'
    },
    {
      id: 'hist-2',
      reportName: 'Market Analysis Report',
      generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      format: 'Excel',
      size: 1024000,
      generatedBy: 'John Doe',
      status: 'completed'
    },
    {
      id: 'hist-3',
      reportName: 'Daily Operations',
      generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      format: 'CSV',
      size: 512000,
      generatedBy: 'System',
      status: 'completed'
    }
  ]

  const handleGenerateReport = () => {
    if (!selectedTemplate) return
    
    // Simulate report generation
    console.log(`Generating ${selectedTemplate} report in ${reportFormat} format for ${dateRange}`)
  }

  const handleScheduleReport = () => {
    console.log('Scheduling report with current settings')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Reporting & Analytics
          </CardTitle>
          <CardDescription>
            Generate, schedule, and manage reports with automated delivery
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    {getStatusBadge(template.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{template.type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="font-medium">{template.format.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Schedule:</span>
                      <span className="font-medium">{template.schedule}</span>
                    </div>
                    {template.lastGenerated && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Generated:</span>
                        <span className="font-medium">{template.lastGenerated.toLocaleDateString()}</span>
                      </div>
                    )}
                    {template.nextScheduled && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Next Scheduled:</span>
                        <span className="font-medium">{template.nextScheduled.toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>Configure and generate custom reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Template</label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Report Format</label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-4">
                  <Button onClick={handleGenerateReport} className="w-full" disabled={!selectedTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button onClick={handleScheduleReport} variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Report Templates</CardTitle>
                  <CardDescription>Generate commonly used reports instantly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col">
                      <BarChart3 className="w-6 h-6 mb-2" />
                      Dashboard Summary
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <PieChart className="w-6 h-6 mb-2" />
                      Market Analysis
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <TrendingUp className="w-6 h-6 mb-2" />
                      Performance Report
                    </Button>
                    <Button variant="outline" className="h-20 flex-col">
                      <Database className="w-6 h-6 mb-2" />
                      Data Export
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Report Activity</CardTitle>
                  <CardDescription>Latest report generation and delivery status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportHistory.slice(0, 3).map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(report.status)}
                          <div>
                            <p className="font-medium">{report.reportName}</p>
                            <p className="text-sm text-muted-foreground">
                              {report.generatedAt.toLocaleDateString()} • {report.generatedBy}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.format}</Badge>
                          <span className="text-sm text-muted-foreground">{formatFileSize(report.size)}</span>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Manage automated report delivery and scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{report.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {report.schedule} • {report.format.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.status)}
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Recipients:</span>
                        <p className="font-medium">{report.recipients.length} recipients</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Sent:</span>
                        <p className="font-medium">
                          {report.lastSent ? report.lastSent.toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Send:</span>
                        <p className="font-medium">{report.nextSend.toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>View and download previously generated reports</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportHistory.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-4">
                      {getStatusBadge(report.status)}
                      <div>
                        <p className="font-medium">{report.reportName}</p>
                        <p className="text-sm text-muted-foreground">
                          Generated by {report.generatedBy} • {report.generatedAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{report.format}</Badge>
                      <span className="text-sm text-muted-foreground">{formatFileSize(report.size)}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
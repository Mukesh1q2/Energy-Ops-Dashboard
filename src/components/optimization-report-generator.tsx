"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, File, Loader2, Check } from "lucide-react"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import ExcelJS from "exceljs"

interface OptimizationReport {
  job_id: string
  model_type: string
  status: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  logs?: any[]
  input_summary?: any
  output_summary?: any
  key_decisions?: string[]
  metrics?: {
    total_capacity?: number
    optimized_dispatch?: number
    cost_savings?: number
    efficiency?: number
  }
}

interface ReportGeneratorProps {
  reportData: OptimizationReport
  onClose?: () => void
}

export function OptimizationReportGenerator({ reportData, onClose }: ReportGeneratorProps) {
  const [generating, setGenerating] = useState<'pdf' | 'excel' | null>(null)
  const [success, setSuccess] = useState<'pdf' | 'excel' | null>(null)

  const generatePDFReport = async () => {
    setGenerating('pdf')
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPosition = 20

      // Header
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageWidth, 40, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('OptiBid Optimization Report', pageWidth / 2, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`${reportData.model_type} - Job ID: ${reportData.job_id}`, pageWidth / 2, 30, { align: 'center' })

      yPosition = 50
      doc.setTextColor(0, 0, 0)

      // Report Information
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Report Information', 14, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      const infoData = [
        ['Model Type', reportData.model_type],
        ['Job ID', reportData.job_id],
        ['Status', reportData.status.toUpperCase()],
        ['Started At', new Date(reportData.started_at).toLocaleString()],
        ['Completed At', reportData.completed_at ? new Date(reportData.completed_at).toLocaleString() : 'In Progress'],
        ['Duration', reportData.duration_ms ? `${(reportData.duration_ms / 1000).toFixed(2)}s` : 'N/A']
      ]

      autoTable(doc, {
        startY: yPosition,
        head: [['Parameter', 'Value']],
        body: infoData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14, right: 14 }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 15

      // Key Metrics
      if (reportData.metrics) {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Key Performance Metrics', 14, yPosition)
        yPosition += 10

        const metricsData = [
          ['Total Capacity', `${reportData.metrics.total_capacity?.toLocaleString() || 'N/A'} MW`],
          ['Optimized Dispatch', `${reportData.metrics.optimized_dispatch?.toLocaleString() || 'N/A'} MW`],
          ['Cost Savings', `₹${reportData.metrics.cost_savings?.toLocaleString() || 'N/A'}`],
          ['Efficiency', `${reportData.metrics.efficiency?.toFixed(2) || 'N/A'}%`]
        ]

        autoTable(doc, {
          startY: yPosition,
          head: [['Metric', 'Value']],
          body: metricsData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 14, right: 14 }
        })

        yPosition = (doc as any).lastAutoTable.finalY + 15
      }

      // Key Decisions
      if (reportData.key_decisions && reportData.key_decisions.length > 0) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Key Decisions & Allocations', 14, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        reportData.key_decisions.forEach((decision, index) => {
          if (yPosition > 280) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(`${index + 1}. ${decision}`, 14, yPosition)
          yPosition += 7
        })

        yPosition += 10
      }

      // Execution Logs Summary
      if (reportData.logs && reportData.logs.length > 0) {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Execution Logs (Last 10)', 14, yPosition)
        yPosition += 10

        const logsData = reportData.logs.slice(-10).map(log => [
          new Date(log.timestamp).toLocaleTimeString(),
          log.level,
          log.message.substring(0, 60) + (log.message.length > 60 ? '...' : '')
        ])

        autoTable(doc, {
          startY: yPosition,
          head: [['Time', 'Level', 'Message']],
          body: logsData,
          theme: 'plain',
          headStyles: { fillColor: [249, 115, 22] },
          margin: { left: 14, right: 14 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 20 },
            2: { cellWidth: 'auto' }
          }
        })
      }

      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()} | OptiBid Command Center`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
        doc.text(
          'Developed by Piyush Thukral',
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: 'center' }
        )
      }

      // Save PDF
      const fileName = `OptiBid_${reportData.model_type}_Report_${reportData.job_id}_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)

      setSuccess('pdf')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error generating PDF report:', error)
      alert('Failed to generate PDF report')
    } finally {
      setGenerating(null)
    }
  }

  const generateExcelReport = async () => {
    setGenerating('excel')
    try {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Piyush Thukral'
      workbook.created = new Date()
      workbook.modified = new Date()

      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary', {
        properties: { tabColor: { argb: '2563EB' } }
      })

      // Header
      summarySheet.mergeCells('A1:D1')
      const titleCell = summarySheet.getCell('A1')
      titleCell.value = 'OptiBid Optimization Report'
      titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      summarySheet.getRow(1).height = 30

      // Report Info
      summarySheet.addRow([])
      summarySheet.addRow(['Report Information'])
      summarySheet.getCell('A3').font = { bold: true, size: 14 }
      
      summarySheet.addRow(['Model Type', reportData.model_type])
      summarySheet.addRow(['Job ID', reportData.job_id])
      summarySheet.addRow(['Status', reportData.status.toUpperCase()])
      summarySheet.addRow(['Started At', new Date(reportData.started_at).toLocaleString()])
      summarySheet.addRow(['Completed At', reportData.completed_at ? new Date(reportData.completed_at).toLocaleString() : 'In Progress'])
      summarySheet.addRow(['Duration', reportData.duration_ms ? `${(reportData.duration_ms / 1000).toFixed(2)}s` : 'N/A'])

      // Metrics
      if (reportData.metrics) {
        summarySheet.addRow([])
        summarySheet.addRow(['Key Performance Metrics'])
        summarySheet.getCell('A10').font = { bold: true, size: 14 }
        
        summarySheet.addRow(['Total Capacity', `${reportData.metrics.total_capacity?.toLocaleString() || 'N/A'} MW`])
        summarySheet.addRow(['Optimized Dispatch', `${reportData.metrics.optimized_dispatch?.toLocaleString() || 'N/A'} MW`])
        summarySheet.addRow(['Cost Savings', `₹${reportData.metrics.cost_savings?.toLocaleString() || 'N/A'}`])
        summarySheet.addRow(['Efficiency', `${reportData.metrics.efficiency?.toFixed(2) || 'N/A'}%`])
      }

      // Auto-fit columns
      summarySheet.columns = [
        { key: 'A', width: 25 },
        { key: 'B', width: 40 },
        { key: 'C', width: 20 },
        { key: 'D', width: 20 }
      ]

      // Key Decisions Sheet
      if (reportData.key_decisions && reportData.key_decisions.length > 0) {
        const decisionsSheet = workbook.addWorksheet('Key Decisions', {
          properties: { tabColor: { argb: '10B981' } }
        })

        decisionsSheet.columns = [
          { header: '#', key: 'index', width: 10 },
          { header: 'Decision / Allocation', key: 'decision', width: 80 }
        ]

        // Style header
        decisionsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
        decisionsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }

        reportData.key_decisions.forEach((decision, index) => {
          decisionsSheet.addRow({ index: index + 1, decision })
        })
      }

      // Logs Sheet
      if (reportData.logs && reportData.logs.length > 0) {
        const logsSheet = workbook.addWorksheet('Execution Logs', {
          properties: { tabColor: { argb: 'F59E0B' } }
        })

        logsSheet.columns = [
          { header: 'Timestamp', key: 'timestamp', width: 20 },
          { header: 'Level', key: 'level', width: 12 },
          { header: 'Message', key: 'message', width: 80 }
        ]

        // Style header
        logsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } }
        logsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F59E0B' } }

        reportData.logs.forEach(log => {
          const row = logsSheet.addRow({
            timestamp: new Date(log.timestamp).toLocaleString(),
            level: log.level,
            message: log.message
          })

          // Color code by log level
          if (log.level === 'ERROR') {
            row.getCell('level').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } }
          } else if (log.level === 'WARNING') {
            row.getCell('level').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } }
          } else if (log.level === 'INFO') {
            row.getCell('level').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }
          }
        })
      }

      // Save Excel
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `OptiBid_${reportData.model_type}_Report_${reportData.job_id}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess('excel')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error generating Excel report:', error)
      alert('Failed to generate Excel report')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Report Generation
        </CardTitle>
        <CardDescription>
          Download detailed optimization report in PDF or Excel format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF Report */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-950 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">PDF Report</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Professional formatted report with charts and summary
                  </p>
                </div>
                <Button 
                  onClick={generatePDFReport}
                  disabled={generating !== null}
                  className="w-full"
                  variant={success === 'pdf' ? 'outline' : 'default'}
                >
                  {generating === 'pdf' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : success === 'pdf' ? (
                    <><Check className="w-4 h-4 mr-2" /> Downloaded</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Download PDF</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Excel Report */}
          <Card className="border-2 hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                  <File className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Excel Report</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Detailed data with multiple sheets and formatting
                  </p>
                </div>
                <Button 
                  onClick={generateExcelReport}
                  disabled={generating !== null}
                  className="w-full"
                  variant={success === 'excel' ? 'outline' : 'default'}
                >
                  {generating === 'excel' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : success === 'excel' ? (
                    <><Check className="w-4 h-4 mr-2" /> Downloaded</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Download Excel</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Summary */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Report Contents:</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">✓</Badge>
                <span>Job information and execution timeline</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">✓</Badge>
                <span>Key performance metrics and statistics</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">✓</Badge>
                <span>Optimization decisions and allocations</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">✓</Badge>
                <span>Detailed execution logs and events</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="outline" className="w-6 h-6 p-0 justify-center">✓</Badge>
                <span>Input/output data summary</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Download, FileSpreadsheet, FileText, FileJson, CheckCircle } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DataSource {
  id: string
  name: string
  type: string
  record_count?: number
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [dataSourceId, setDataSourceId] = useState("")
  const [exportFormat, setExportFormat] = useState("csv")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [limit, setLimit] = useState("all")

  useEffect(() => {
    if (open) {
      fetchDataSources()
    }
  }, [open])

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/data-sources')
      const result = await response.json()
      if (result.success) {
        setDataSources(result.data.filter((ds: DataSource) => ds.type === 'file' || ds.type === 'database'))
      }
    } catch (err) {
      console.error('Error fetching data sources:', err)
    }
  }

  const handleExport = async () => {
    if (!dataSourceId) {
      setError("Please select a data source")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        data_source_id: dataSourceId,
        format: exportFormat,
        include_headers: includeHeaders.toString(),
        limit: limit
      })

      const response = await fetch(`/api/export/data?${params}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `export.${exportFormat}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/)
        if (match) {
          filename = match[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        resetForm()
      }, 2000)
    } catch (err) {
      setError('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setDataSourceId("")
    setExportFormat("csv")
    setIncludeHeaders(true)
    setLimit("all")
    setError(null)
    setSuccess(false)
  }

  const exportFormats = [
    { value: "csv", label: "CSV", icon: FileText, description: "Comma-separated values" },
    { value: "excel", label: "Excel", icon: FileSpreadsheet, description: "Microsoft Excel (.xlsx)" },
    { value: "json", label: "JSON", icon: FileJson, description: "JavaScript Object Notation" },
  ]

  const limitOptions = [
    { value: "all", label: "All records" },
    { value: "100", label: "First 100 records" },
    { value: "1000", label: "First 1,000 records" },
    { value: "10000", label: "First 10,000 records" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Download your data in multiple formats
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Export Started!</h3>
            <p className="text-sm text-muted-foreground">Your download should begin shortly...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="export-data-source">Data Source *</Label>
              <Select value={dataSourceId} onValueChange={setDataSourceId}>
                <SelectTrigger id="export-data-source" className="mt-1">
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSources.map((ds) => (
                    <SelectItem key={ds.id} value={ds.id}>
                      {ds.name} ({ds.record_count?.toLocaleString() || 0} records)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Export Format *</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {exportFormats.map((format) => {
                  const Icon = format.icon
                  return (
                    <Button
                      key={format.value}
                      type="button"
                      variant={exportFormat === format.value ? "default" : "outline"}
                      className="flex-col h-auto p-4"
                      onClick={() => setExportFormat(format.value)}
                    >
                      <Icon className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{format.label}</span>
                      <span className="text-xs text-muted-foreground mt-1">{format.description}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="export-limit">Record Limit</Label>
              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger id="export-limit" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {limitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={includeHeaders}
                onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
              />
              <Label htmlFor="include-headers" className="cursor-pointer">
                Include column headers
              </Label>
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={loading || !dataSourceId}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

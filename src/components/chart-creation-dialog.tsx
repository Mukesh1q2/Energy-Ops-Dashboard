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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, BarChart3, LineChart, PieChart, AreaChart, ScatterChart, CheckCircle } from "lucide-react"

interface ChartCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DataSource {
  id: string
  name: string
  type: string
  record_count?: number
}

interface Column {
  id: string
  column_name: string
  normalized_name: string
  data_type: string
  label: string
}

export function ChartCreationDialog({ open, onOpenChange }: ChartCreationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [chartName, setChartName] = useState("")
  const [dataSourceId, setDataSourceId] = useState("")
  const [chartType, setChartType] = useState("line")
  const [xAxis, setXAxis] = useState("")
  const [yAxis, setYAxis] = useState("")
  const [groupBy, setGroupBy] = useState("")

  useEffect(() => {
    if (open) {
      fetchDataSources()
    }
  }, [open])

  useEffect(() => {
    if (dataSourceId) {
      fetchColumns(dataSourceId)
    }
  }, [dataSourceId])

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

  const fetchColumns = async (dataSourceId: string) => {
    try {
      const response = await fetch(`/api/data-sources/${dataSourceId}/columns`)
      const result = await response.json()
      if (result.success) {
        setColumns(result.data)
      }
    } catch (err) {
      console.error('Error fetching columns:', err)
    }
  }

  const handleCreateChart = async () => {
    if (!chartName || !dataSourceId || !chartType || !xAxis || !yAxis) {
      setError("Please fill in all required fields")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const chartConfig = {
        type: chartType,
        x_axis: xAxis,
        y_axis: yAxis,
        group_by: groupBy || null,
        colors: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"],
        show_legend: true,
        show_grid: true,
      }

      const response = await fetch('/api/dashboard/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashboard_id: 'default',
          data_source_id: dataSourceId,
          name: chartName,
          chart_config: chartConfig,
          created_by: 'user'
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          resetForm()
          window.location.reload() // Refresh to show new chart
        }, 1500)
      } else {
        setError(result.error || 'Failed to create chart')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setChartName("")
    setDataSourceId("")
    setChartType("line")
    setXAxis("")
    setYAxis("")
    setGroupBy("")
    setError(null)
    setSuccess(false)
  }

  const chartTypes = [
    { value: "line", label: "Line Chart", icon: LineChart },
    { value: "bar", label: "Bar Chart", icon: BarChart3 },
    { value: "area", label: "Area Chart", icon: AreaChart },
    { value: "pie", label: "Pie Chart", icon: PieChart },
    { value: "scatter", label: "Scatter Plot", icon: ScatterChart },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Chart</DialogTitle>
          <DialogDescription>
            Build a custom visualization from your data sources
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chart Created Successfully!</h3>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="chart-name">Chart Name *</Label>
              <Input
                id="chart-name"
                placeholder="e.g., Monthly Price Trends"
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="data-source">Data Source *</Label>
              <Select value={dataSourceId} onValueChange={setDataSourceId}>
                <SelectTrigger id="data-source" className="mt-1">
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
              <Label>Chart Type *</Label>
              <div className="grid grid-cols-5 gap-2 mt-1">
                {chartTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant={chartType === type.value ? "default" : "outline"}
                      className="flex-col h-auto p-3"
                      onClick={() => setChartType(type.value)}
                    >
                      <Icon className="w-6 h-6 mb-1" />
                      <span className="text-xs">{type.label.split(' ')[0]}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {columns.length > 0 && (
              <>
                <div>
                  <Label htmlFor="x-axis">X-Axis (Horizontal) *</Label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger id="x-axis" className="mt-1">
                      <SelectValue placeholder="Select X-axis column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
                        <SelectItem key={col.id} value={col.normalized_name}>
                          {col.label} ({col.data_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="y-axis">Y-Axis (Vertical) *</Label>
                  <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger id="y-axis" className="mt-1">
                      <SelectValue placeholder="Select Y-axis column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.filter(col => col.data_type === 'integer' || col.data_type === 'float').map((col) => (
                        <SelectItem key={col.id} value={col.normalized_name}>
                          {col.label} ({col.data_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="group-by">Group By (Optional)</Label>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger id="group-by" className="mt-1">
                      <SelectValue placeholder="No grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No grouping</SelectItem>
                      {columns.filter(col => col.data_type === 'category' || col.data_type === 'string').map((col) => (
                        <SelectItem key={col.id} value={col.normalized_name}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreateChart} disabled={loading || !chartName || !dataSourceId || !xAxis || !yAxis}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Chart
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

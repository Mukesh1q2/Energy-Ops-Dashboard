"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/contexts/toast-context"
import {
  batchExportAsZip,
  estimateZipSize,
  formatFileSize,
  type ExportDataset
} from "@/lib/batch-export-utils"
import { formatNumber, formatDateTime } from "@/lib/export-utils"
import {
  Package,
  Download,
  FileArchive,
  CheckCircle2,
  Loader2,
  Info
} from "lucide-react"

interface BatchExportDialogProps {
  trigger?: React.ReactNode
  availableDatasets: {
    id: string
    name: string
    description: string
    recordCount: number
    dataProvider: () => Promise<ExportDataset> | ExportDataset
  }[]
}

export function BatchExportDialog({
  trigger,
  availableDatasets
}: BatchExportDialogProps) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [selectedDatasets, setSelectedDatasets] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const toggleDataset = (id: string) => {
    const newSelection = new Set(selectedDatasets)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedDatasets(newSelection)
  }

  const selectAll = () => {
    setSelectedDatasets(new Set(availableDatasets.map(ds => ds.id)))
  }

  const deselectAll = () => {
    setSelectedDatasets(new Set())
  }

  const totalRecords = availableDatasets
    .filter(ds => selectedDatasets.has(ds.id))
    .reduce((sum, ds) => sum + ds.recordCount, 0)

  const handleExport = async () => {
    if (selectedDatasets.size === 0) {
      toast.warning("No datasets selected", "Please select at least one dataset to export")
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Gather selected datasets
      const datasetsToExport: ExportDataset[] = []
      const selectedItems = availableDatasets.filter(ds => selectedDatasets.has(ds.id))
      
      // Load data for each selected dataset
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i]
        setExportProgress(((i + 0.5) / selectedItems.length) * 90) // Up to 90%
        
        try {
          const dataset = await item.dataProvider()
          datasetsToExport.push(dataset)
        } catch (error) {
          console.error(`Failed to load dataset ${item.name}:`, error)
          toast.warning(
            `Skipped ${item.name}`,
            `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }

      if (datasetsToExport.length === 0) {
        throw new Error("No datasets could be loaded")
      }

      // Create ZIP file
      setExportProgress(95)
      const timestamp = new Date().toISOString().split('T')[0]
      await batchExportAsZip({
        datasets: datasetsToExport,
        zipFileName: `dashboard_export_${timestamp}`,
        includeMetadata: true
      })

      setExportProgress(100)
      toast.success(
        "Export completed",
        `Successfully exported ${datasetsToExport.length} dataset(s) as ZIP`
      )

      // Close dialog after short delay
      setTimeout(() => {
        setOpen(false)
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)

    } catch (error) {
      console.error("Batch export error:", error)
      toast.error(
        "Export failed",
        error instanceof Error ? error.message : "Failed to create export ZIP"
      )
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <FileArchive className="w-4 h-4" />
            Batch Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Batch Export to ZIP
          </DialogTitle>
          <DialogDescription>
            Select datasets to export as a single ZIP file
          </DialogDescription>
        </DialogHeader>

        {!isExporting ? (
          <div className="space-y-6">
            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedDatasets.size === availableDatasets.length}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAll}
                  disabled={selectedDatasets.size === 0}
                >
                  Deselect All
                </Button>
              </div>
              <Badge variant="secondary">
                {selectedDatasets.size} / {availableDatasets.length} selected
              </Badge>
            </div>

            {/* Dataset List */}
            <div className="space-y-3">
              {availableDatasets.map((dataset) => {
                const isSelected = selectedDatasets.has(dataset.id)
                return (
                  <div
                    key={dataset.id}
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 transition-colors cursor-pointer
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    onClick={() => toggleDataset(dataset.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleDataset(dataset.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Label className="cursor-pointer font-medium">
                          {dataset.name}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {formatNumber(dataset.recordCount, 0)} records
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {dataset.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            {selectedDatasets.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Export Summary
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {selectedDatasets.size} dataset(s) • {formatNumber(totalRecords, 0)} total records
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 text-xs">
                      Files will be bundled in a ZIP archive with metadata
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Export Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleExport}
                disabled={selectedDatasets.size === 0}
              >
                <Download className="w-4 h-4" />
                Export {selectedDatasets.size > 0 && `(${selectedDatasets.size})`}
              </Button>
            </div>
          </div>
        ) : (
          // Export Progress
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Exporting Data...</h3>
                <p className="text-sm text-muted-foreground">
                  Creating ZIP archive with {selectedDatasets.size} dataset(s)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={exportProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {exportProgress.toFixed(0)}% complete
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

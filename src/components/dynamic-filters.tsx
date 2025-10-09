"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Filter, 
  X, 
  FileSpreadsheet, 
  Database, 
  RefreshCw,
  Download,
  Eye,
  Settings
} from "lucide-react"

interface DynamicFilterOptions {
  regions: string[]
  states: string[]
  technologyTypes: string[]
  unitNames: string[]
  contractNames: string[]
  contractTypes: string[]
  marketTypes: string[]
  storageTypes: string[]
  dataSources: Array<{
    id: string
    name: string
    type: string
    uploadedAt: Date
  }>
}

interface FileDetails {
  id: string
  name: string
  headers: string[]
  sampleData: any[]
  totalRows: number
}

interface DynamicFiltersProps {
  module: string
  onFiltersChange: (filters: any) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  isOpen: boolean
  onClose: () => void
}

export function DynamicFilters({
  module,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  isOpen,
  onClose
}: DynamicFiltersProps) {
  const [filters, setFilters] = useState<any>({})
  const [availableFilters, setAvailableFilters] = useState<DynamicFilterOptions>({
    regions: [],
    states: [],
    technologyTypes: [],
    unitNames: [],
    contractNames: [],
    contractTypes: [],
    marketTypes: [],
    storageTypes: [],
    dataSources: []
  })
  const [selectedFile, setSelectedFile] = useState<string>("all")
  const [fileDetails, setFileDetails] = useState<FileDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchFilterOptions()
    }
  }, [isOpen, module])

  useEffect(() => {
    if (selectedFile && selectedFile !== "all") {
      fetchFileDetails(selectedFile)
    } else {
      setFileDetails(null)
    }
  }, [selectedFile])

  const fetchFilterOptions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/filters/dynamic?module=${module}`)
      const result = await response.json()
      if (result.success) {
        setAvailableFilters(result.data.filterOptions)
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFileDetails = async (fileId: string) => {
    try {
      const response = await fetch(`/api/filters/dynamic?module=${module}&fileId=${fileId}`)
      const result = await response.json()
      if (result.success && result.data.fileDetails) {
        setFileDetails(result.data.fileDetails)
      }
    } catch (error) {
      console.error("Error fetching file details:", error)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleMultiSelectChange = (key: string, value: string, checked: boolean) => {
    const currentValues = filters[key] || []
    let newValues
    
    if (checked) {
      newValues = [...currentValues, value]
    } else {
      newValues = currentValues.filter((v: string) => v !== value)
    }
    
    handleFilterChange(key, newValues)
  }

  const renderMultiSelect = (title: string, key: string, options: string[]) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {options.map(option => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${key}-${option}`}
              checked={filters[key]?.includes(option) || false}
              onCheckedChange={(checked) => 
                handleMultiSelectChange(key, option, checked as boolean)
              }
            />
            <label htmlFor={`${key}-${option}`} className="text-sm">
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderFileHeaders = () => {
    if (!fileDetails) return null

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Excel Headers</h4>
          <Badge variant="outline">
            {fileDetails.totalRows} rows
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {fileDetails.headers.map(header => (
            <div key={header} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="text-sm font-mono">{header}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Add this header as a filter
                  const customFilters = filters.customFilters || {}
                  customFilters[header] = ""
                  handleFilterChange("customFilters", customFilters)
                }}
              >
                <Filter className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {filters.customFilters && Object.keys(filters.customFilters).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Custom Filters</h4>
            {Object.entries(filters.customFilters).map(([header, value]) => (
              <div key={header} className="flex items-center gap-2">
                <Label className="text-sm w-32 truncate">{header}:</Label>
                <Input
                  placeholder="Filter value..."
                  value={value as string}
                  onChange={(e) => {
                    const customFilters = { ...filters.customFilters, [header]: e.target.value }
                    handleFilterChange("customFilters", customFilters)
                  }}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const customFilters = { ...filters.customFilters }
                    delete customFilters[header]
                    handleFilterChange("customFilters", customFilters)
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Dynamic Filters
              </CardTitle>
              <CardDescription>
                Customize filters based on uploaded data sources and Excel headers
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchFilterOptions}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading filter options...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Data Source Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Data Source</Label>
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data Sources</SelectItem>
                    {availableFilters.dataSources.map(source => (
                      <SelectItem key={source.id} value={source.id}>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4" />
                          {source.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Standard Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableFilters.regions.length > 0 && 
                  renderMultiSelect("Regions", "regions", availableFilters.regions)}
                
                {availableFilters.states.length > 0 && 
                  renderMultiSelect("States", "states", availableFilters.states)}
                
                {module === 'storage-operations' && availableFilters.storageTypes.length > 0 && 
                  renderMultiSelect("Storage Types", "storageTypes", availableFilters.storageTypes)}
                
                {module === 'dmo' && availableFilters.technologyTypes.length > 0 && 
                  renderMultiSelect("Technology Types", "technologyTypes", availableFilters.technologyTypes)}
                
                {module === 'dmo' && availableFilters.unitNames.length > 0 && 
                  renderMultiSelect("Unit Names", "unitNames", availableFilters.unitNames)}
                
                {module === 'dmo' && availableFilters.contractNames.length > 0 && 
                  renderMultiSelect("Contract Names", "contractNames", availableFilters.contractNames)}
                
                {module === 'dmo' && availableFilters.contractTypes.length > 0 && 
                  renderMultiSelect("Contract Types", "contractTypes", availableFilters.contractTypes)}
                
                {module === 'dmo' && availableFilters.marketTypes.length > 0 && 
                  renderMultiSelect("Market Types", "marketTypes", availableFilters.marketTypes)}
              </div>

              {/* Excel Headers Section */}
              {selectedFile !== "all" && fileDetails && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Excel File Analysis
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fileDetails.name}</Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Sample Data
                      </Button>
                    </div>
                  </div>
                  
                  {renderFileHeaders()}
                </div>
              )}

              {/* Advanced Options */}
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mb-4"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Advanced Options
                </Button>

                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Date Range</Label>
                        <div className="flex gap-2 mt-1">
                          <Input type="date" placeholder="From" />
                          <Input type="date" placeholder="To" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Data Limit</Label>
                        <Input type="number" placeholder="Max records" defaultValue="1000" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClearFilters}>
                Clear All
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Filters
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
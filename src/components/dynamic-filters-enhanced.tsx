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
  Settings,
  Save,
  Upload,
  Trash2,
  Plus
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

interface FilterPreset {
  id: string
  name: string
  filters: any
  createdAt: Date
}

interface DynamicFiltersEnhancedProps {
  module: string
  onFiltersChange: (filters: any) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  isOpen: boolean
  onClose: () => void
}

export function DynamicFiltersEnhanced({
  module,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  isOpen,
  onClose
}: DynamicFiltersEnhancedProps) {
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
  const [loading, setLoading] = useState(false)
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND')
  
  // Filter presets
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([])
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  
  // Date range
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Numeric ranges
  const [numericRanges, setNumericRanges] = useState<Record<string, [number, number]>>({})

  // Load saved filters and presets from localStorage
  useEffect(() => {
    if (isOpen) {
      loadSavedFilters()
      loadFilterPresets()
      fetchFilterOptions()
    }
  }, [isOpen, module])

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem(`filters_${module}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setFilters(parsed.filters || {})
        setFilterLogic(parsed.logic || 'AND')
        if (parsed.dateRange) {
          setDateRange(parsed.dateRange)
        }
        if (parsed.numericRanges) {
          setNumericRanges(parsed.numericRanges)
        }
      }
    } catch (error) {
      console.error('Error loading saved filters:', error)
    }
  }

  const saveFiltersToStorage = () => {
    try {
      const toSave = {
        filters,
        logic: filterLogic,
        dateRange,
        numericRanges,
        savedAt: new Date().toISOString()
      }
      localStorage.setItem(`filters_${module}`, JSON.stringify(toSave))
    } catch (error) {
      console.error('Error saving filters:', error)
    }
  }

  const loadFilterPresets = () => {
    try {
      const saved = localStorage.getItem(`filter_presets_${module}`)
      if (saved) {
        setFilterPresets(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading filter presets:', error)
    }
  }

  const saveFilterPreset = () => {
    if (!presetName.trim()) return

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName,
      filters: {
        filters,
        logic: filterLogic,
        dateRange,
        numericRanges
      },
      createdAt: new Date()
    }

    const updated = [...filterPresets, newPreset]
    setFilterPresets(updated)
    
    try {
      localStorage.setItem(`filter_presets_${module}`, JSON.stringify(updated))
      setShowSavePresetDialog(false)
      setPresetName('')
    } catch (error) {
      console.error('Error saving preset:', error)
    }
  }

  const loadFilterPreset = (preset: FilterPreset) => {
    setFilters(preset.filters.filters || {})
    setFilterLogic(preset.filters.logic || 'AND')
    setDateRange(preset.filters.dateRange)
    setNumericRanges(preset.filters.numericRanges || {})
    onFiltersChange(preset.filters.filters)
  }

  const deleteFilterPreset = (id: string) => {
    const updated = filterPresets.filter(p => p.id !== id)
    setFilterPresets(updated)
    localStorage.setItem(`filter_presets_${module}`, JSON.stringify(updated))
  }

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

  const handleNumericRangeChange = (key: string, values: number[]) => {
    setNumericRanges(prev => ({
      ...prev,
      [key]: [values[0], values[1]]
    }))
  }

  const handleApplyFilters = () => {
    saveFiltersToStorage()
    
    // Combine all filters
    const combinedFilters = {
      ...filters,
      logic: filterLogic,
      dateRange,
      numericRanges
    }
    
    onFiltersChange(combinedFilters)
    onApplyFilters()
  }

  const handleClearAll = () => {
    setFilters({})
    setDateRange(undefined)
    setNumericRanges({})
    setFilterLogic('AND')
    localStorage.removeItem(`filters_${module}`)
    onClearFilters()
  }

  const exportFilters = () => {
    const exportData = {
      module,
      filters,
      logic: filterLogic,
      dateRange,
      numericRanges,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filters_${module}_${Date.now()}.json`
    a.click()
  }

  const importFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setFilters(imported.filters || {})
        setFilterLogic(imported.logic || 'AND')
        setDateRange(imported.dateRange)
        setNumericRanges(imported.numericRanges || {})
        onFiltersChange(imported.filters)
      } catch (error) {
        console.error('Error importing filters:', error)
      }
    }
    reader.readAsText(file)
  }

  const renderMultiSelect = (title: string, key: string, options: string[]) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
        {options.map(option => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${key}-${option}`}
              checked={filters[key]?.includes(option) || false}
              onCheckedChange={(checked) => 
                handleMultiSelectChange(key, option, checked as boolean)
              }
            />
            <label 
              htmlFor={`${key}-${option}`} 
              className="text-sm cursor-pointer"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
      {filters[key]?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {filters[key].map((val: string) => (
            <Badge key={val} variant="secondary" className="text-xs">
              {val}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => handleMultiSelectChange(key, val, false)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )

  const renderNumericRange = (title: string, key: string, min: number, max: number) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="space-y-3">
        <Slider
          min={min}
          max={max}
          step={(max - min) / 100}
          value={numericRanges[key] || [min, max]}
          onValueChange={(values) => handleNumericRangeChange(key, values)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{numericRanges[key]?.[0]?.toFixed(2) || min}</span>
          <span>{numericRanges[key]?.[1]?.toFixed(2) || max}</span>
        </div>
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Advanced Filters
              </CardTitle>
              <CardDescription>
                Configure filters with persistence, presets, and advanced logic
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
            <Tabs defaultValue="filters" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="presets">Presets</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="filters" className="space-y-6 mt-6">
                {/* Filter Logic Selector */}
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Label className="font-medium">Filter Logic:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={filterLogic === 'AND' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterLogic('AND')}
                    >
                      AND (All must match)
                    </Button>
                    <Button
                      variant={filterLogic === 'OR' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterLogic('OR')}
                    >
                      OR (Any can match)
                    </Button>
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "LLL dd, y")} -{" "}
                              {format(dateRange.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(dateRange.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Standard Multi-Select Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableFilters.regions.length > 0 && 
                    renderMultiSelect("Regions", "regions", availableFilters.regions)}
                  
                  {availableFilters.states.length > 0 && 
                    renderMultiSelect("States", "states", availableFilters.states)}
                  
                  {module === 'storage-operations' && availableFilters.storageTypes.length > 0 && 
                    renderMultiSelect("Storage Types", "storageTypes", availableFilters.storageTypes)}
                  
                  {module === 'dmo' && availableFilters.technologyTypes.length > 0 && 
                    renderMultiSelect("Technology Types", "technologyTypes", availableFilters.technologyTypes)}
                  
                  {module === 'dmo' && availableFilters.contractTypes.length > 0 && 
                    renderMultiSelect("Contract Types", "contractTypes", availableFilters.contractTypes)}
                  
                  {module === 'dmo' && availableFilters.marketTypes.length > 0 && 
                    renderMultiSelect("Market Types", "marketTypes", availableFilters.marketTypes)}
                </div>

                {/* Numeric Range Sliders */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-medium">Numeric Ranges</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderNumericRange("Capacity (MW)", "capacity", 0, 1000)}
                    {renderNumericRange("Generation (MW)", "generation", 0, 1000)}
                    {renderNumericRange("Price (₹/MWh)", "price", 0, 10000)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="presets" className="space-y-4 mt-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Saved Filter Presets</h3>
                  <Button onClick={() => setShowSavePresetDialog(true)} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Current Filters
                  </Button>
                </div>

                {filterPresets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No saved presets yet</p>
                    <p className="text-sm">Save your current filters to reuse them later</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filterPresets.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{preset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(preset.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadFilterPreset(preset)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteFilterPreset(preset.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Import/Export Filters</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={exportFilters}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Filters
                      </Button>
                      <Button variant="outline" asChild>
                        <label className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Filters
                          <input
                            type="file"
                            accept=".json"
                            onChange={importFilters}
                            className="hidden"
                          />
                        </label>
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Filter Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-2xl font-bold">{Object.keys(filters).length}</p>
                          <p className="text-sm text-muted-foreground">Active Filters</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-2xl font-bold">{filterPresets.length}</p>
                          <p className="text-sm text-muted-foreground">Saved Presets</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Current Filter Configuration</h3>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
                      {JSON.stringify({ filters, logic: filterLogic, dateRange, numericRanges }, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>

        <div className="border-t p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClearAll}>
                Clear All
              </Button>
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary">
                  {Object.keys(filters).length} active filters
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Save Preset Dialog */}
      <Dialog open={showSavePresetDialog} onOpenChange={setShowSavePresetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Give your filter configuration a name to save it for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., High Capacity Storage Units"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSavePresetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveFilterPreset} disabled={!presetName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

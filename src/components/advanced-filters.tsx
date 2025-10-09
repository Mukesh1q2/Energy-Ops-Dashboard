"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, X, RotateCcw } from "lucide-react"
import { format } from "date-fns"

export interface FilterOptions {
  regions: string[]
  states: string[]
  technologyTypes: string[]
  unitNames: string[]
  contractNames: string[]
  contractTypes: string[]
  marketTypes: string[]
}

export interface FilterState {
  selectedRegions: string[]
  selectedStates: string[]
  selectedTechnologyTypes: string[]
  selectedUnitNames: string[]
  selectedContractNames: string[]
  selectedContractTypes: string[]
  selectedMarketTypes: string[]
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
}

interface AdvancedFiltersProps {
  options: FilterOptions
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  module?: string
}

export function AdvancedFilters({
  options,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  module = "all"
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleSelection = (value: string, field: keyof FilterState) => {
    const currentValues = filters[field] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    onFiltersChange({
      ...filters,
      [field]: newValues
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      selectedRegions: [],
      selectedStates: [],
      selectedTechnologyTypes: [],
      selectedUnitNames: [],
      selectedContractNames: [],
      selectedContractTypes: [],
      selectedMarketTypes: [],
      dateRange: { from: undefined, to: undefined }
    })
    onClearFilters()
  }

  const hasActiveFilters = () => {
    return (
      filters.selectedRegions.length > 0 ||
      filters.selectedStates.length > 0 ||
      filters.selectedTechnologyTypes.length > 0 ||
      filters.selectedUnitNames.length > 0 ||
      filters.selectedContractNames.length > 0 ||
      filters.selectedContractTypes.length > 0 ||
      filters.selectedMarketTypes.length > 0 ||
      filters.dateRange.from ||
      filters.dateRange.to
    )
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.selectedRegions.length > 0) count++
    if (filters.selectedStates.length > 0) count++
    if (filters.selectedTechnologyTypes.length > 0) count++
    if (filters.selectedUnitNames.length > 0) count++
    if (filters.selectedContractNames.length > 0) count++
    if (filters.selectedContractTypes.length > 0) count++
    if (filters.selectedMarketTypes.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Advanced Filters
              {hasActiveFilters() && (
                <Badge variant="secondary" className="ml-2">
                  {getActiveFiltersCount()} active
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Filter data by region, state, technology, and date range
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
            <Button onClick={onApplyFilters} size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Region and State Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Regions</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {options.regions.map((region) => (
                  <Badge
                    key={region}
                    variant={filters.selectedRegions.includes(region) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleSelection(region, "selectedRegions")}
                  >
                    {region}
                    {filters.selectedRegions.includes(region) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">States</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                {options.states.map((state) => (
                  <Badge
                    key={state}
                    variant={filters.selectedStates.includes(state) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleSelection(state, "selectedStates")}
                  >
                    {state}
                    {filters.selectedStates.includes(state) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Module-specific filters */}
          {(module === "dmo" || module === "all") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Technology Types</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {options.technologyTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={filters.selectedTechnologyTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSelection(type, "selectedTechnologyTypes")}
                    >
                      {type}
                      {filters.selectedTechnologyTypes.includes(type) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Unit Names</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {options.unitNames.map((unit) => (
                    <Badge
                      key={unit}
                      variant={filters.selectedUnitNames.includes(unit) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSelection(unit, "selectedUnitNames")}
                    >
                      {unit}
                      {filters.selectedUnitNames.includes(unit) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Contract Names</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {options.contractNames.map((contract) => (
                    <Badge
                      key={contract}
                      variant={filters.selectedContractNames.includes(contract) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSelection(contract, "selectedContractNames")}
                    >
                      {contract}
                      {filters.selectedContractNames.includes(contract) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(module === "dmo" || module === "all") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Contract Types</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {options.contractTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={filters.selectedContractTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSelection(type, "selectedContractTypes")}
                    >
                      {type}
                      {filters.selectedContractTypes.includes(type) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">Market Types</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {options.marketTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={filters.selectedMarketTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleSelection(type, "selectedMarketTypes")}
                    >
                      {type}
                      {filters.selectedMarketTypes.includes(type) && (
                        <X className="w-3 h-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      format(filters.dateRange.from, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from}
                    onSelect={(date) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: { ...filters.dateRange, from: date }
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label className="text-sm font-medium mb-2 block">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.to ? (
                      format(filters.dateRange.to, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to}
                    onSelect={(date) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: { ...filters.dateRange, to: date }
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters() && (
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.selectedRegions.map(region => (
                  <Badge key={region} variant="secondary" className="text-xs">
                    Region: {region}
                  </Badge>
                ))}
                {filters.selectedStates.map(state => (
                  <Badge key={state} variant="secondary" className="text-xs">
                    State: {state}
                  </Badge>
                ))}
                {filters.selectedTechnologyTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    Technology: {type}
                  </Badge>
                ))}
                {filters.selectedUnitNames.map(unit => (
                  <Badge key={unit} variant="secondary" className="text-xs">
                    Unit: {unit}
                  </Badge>
                ))}
                {filters.selectedContractNames.map(contract => (
                  <Badge key={contract} variant="secondary" className="text-xs">
                    Contract: {contract}
                  </Badge>
                ))}
                {filters.selectedContractTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    Contract Type: {type}
                  </Badge>
                ))}
                {filters.selectedMarketTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    Market Type: {type}
                  </Badge>
                ))}
                {filters.dateRange.from && (
                  <Badge variant="secondary" className="text-xs">
                    From: {format(filters.dateRange.from, "PP")}
                  </Badge>
                )}
                {filters.dateRange.to && (
                  <Badge variant="secondary" className="text-xs">
                    To: {format(filters.dateRange.to, "PP")}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
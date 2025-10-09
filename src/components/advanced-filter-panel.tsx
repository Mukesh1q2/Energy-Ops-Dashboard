"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, X, Calendar as CalendarIcon, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface FilterPanelProps {
  module: 'dmo' | 'rmo' | 'storage'
  onFiltersChange: (filters: any) => void
  onApply: () => void
  onClear: () => void
}

export function AdvancedFilterPanel({ module, onFiltersChange, onApply, onClear }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState<any>({})
  const [selectedFilters, setSelectedFilters] = useState<any>({
    technologyType: 'all',
    region: 'all',
    state: 'all',
    plantName: 'all',
    contractType: 'all',
    contractName: 'all',
    timeBlock: 'all',
    modelId: 'all',
    priceRange: { dam: [0, 10000], gdam: [0, 10000], rtm: [0, 10000] },
    scheduledMwRange: [0, 1000],
    dateFrom: undefined,
    dateTo: undefined
  })
  const [loading, setLoading] = useState(true)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Fetch filter options based on module
  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true)
      try {
        let endpoint = '/api/dmo/filters?type=all'
        if (module === 'rmo') {
          endpoint = '/api/rmo/filters'
        } else if (module === 'storage') {
          endpoint = '/api/storage/filters'
        }
        
        const response = await fetch(endpoint)
        const result = await response.json()
        
        if (result.success) {
          setFilterOptions(result.data)
          
          // Initialize range sliders with actual data ranges
          if (result.data.priceRanges) {
            setSelectedFilters(prev => ({
              ...prev,
              priceRange: {
                dam: [result.data.priceRanges.damPrice?.min || 0, result.data.priceRanges.damPrice?.max || 10000],
                gdam: [result.data.priceRanges.gdamPrice?.min || 0, result.data.priceRanges.gdamPrice?.max || 10000],
                rtm: [result.data.priceRanges.rtmPrice?.min || 0, result.data.priceRanges.rtmPrice?.max || 10000]
              },
              scheduledMwRange: [
                result.data.scheduledMwRange?.min || 0,
                result.data.scheduledMwRange?.max || 1000
              ]
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching filter options:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFilters()
  }, [module])

  // Calculate active filter count
  useEffect(() => {
    let count = 0
    if (selectedFilters.technologyType !== 'all') count++
    if (selectedFilters.region !== 'all') count++
    if (selectedFilters.state !== 'all') count++
    if (selectedFilters.plantName !== 'all') count++
    if (selectedFilters.contractType !== 'all') count++
    if (selectedFilters.contractName !== 'all') count++
    if (selectedFilters.timeBlock !== 'all') count++
    if (selectedFilters.modelId !== 'all') count++
    if (selectedFilters.dateFrom || selectedFilters.dateTo) count++
    setActiveFilterCount(count)
  }, [selectedFilters])

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...selectedFilters, [key]: value }
    setSelectedFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearAll = () => {
    const clearedFilters = {
      technologyType: 'all',
      region: 'all',
      state: 'all',
      plantName: 'all',
      contractType: 'all',
      contractName: 'all',
      timeBlock: 'all',
      modelId: 'all',
      priceRange: filterOptions.priceRanges ? {
        dam: [filterOptions.priceRanges.damPrice?.min || 0, filterOptions.priceRanges.damPrice?.max || 10000],
        gdam: [filterOptions.priceRanges.gdamPrice?.min || 0, filterOptions.priceRanges.gdamPrice?.max || 10000],
        rtm: [filterOptions.priceRanges.rtmPrice?.min || 0, filterOptions.priceRanges.rtmPrice?.max || 10000]
      } : { dam: [0, 10000], gdam: [0, 10000], rtm: [0, 10000] },
      scheduledMwRange: [filterOptions.scheduledMwRange?.min || 0, filterOptions.scheduledMwRange?.max || 1000],
      dateFrom: undefined,
      dateTo: undefined
    }
    setSelectedFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClear()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading filters...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <CardTitle className="text-lg">Advanced Filters</CardTitle>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount} active</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <X className="w-4 h-4 mr-1" />
            Clear All
          </Button>
          <Button size="sm" onClick={onApply}>
            Apply Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Technology Type */}
        {filterOptions.technologyTypes?.length > 0 && (
          <div className="space-y-2">
            <Label>Technology Type</Label>
            <Select
              value={selectedFilters.technologyType}
              onValueChange={(value) => handleFilterChange('technologyType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technologies</SelectItem>
                {filterOptions.technologyTypes.map((tech: string) => (
                  <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Region */}
        {filterOptions.regions?.length > 0 && (
          <div className="space-y-2">
            <Label>Region</Label>
            <Select
              value={selectedFilters.region}
              onValueChange={(value) => handleFilterChange('region', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {filterOptions.regions.map((region: string) => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* State */}
        {filterOptions.states?.length > 0 && (
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={selectedFilters.state}
              onValueChange={(value) => handleFilterChange('state', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterOptions.states.map((state: string) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Plant Name */}
        {filterOptions.unitNames?.length > 0 && (
          <div className="space-y-2">
            <Label>Plant/Unit Name</Label>
            <Select
              value={selectedFilters.plantName}
              onValueChange={(value) => handleFilterChange('plantName', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select plant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                {filterOptions.unitNames.map((name: string) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contract Type */}
        {filterOptions.contractTypes?.length > 0 && (
          <div className="space-y-2">
            <Label>Contract Type</Label>
            <Select
              value={selectedFilters.contractType}
              onValueChange={(value) => handleFilterChange('contractType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contract Types</SelectItem>
                {filterOptions.contractTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contract Name */}
        {filterOptions.contractNames?.length > 0 && (
          <div className="space-y-2">
            <Label>Contract Name</Label>
            <Select
              value={selectedFilters.contractName}
              onValueChange={(value) => handleFilterChange('contractName', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                {filterOptions.contractNames.map((name: string) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time Block */}
        {filterOptions.timeBlocks?.length > 0 && (
          <div className="space-y-2">
            <Label>Time Block</Label>
            <Select
              value={selectedFilters.timeBlock}
              onValueChange={(value) => handleFilterChange('timeBlock', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time block" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time Blocks</SelectItem>
                {filterOptions.timeBlocks.map((block: number) => (
                  <SelectItem key={block} value={block.toString()}>Block {block}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Model ID */}
        {filterOptions.modelIds?.length > 0 && (
          <div className="space-y-2">
            <Label>Model ID</Label>
            <Select
              value={selectedFilters.modelId}
              onValueChange={(value) => handleFilterChange('modelId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {filterOptions.modelIds.map((id: string) => (
                  <SelectItem key={id} value={id}>{id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date Range */}
        {filterOptions.timePeriods && (
          <div className="space-y-2 md:col-span-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedFilters.dateFrom ? format(selectedFilters.dateFrom, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedFilters.dateFrom}
                    onSelect={(date) => handleFilterChange('dateFrom', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedFilters.dateTo ? format(selectedFilters.dateTo, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedFilters.dateTo}
                    onSelect={(date) => handleFilterChange('dateTo', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {filterOptions.timePeriods.earliest && (
              <p className="text-xs text-muted-foreground">
                Available data: {format(new Date(filterOptions.timePeriods.earliest), "PP")} to {format(new Date(filterOptions.timePeriods.latest), "PP")}
              </p>
            )}
          </div>
        )}

        {/* DAM Price Range */}
        {filterOptions.priceRanges?.damPrice && (
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>DAM Price Range (₹{selectedFilters.priceRange.dam[0]} - ₹{selectedFilters.priceRange.dam[1]})</Label>
            <Slider
              min={filterOptions.priceRanges.damPrice.min}
              max={filterOptions.priceRanges.damPrice.max}
              step={100}
              value={selectedFilters.priceRange.dam}
              onValueChange={(value) => handleFilterChange('priceRange', { ...selectedFilters.priceRange, dam: value })}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

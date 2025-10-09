"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface FilterOptions {
  technologyTypes?: string[]
  unitNames?: string[]
  contractNames?: string[]
  contractTypes?: string[]
  marketTypes?: string[]
  regions?: string[]
  states?: string[]
  timeBlocks?: number[]
  modelIds?: string[]
  priceRanges?: {
    damPrice: { min: number; max: number }
    gdamPrice: { min: number; max: number }
    rtmPrice: { min: number; max: number }
  }
  scheduledMwRange?: { min: number; max: number }
  timePeriods?: { earliest: string | null; latest: string | null }
}

export interface Filters {
  technologyType?: string
  unitName?: string
  contractName?: string
  contractType?: string
  marketType?: string
  region?: string
  state?: string
  timeBlock?: string
  modelId?: string
}

interface DashboardFiltersProps {
  moduleType: 'dmo' | 'rmo' | 'so'
  dataType?: 'all' | 'generator' | 'contract' | 'market'
  onFiltersChange?: (filters: Filters) => void
  compact?: boolean
}

export function DashboardFilters({
  moduleType,
  dataType = 'all',
  onFiltersChange,
  compact = false
}: DashboardFiltersProps) {
  const [availableFilters, setAvailableFilters] = useState<FilterOptions | null>(null)
  const [filters, setFilters] = useState<Filters>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch available filter options
  const fetchFilters = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/${moduleType}/filters?type=${dataType}`)
      const result = await response.json()
      
      if (result.success) {
        setAvailableFilters(result.data)
      } else {
        toast.error('Failed to load filter options')
      }
    } catch (error) {
      console.error('Error fetching filters:', error)
      toast.error('Failed to load filter options')
    } finally {
      setIsLoading(false)
    }
  }

  // Load filters on mount
  useEffect(() => {
    fetchFilters()
  }, [moduleType, dataType])

  // Notify parent when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters)
    }
  }, [filters, onFiltersChange])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  const clearFilters = () => {
    setFilters({})
    toast.success('Filters cleared')
  }

  const refreshFilters = async () => {
    setIsRefreshing(true)
    await fetchFilters()
    setIsRefreshing(false)
    toast.success('Filter options refreshed')
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  if (isLoading && !availableFilters) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading filters...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!availableFilters) return null

  // Check if we have any filter options
  const hasFilters = 
    (availableFilters.technologyTypes?.length ?? 0) > 0 ||
    (availableFilters.regions?.length ?? 0) > 0 ||
    (availableFilters.states?.length ?? 0) > 0 ||
    (availableFilters.unitNames?.length ?? 0) > 0 ||
    (availableFilters.contractTypes?.length ?? 0) > 0 ||
    (availableFilters.marketTypes?.length ?? 0) > 0

  if (!hasFilters) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-sm text-muted-foreground">
            <Filter className="h-5 w-5 mx-auto mb-2 opacity-50" />
            No filter options available. Upload data to enable filters.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </CardTitle>
            {!compact && (
              <CardDescription>
                Filter dashboard data by various attributes from uploaded Excel files
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshFilters}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
          {/* Technology Type */}
          {availableFilters.technologyTypes && availableFilters.technologyTypes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Technology Type</label>
              <Select
                value={filters.technologyType || 'all'}
                onValueChange={(value) => handleFilterChange('technologyType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Technologies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technologies</SelectItem>
                  {availableFilters.technologyTypes.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Region */}
          {availableFilters.regions && availableFilters.regions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <Select
                value={filters.region || 'all'}
                onValueChange={(value) => handleFilterChange('region', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {availableFilters.regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* State */}
          {availableFilters.states && availableFilters.states.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select
                value={filters.state || 'all'}
                onValueChange={(value) => handleFilterChange('state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {availableFilters.states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Unit/Plant Name */}
          {availableFilters.unitNames && availableFilters.unitNames.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit/Plant Name</label>
              <Select
                value={filters.unitName || 'all'}
                onValueChange={(value) => handleFilterChange('unitName', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {availableFilters.unitNames.slice(0, 50).map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                  {availableFilters.unitNames.length > 50 && (
                    <SelectItem value="all" disabled>
                      ... and {availableFilters.unitNames.length - 50} more
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Contract Type */}
          {availableFilters.contractTypes && availableFilters.contractTypes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Contract Type</label>
              <Select
                value={filters.contractType || 'all'}
                onValueChange={(value) => handleFilterChange('contractType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Contract Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contract Types</SelectItem>
                  {availableFilters.contractTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Market Type */}
          {availableFilters.marketTypes && availableFilters.marketTypes.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Market Type</label>
              <Select
                value={filters.marketType || 'all'}
                onValueChange={(value) => handleFilterChange('marketType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Market Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Market Types</SelectItem>
                  {availableFilters.marketTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time Block */}
          {availableFilters.timeBlocks && availableFilters.timeBlocks.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Block</label>
              <Select
                value={filters.timeBlock || 'all'}
                onValueChange={(value) => handleFilterChange('timeBlock', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Time Blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time Blocks</SelectItem>
                  {availableFilters.timeBlocks.slice(0, 96).map((block) => (
                    <SelectItem key={block} value={String(block)}>
                      Block {block}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Model ID */}
          {availableFilters.modelIds && availableFilters.modelIds.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Model ID</label>
              <Select
                value={filters.modelId || 'all'}
                onValueChange={(value) => handleFilterChange('modelId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {availableFilters.modelIds.map((modelId) => (
                    <SelectItem key={modelId} value={modelId}>
                      {modelId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Filter Summary */}
        {activeFilterCount > 0 && !compact && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => 
                value ? (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    <span className="text-xs capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}: {value}
                    </span>
                    <button
                      onClick={() => handleFilterChange(key as keyof Filters, 'all')}
                      className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

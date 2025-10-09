"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>
  isLoading?: boolean
  lastUpdated?: Date | null
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
  showTimestamp?: boolean
  disabled?: boolean
  className?: string
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  lastUpdated,
  variant = "outline",
  size = "sm",
  showLabel = false,
  showTimestamp = true,
  disabled = false,
  className
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (isRefreshing || disabled) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const loading = isLoading || isRefreshing

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={handleRefresh}
              disabled={disabled || loading}
              className={cn(
                "gap-2",
                loading && "cursor-not-allowed"
              )}
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4",
                  loading && "animate-spin"
                )}
              />
              {showLabel && (
                <span className="hidden sm:inline">
                  {loading ? "Refreshing..." : "Refresh"}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{loading ? "Refreshing data..." : "Refresh data"}</p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showTimestamp && lastUpdated && (
        <Badge variant="secondary" className="text-xs hidden md:flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatLastUpdated(lastUpdated)}</span>
        </Badge>
      )}
    </div>
  )
}

interface RefreshMetaProps {
  lastUpdated?: Date | null
  isLoading?: boolean
  recordCount?: number
  className?: string
}

/**
 * Display metadata about data freshness
 */
export function RefreshMeta({
  lastUpdated,
  isLoading,
  recordCount,
  className
}: RefreshMetaProps) {
  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      {isLoading ? (
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {lastUpdated && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                Updated {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          )}
          {recordCount !== undefined && (
            <Badge variant="outline" className="text-xs">
              {recordCount.toLocaleString()} records
            </Badge>
          )}
        </>
      )}
    </div>
  )
}

interface AutoRefreshToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  interval?: number // in seconds
  className?: string
}

/**
 * Toggle for auto-refresh functionality
 */
export function AutoRefreshToggle({
  enabled,
  onToggle,
  interval = 30,
  className
}: AutoRefreshToggleProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={enabled ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(!enabled)}
        className="gap-2"
      >
        <RefreshCw className={cn("w-3 h-3", enabled && "animate-spin")} />
        <span className="text-xs">
          Auto-refresh {enabled ? "ON" : "OFF"}
        </span>
      </Button>
      {enabled && (
        <span className="text-xs text-muted-foreground">
          Every {interval}s
        </span>
      )}
    </div>
  )
}

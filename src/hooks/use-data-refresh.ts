import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '@/contexts/toast-context'

export interface UseDataRefreshOptions<T> {
  fetchData: () => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  showToasts?: boolean
  toastMessages?: {
    success?: string
    error?: string
  }
}

export interface UseDataRefreshReturn<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
  setData: (data: T) => void
  isAutoRefreshEnabled: boolean
  toggleAutoRefresh: () => void
}

/**
 * Custom hook for managing data refresh state with optional auto-refresh
 * 
 * @example
 * const { data, isLoading, lastUpdated, refresh } = useDataRefresh({
 *   fetchData: async () => {
 *     const res = await fetch('/api/data')
 *     return res.json()
 *   },
 *   autoRefresh: false,
 *   refreshInterval: 30000
 * })
 */
export function useDataRefresh<T>({
  fetchData,
  onSuccess,
  onError,
  autoRefresh = false,
  refreshInterval = 30000,
  showToasts = false,
  toastMessages = {}
}: UseDataRefreshOptions<T>): UseDataRefreshReturn<T> {
  // Always call hook at top level (React rules)
  const toast = useToast()
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(autoRefresh)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const refresh = useCallback(async () => {
    if (!isMountedRef.current || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchData()
      
      if (!isMountedRef.current) return

      setData(result)
      setLastUpdated(new Date())
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (showToasts) {
        toast.success(
          toastMessages.success || 'Data refreshed',
          'Successfully updated data'
        )
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      
      if (!isMountedRef.current) return

      setError(error)
      
      if (onError) {
        onError(error)
      }
      
      if (showToasts) {
        toast.error(
          toastMessages.error || 'Refresh failed',
          error.message
        )
      }
      
      console.error('Data refresh error:', error)
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [fetchData, onSuccess, onError, showToasts, toast, toastMessages, isLoading])

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev)
  }, [])

  // Initial data fetch
  useEffect(() => {
    refresh()
  }, []) // Only on mount

  // Auto-refresh logic
  useEffect(() => {
    if (isAutoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh()
      }, refreshInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }
  }, [isAutoRefreshEnabled, refreshInterval, refresh])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refresh,
    setData,
    isAutoRefreshEnabled,
    toggleAutoRefresh
  }
}

/**
 * Simple version for components that just need refresh functionality
 */
export function useRefresh(
  refreshFn: () => Promise<void> | void,
  options: { showToasts?: boolean; successMessage?: string; errorMessage?: string } = {}
) {
  // Always call hook at top level (React rules)
  const toast = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await refreshFn()
      setLastUpdated(new Date())
      
      if (options.showToasts) {
        toast.success(
          options.successMessage || 'Refreshed',
          'Data updated successfully'
        )
      }
    } catch (error) {
      if (options.showToasts) {
        toast.error(
          options.errorMessage || 'Refresh failed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      }
      console.error('Refresh error:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshFn, isRefreshing, options, toast])

  return {
    isRefreshing,
    lastUpdated,
    refresh
  }
}

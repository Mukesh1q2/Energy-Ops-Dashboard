# Refresh Functionality Documentation

## Overview

The Refresh Functionality provides users with manual and automatic data refresh capabilities across all charts and visualizations in the Energy-Ops Dashboard. This ensures users always have access to the latest data without page reloads.

## Features

✅ **Manual Refresh** - One-click data reload for any chart  
✅ **Last Updated Timestamp** - See when data was last refreshed  
✅ **Loading States** - Visual feedback during refresh  
✅ **Toast Notifications** - Success/error feedback  
✅ **Auto-Refresh (Optional)** - Periodic automatic updates  
✅ **Tooltip Hints** - Hover for more information  
✅ **Responsive Design** - Works on all screen sizes  

---

## User Guide

### Manual Refresh

#### Using the Refresh Button

1. **Location**: Top-right corner of each chart
2. **Icon**: 🔄 Refresh icon
3. **Indicator**: Icon spins while loading

#### Steps:
1. Click the refresh button on any chart
2. Wait for the spinning animation
3. See toast notification on completion
4. View updated "Last updated" timestamp

### Auto-Refresh (Where Supported)

Some charts support automatic periodic refresh:

1. **Toggle**: Click "Auto-refresh ON/OFF" button
2. **Frequency**: Usually every 30 seconds
3. **Indicator**: Icon continuously spins when enabled
4. **Stop**: Click toggle again to disable

### Last Updated Information

**Badge Display** shows:
- "Just now" - Updated < 1 minute ago
- "5m ago" - Updated 5 minutes ago
- "2h ago" - Updated 2 hours ago
- Date - Updated more than 7 days ago

**Tooltip** shows exact timestamp on hover

---

## Developer Guide

### Components

#### 1. RefreshButton Component
**File**: `src/components/refresh-button.tsx`

Main component for manual refresh functionality.

```typescript
<RefreshButton
  onRefresh={handleRefresh}
  isLoading={loading}
  lastUpdated={lastUpdated}
  showLabel={true}
  showTimestamp={true}
/>
```

**Props**:
- `onRefresh` - Function to call on refresh
- `isLoading` - Loading state indicator
- `lastUpdated` - Last refresh timestamp
- `variant` - Button style variant
- `size` - Button size
- `showLabel` - Show "Refresh" text
- `showTimestamp` - Show time badge
- `disabled` - Disable button
- `className` - Additional CSS classes

#### 2. RefreshMeta Component

Display metadata about data freshness.

```typescript
<RefreshMeta
  lastUpdated={lastUpdated}
  isLoading={loading}
  recordCount={data.length}
/>
```

#### 3. AutoRefreshToggle Component

Toggle for auto-refresh functionality.

```typescript
<AutoRefreshToggle
  enabled={autoRefreshEnabled}
  onToggle={toggleAutoRefresh}
  interval={30}
/>
```

### Custom Hooks

#### useDataRefresh Hook
**File**: `src/hooks/use-data-refresh.ts`

Complete data management with refresh capabilities.

```typescript
const {
  data,
  isLoading,
  error,
  lastUpdated,
  refresh,
  isAutoRefreshEnabled,
  toggleAutoRefresh
} = useDataRefresh({
  fetchData: async () => {
    const res = await fetch('/api/data')
    return res.json()
  },
  autoRefresh: false,
  refreshInterval: 30000,
  showToasts: true
})
```

**Options**:
- `fetchData` - Async function to fetch data
- `onSuccess` - Callback on successful fetch
- `onError` - Callback on error
- `autoRefresh` - Enable auto-refresh
- `refreshInterval` - Refresh interval (ms)
- `showToasts` - Show toast notifications
- `toastMessages` - Custom toast messages

**Returns**:
- `data` - Fetched data
- `isLoading` - Loading state
- `error` - Error object if any
- `lastUpdated` - Last update timestamp
- `refresh` - Manual refresh function
- `setData` - Update data manually
- `isAutoRefreshEnabled` - Auto-refresh state
- `toggleAutoRefresh` - Toggle function

#### useRefresh Hook

Simplified version for existing components.

```typescript
const { isRefreshing, lastUpdated, refresh } = useRefresh(
  async () => {
    await fetchMyData()
  },
  {
    showToasts: true,
    successMessage: "Data refreshed",
    errorMessage: "Refresh failed"
  }
)
```

---

## Implementation Examples

### Example 1: Basic Chart with Refresh

```typescript
"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RefreshButton } from "@/components/refresh-button"
import { useToast } from "@/contexts/toast-context"

export function MyChart() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/my-data')
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
        setLastUpdated(new Date())
        toast.success("Data refreshed", "Successfully updated chart")
      }
    } catch (error) {
      toast.error("Refresh failed", error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Chart</CardTitle>
          <RefreshButton
            onRefresh={fetchData}
            isLoading={loading}
            lastUpdated={lastUpdated}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart content */}
      </CardContent>
    </Card>
  )
}
```

### Example 2: Using useDataRefresh Hook

```typescript
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { RefreshButton, AutoRefreshToggle } from "@/components/refresh-button"
import { useDataRefresh } from "@/hooks/use-data-refresh"

export function AdvancedChart() {
  const {
    data,
    isLoading,
    lastUpdated,
    refresh,
    isAutoRefreshEnabled,
    toggleAutoRefresh
  } = useDataRefresh({
    fetchData: async () => {
      const res = await fetch('/api/advanced-data')
      return res.json()
    },
    autoRefresh: false,
    refreshInterval: 30000,
    showToasts: true,
    toastMessages: {
      success: "Data updated",
      error: "Update failed"
    }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Advanced Chart</CardTitle>
          <div className="flex gap-2">
            <AutoRefreshToggle
              enabled={isAutoRefreshEnabled}
              onToggle={toggleAutoRefresh}
              interval={30}
            />
            <RefreshButton
              onRefresh={refresh}
              isLoading={isLoading}
              lastUpdated={lastUpdated}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart with data */}
      </CardContent>
    </Card>
  )
}
```

### Example 3: Refresh with Dependencies

```typescript
const [filter, setFilter] = useState("all")
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

const fetchData = useCallback(async () => {
  try {
    setLoading(true)
    const response = await fetch(`/api/data?filter=${filter}`)
    const result = await response.json()
    setData(result.data)
    setLastUpdated(new Date())
  } finally {
    setLoading(false)
  }
}, [filter])

// Refresh when filter changes
useEffect(() => {
  fetchData()
}, [fetchData])

return (
  <div>
    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
      <option value="all">All</option>
      <option value="recent">Recent</option>
    </select>
    <RefreshButton
      onRefresh={fetchData}
      isLoading={loading}
      lastUpdated={lastUpdated}
    />
  </div>
)
```

---

## Charts with Refresh Functionality

### ✅ Implemented

1. **India Map (State Capacity)**
   - Manual refresh button
   - Last updated timestamp
   - Toast notifications

2. **DMO Charts**
   - Generator/Storage Scheduling
   - Contract-wise Scheduling
   - Market Bidding
   - All with refresh buttons and timestamps

### 📋 Pattern Available For

The refresh components are ready to be added to:

- Installed Capacity Charts
- Generation Charts
- Storage Charts
- Analytics Charts
- RMO Charts
- Transmission Charts
- Consumption Charts
- KPI Grid
- Any custom charts

---

## API Reference

### RefreshButton Props

```typescript
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
```

### UseDataRefreshOptions

```typescript
interface UseDataRefreshOptions<T> {
  fetchData: () => Promise<T>
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  autoRefresh?: boolean
  refreshInterval?: number
  showToasts?: boolean
  toastMessages?: {
    success?: string
    error?: string
  }
}
```

### UseDataRefreshReturn

```typescript
interface UseDataRefreshReturn<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  lastUpdated: Date | null
  refresh: () => Promise<void>
  setData: (data: T) => void
  isAutoRefreshEnabled: boolean
  toggleAutoRefresh: () => void
}
```

---

## Styling & Customization

### Button Variants

```typescript
// Outline (default)
<RefreshButton variant="outline" />

// Solid
<RefreshButton variant="default" />

// Ghost
<RefreshButton variant="ghost" />

// Secondary
<RefreshButton variant="secondary" />
```

### Button Sizes

```typescript
// Small (default for charts)
<RefreshButton size="sm" />

// Default
<RefreshButton size="default" />

// Large
<RefreshButton size="lg" />

// Icon only
<RefreshButton size="icon" showLabel={false} showTimestamp={false} />
```

### Custom Styling

```typescript
<RefreshButton
  className="my-custom-class"
  // ... other props
/>
```

---

## Best Practices

### 1. Always Set lastUpdated

```typescript
// ✅ Good
const fetchData = async () => {
  const data = await fetch('/api/data')
  setData(data)
  setLastUpdated(new Date()) // Set timestamp
}

// ❌ Bad
const fetchData = async () => {
  const data = await fetch('/api/data')
  setData(data)
  // Missing timestamp
}
```

### 2. Handle Loading States

```typescript
// ✅ Good
const fetchData = async () => {
  setLoading(true)
  try {
    await fetchDataFromAPI()
  } finally {
    setLoading(false) // Always reset
  }
}

// ❌ Bad
const fetchData = async () => {
  setLoading(true)
  await fetchDataFromAPI()
  // Loading never reset on error
}
```

### 3. Provide User Feedback

```typescript
// ✅ Good - Show toast on success and error
const fetchData = async () => {
  try {
    await fetch('/api/data')
    toast.success("Data refreshed")
  } catch (error) {
    toast.error("Refresh failed", error.message)
  }
}

// ❌ Bad - Silent failure
const fetchData = async () => {
  try {
    await fetch('/api/data')
  } catch (error) {
    console.error(error) // User doesn't know
  }
}
```

### 4. Don't Over-Refresh

```typescript
// ✅ Good - Reasonable interval
useDataRefresh({
  fetchData,
  refreshInterval: 30000 // 30 seconds
})

// ❌ Bad - Too frequent
useDataRefresh({
  fetchData,
  refreshInterval: 1000 // 1 second - excessive
})
```

### 5. Clean Up Intervals

```typescript
// ✅ Good - Hook handles cleanup
useDataRefresh({ ... })

// ❌ Bad - Manual interval without cleanup
useEffect(() => {
  const interval = setInterval(fetchData, 30000)
  // Missing: return () => clearInterval(interval)
}, [])
```

---

## Troubleshooting

### Issue: Refresh button doesn't work

**Solutions**:
- Check `onRefresh` function is async/returns Promise
- Verify API endpoint is correct
- Check for console errors
- Ensure component is not unmounted during fetch

### Issue: Last updated time doesn't show

**Solutions**:
- Ensure `lastUpdated` prop is passed
- Set `setLastUpdated(new Date())` after fetch
- Check `showTimestamp` prop is true

### Issue: Toast doesn't appear

**Solutions**:
- Verify ToastProvider wraps component
- Import useToast hook correctly
- Check toast function is called
- Ensure no errors before toast call

### Issue: Auto-refresh doesn't stop

**Solutions**:
- Component may have memory leak
- Use useDataRefresh hook (handles cleanup)
- Manually clear interval on unmount

---

## Performance Considerations

### Optimizations

1. **Debounce Rapid Clicks**
   - RefreshButton prevents clicks during loading
   - Use `disabled` prop when needed

2. **Cancel In-Flight Requests**
   - Use AbortController for fetch
   - Cancel on component unmount

3. **Memoize Fetch Functions**
   - Use useCallback for fetchData
   - Prevent unnecessary re-renders

4. **Conditional Rendering**
   - Show loading skeleton during fetch
   - Prevent layout shift

### Example with AbortController

```typescript
const fetchData = useCallback(async () => {
  const controller = new AbortController()
  
  try {
    setLoading(true)
    const response = await fetch('/api/data', {
      signal: controller.signal
    })
    const data = await response.json()
    setData(data)
    setLastUpdated(new Date())
  } catch (error) {
    if (error.name !== 'AbortError') {
      toast.error("Refresh failed", error.message)
    }
  } finally {
    setLoading(false)
  }
  
  return () => controller.abort()
}, [])
```

---

## Future Enhancements

### Planned Features
- [ ] Smart refresh (only when data changed)
- [ ] Refresh progress percentage
- [ ] Batch refresh for multiple charts
- [ ] Offline detection and queue
- [ ] Refresh history/audit log
- [ ] Custom refresh intervals per chart
- [ ] Refresh on visibility change
- [ ] Network-aware refresh (pause on slow connection)

### Potential Improvements
- Add pull-to-refresh on mobile
- Keyboard shortcut (Ctrl+R)
- Sound/haptic feedback on refresh
- Prefetch on hover
- Background refresh with notification
- Diff viewer (show what changed)

---

## Related Documentation

- **Error Handling**: `docs/ERROR_HANDLING.md`
- **Toast Notifications**: `docs/ERROR_HANDLING.md#toast-notification-system`
- **Batch Export**: `docs/BATCH_EXPORT.md`

---

## Support

For issues with refresh functionality:
1. Check component has proper state management
2. Verify API endpoints are working
3. Review console for errors
4. Check ToastProvider is properly configured

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: ✅ Production Ready

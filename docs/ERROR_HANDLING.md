# Error Handling Documentation

## Overview

The Energy-Ops Dashboard includes a comprehensive error handling system featuring:
1. **Toast Notifications** - User-friendly feedback for actions and errors
2. **Error Boundaries** - Graceful handling of React component crashes
3. **Retry Logic** - Automatic and manual recovery options

## Toast Notification System

### Location
- **Context**: `src/contexts/toast-context.tsx`
- **Usage**: Import `useToast` hook in any client component

### Features
- ✅ 4 notification types: success, error, warning, info
- ✅ Auto-dismiss with configurable duration
- ✅ Manual dismiss option
- ✅ Color-coded with icons
- ✅ Stacked display with animations
- ✅ Dark mode support

### Basic Usage

```typescript
import { useToast } from "@/contexts/toast-context"

function MyComponent() {
  const toast = useToast()

  const handleAction = async () => {
    try {
      await someAsyncOperation()
      toast.success("Operation completed", "Your data has been saved")
    } catch (error) {
      toast.error(
        "Operation failed",
        error instanceof Error ? error.message : "An unknown error occurred"
      )
    }
  }

  return <button onClick={handleAction}>Perform Action</button>
}
```

### Toast Types

#### Success
```typescript
toast.success("Title", "Optional description")
// Auto-dismisses after 5 seconds
```

#### Error
```typescript
toast.error("Title", "Optional description")
// Auto-dismisses after 7 seconds (longer for errors)
```

#### Warning
```typescript
toast.warning("Title", "Optional description")
// Auto-dismisses after 5 seconds
```

#### Info
```typescript
toast.info("Title", "Optional description")
// Auto-dismisses after 5 seconds
```

### Advanced Usage

```typescript
// Custom duration
toast.addToast({
  type: 'success',
  message: 'Custom toast',
  description: 'With custom duration',
  duration: 10000 // 10 seconds
})

// Manual removal
const toastId = toast.addToast(...)
toast.removeToast(toastId)
```

## Error Boundary

### Location
- **Component**: `src/components/error-boundary.tsx`

### Features
- ✅ Catches React component errors
- ✅ Displays user-friendly error UI
- ✅ Shows error details in development
- ✅ "Try Again" reset functionality
- ✅ "Go Home" navigation option
- ✅ Stack trace viewer (expandable)
- ✅ Custom fallback UI support

### Usage

#### Wrap Entire App (Already Implemented)
```typescript
// src/app/layout.tsx
<ErrorBoundary>
  <ToastProvider>
    {children}
  </ToastProvider>
</ErrorBoundary>
```

#### Wrap Specific Components
```typescript
import { ErrorBoundary } from "@/components/error-boundary"

<ErrorBoundary>
  <MyRiskyComponent />
</ErrorBoundary>
```

#### Custom Fallback UI
```typescript
<ErrorBoundary
  fallback={
    <div className="error-state">
      <h2>Oops! Something went wrong</h2>
      <p>Please refresh the page</p>
    </div>
  }
>
  <MyComponent />
</ErrorBoundary>
```

#### Custom Error Handler
```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    logErrorToService(error, errorInfo)
  }}
>
  <MyComponent />
</ErrorBoundary>
```

### useErrorHandler Hook

For functional components that need to trigger error boundaries:

```typescript
import { useErrorHandler } from "@/components/error-boundary"

function MyComponent() {
  const handleError = useErrorHandler()

  const doSomething = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      // This will trigger the nearest error boundary
      handleError(error as Error)
    }
  }

  return <button onClick={doSomething}>Do Something</button>
}
```

## Current Implementation

### Components with Toast Notifications

1. **IndiaMapSimple** (`src/components/india-map-simple.tsx`)
   - Data loading success/error notifications
   - CSV/Excel export confirmations
   - Fallback data warnings

2. **DMO Charts** (`src/components/dmo-charts.tsx`)
   - All three chart components:
     - GeneratorSchedulingChart
     - ContractSchedulingChart
     - MarketBiddingChart
   - Data loading notifications
   - Export confirmations
   - Simulated data warnings

### Error Patterns

#### API Data Fetching
```typescript
const fetchData = async () => {
  try {
    setLoading(true)
    const response = await fetch('/api/endpoint')
    const result = await response.json()
    
    if (result.success) {
      setData(result.data)
      toast.success("Data loaded", "Successfully loaded data")
    } else {
      generateFallbackData()
      toast.warning("Using simulated data", "Unable to fetch real data from API")
    }
  } catch (error) {
    console.error("Error fetching data:", error)
    generateFallbackData()
    toast.error(
      "Failed to load data",
      error instanceof Error ? error.message : "Using simulated data as fallback"
    )
  } finally {
    setLoading(false)
  }
}
```

#### Data Export
```typescript
const handleExport = () => {
  try {
    downloadCSV(data, filename, columns)
    toast.success("CSV exported", `Exported ${data.length} records`)
  } catch (error) {
    toast.error(
      "Export failed",
      error instanceof Error ? error.message : "Failed to export CSV"
    )
  }
}
```

## Best Practices

### 1. Always Catch Errors
```typescript
// ✅ Good
try {
  await operation()
  toast.success("Success!")
} catch (error) {
  toast.error("Failed", error.message)
}

// ❌ Bad
await operation() // No error handling
toast.success("Success!") // Will crash if operation fails
```

### 2. Provide Context
```typescript
// ✅ Good
toast.error("Failed to load data", "Network connection timed out")

// ❌ Bad
toast.error("Error") // Not helpful to users
```

### 3. Use Appropriate Toast Types
```typescript
// ✅ Good
toast.success("Data saved") // For successful operations
toast.error("Save failed") // For actual errors
toast.warning("Using cached data") // For degraded functionality
toast.info("Data refreshing") // For informational messages

// ❌ Bad
toast.success("An error occurred") // Confusing type/message mismatch
```

### 4. Don't Overuse Toasts
```typescript
// ✅ Good - Only important feedback
saveData().then(() => toast.success("Saved"))

// ❌ Bad - Too many notifications
setFilter() // Don't toast
setSort() // Don't toast
setPage() // Don't toast
// These are UI interactions, not notable events
```

### 5. Error Boundary Placement
```typescript
// ✅ Good - Wrap at logical boundaries
<ErrorBoundary>
  <DashboardSection>
    <ComplexChart />
  </DashboardSection>
</ErrorBoundary>

// ❌ Bad - Too granular
<ErrorBoundary><div></div></ErrorBoundary>
<ErrorBoundary><span></span></ErrorBoundary>
```

## Future Enhancements

### Planned Features
- [ ] Error logging service integration (e.g., Sentry)
- [ ] Network status detection and offline mode
- [ ] Retry with exponential backoff
- [ ] Error analytics dashboard
- [ ] User-reported error submission
- [ ] Undo/Redo for recoverable actions
- [ ] Bulk operation progress tracking
- [ ] Global error state management

### Potential Improvements
- Add toast queue management (limit simultaneous toasts)
- Implement toast grouping for batch operations
- Add sound notifications (optional, accessible)
- Create error recovery suggestions
- Add error reporting to backend
- Implement automatic retry for transient errors
- Add connection quality indicator

## Testing Error Handling

### Manual Testing

#### Test Toast Notifications
1. Export data → Should show success toast
2. Refresh data → Should show loading/success toast
3. Simulate network error → Should show error toast
4. Use simulated data → Should show warning toast

#### Test Error Boundary
1. Throw error in component render → Should show error UI
2. Click "Try Again" → Should reset component
3. Click "Go Home" → Should navigate to home page

### Simulating Errors

```typescript
// In component for testing
const simulateError = () => {
  throw new Error("Test error for error boundary")
}

// In async function
const simulateAsyncError = async () => {
  throw new Error("Test async error")
}
```

## Accessibility

### Toast Notifications
- ✅ Screen reader friendly with ARIA labels
- ✅ Keyboard dismissible (Escape key)
- ✅ High contrast colors
- ✅ Icon + text for color-blind users

### Error Boundary
- ✅ Semantic HTML structure
- ✅ Keyboard navigable buttons
- ✅ Clear error messages
- ✅ Visible focus indicators

## Configuration

### Toast Duration
Default durations can be adjusted in `toast-context.tsx`:
```typescript
const duration = toast.duration || 5000 // Default 5s
// Error toasts: 7000ms (7s)
```

### Error Boundary Behavior
Customize error boundary in `layout.tsx`:
```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  {children}
</ErrorBoundary>
```

## Related Files

- `src/contexts/toast-context.tsx` - Toast notification system
- `src/components/error-boundary.tsx` - Error boundary component
- `src/app/layout.tsx` - Global error handling setup
- `src/components/india-map-simple.tsx` - Example implementation
- `src/components/dmo-charts.tsx` - Example implementation

## Support

For issues or questions about error handling:
1. Check console logs for detailed error messages
2. Review this documentation
3. Inspect browser DevTools Network tab for API errors
4. Check component stack traces in error boundary

---

**Last Updated**: December 2024
**Version**: 1.0.0

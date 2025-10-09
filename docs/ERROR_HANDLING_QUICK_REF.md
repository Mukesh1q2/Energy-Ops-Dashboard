# Error Handling Quick Reference

## Toast Notifications - Cheat Sheet

### Import
```typescript
import { useToast } from "@/contexts/toast-context"
```

### Hook Usage
```typescript
const toast = useToast()
```

### Basic Calls

#### Success ✅
```typescript
toast.success("Title", "Optional description")
```

#### Error ❌
```typescript
toast.error("Title", "Optional description")
```

#### Warning ⚠️
```typescript
toast.warning("Title", "Optional description")
```

#### Info ℹ️
```typescript
toast.info("Title", "Optional description")
```

---

## Common Patterns

### Pattern 1: API Data Fetch
```typescript
const fetchData = async () => {
  try {
    setLoading(true)
    const response = await fetch('/api/endpoint')
    const result = await response.json()
    
    if (result.success) {
      setData(result.data)
      toast.success("Data loaded", `Loaded ${result.data.length} items`)
    } else {
      toast.warning("Using cached data", "API returned no data")
    }
  } catch (error) {
    toast.error(
      "Failed to load data",
      error instanceof Error ? error.message : "Unknown error"
    )
  } finally {
    setLoading(false)
  }
}
```

### Pattern 2: Export Operation
```typescript
const handleExport = () => {
  try {
    downloadCSV(data, filename, columns)
    toast.success("Export completed", `Exported ${data.length} records`)
  } catch (error) {
    toast.error("Export failed", error instanceof Error ? error.message : "Unknown error")
  }
}
```

### Pattern 3: Form Submission
```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    await saveData(formData)
    toast.success("Saved successfully", "Your changes have been saved")
    router.push('/dashboard')
  } catch (error) {
    toast.error("Save failed", error instanceof Error ? error.message : "Please try again")
  }
}
```

### Pattern 4: Delete Operation
```typescript
const handleDelete = async (id: string) => {
  try {
    await deleteItem(id)
    toast.success("Deleted", "Item removed successfully")
    refetch()
  } catch (error) {
    toast.error("Delete failed", "Unable to delete item")
  }
}
```

---

## Error Boundary

### Import
```typescript
import { ErrorBoundary } from "@/components/error-boundary"
```

### Wrap Components
```typescript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### With Custom Fallback
```typescript
<ErrorBoundary
  fallback={<CustomErrorUI />}
>
  <YourComponent />
</ErrorBoundary>
```

### With Error Handler
```typescript
<ErrorBoundary
  onError={(error, errorInfo) => {
    logToService(error)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### useErrorHandler Hook
```typescript
import { useErrorHandler } from "@/components/error-boundary"

function MyComponent() {
  const handleError = useErrorHandler()
  
  const doSomething = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      handleError(error as Error) // Triggers error boundary
    }
  }
}
```

---

## Best Practices ✨

### ✅ DO

- Provide meaningful error messages
- Include context in descriptions
- Use appropriate toast types
- Wrap risky components with ErrorBoundary
- Handle errors gracefully with fallbacks

### ❌ DON'T

- Don't overuse toasts for every action
- Don't use generic messages like "Error"
- Don't ignore errors silently
- Don't block UI with modals for non-critical errors
- Don't forget to handle loading states

---

## Toast Durations

| Type    | Duration | Color  |
|---------|----------|--------|
| Success | 5s       | Green  |
| Error   | 7s       | Red    |
| Warning | 5s       | Yellow |
| Info    | 5s       | Blue   |

---

## Component Checklist

When adding error handling to a component:

- [ ] Import `useToast` hook
- [ ] Add try-catch blocks to async operations
- [ ] Show success toast on success
- [ ] Show error toast on failure
- [ ] Provide fallback behavior
- [ ] Add loading states
- [ ] Test error scenarios
- [ ] Consider wrapping in ErrorBoundary

---

## Examples by Use Case

### Data Loading
```typescript
✅ toast.success("Data loaded", "Loaded 18 states")
✅ toast.warning("Using cached data", "API unavailable")
❌ toast.error("Network error", "Failed to connect")
```

### Exports
```typescript
✅ toast.success("CSV exported", "Downloaded report.csv")
✅ toast.success("Excel exported", "Downloaded report.xlsx")
❌ toast.error("Export failed", "Insufficient permissions")
```

### User Actions
```typescript
✅ toast.success("Settings saved", "Preferences updated")
✅ toast.info("Processing", "This may take a few moments")
⚠️ toast.warning("Unsaved changes", "Changes not saved yet")
```

### System Status
```typescript
ℹ️ toast.info("Connecting", "Establishing connection...")
✅ toast.success("Connected", "Database connection established")
❌ toast.error("Connection lost", "Reconnecting...")
```

---

## Keyboard Shortcuts

| Key       | Action                    |
|-----------|---------------------------|
| ESC       | Dismiss focused toast     |
| Click X   | Dismiss specific toast    |
| Auto      | Dismiss after timeout     |

---

## Accessibility

- ✅ Screen reader announcements
- ✅ Keyboard navigation
- ✅ High contrast colors
- ✅ Icon + text for clarity
- ✅ ARIA labels

---

## Debugging

### Check toast is showing
```typescript
console.log('Showing toast')
toast.success("Test", "If you see this, it works!")
```

### Log errors
```typescript
catch (error) {
  console.error('Error details:', error)
  toast.error("Error", error.message)
}
```

### Test error boundary
```typescript
// Temporarily add to component
throw new Error("Test error boundary")
```

---

## Need More Help?

- Full docs: `docs/ERROR_HANDLING.md`
- Implementation: `docs/TASK_6_ERROR_HANDLING_SUMMARY.md`
- Code: `src/contexts/toast-context.tsx`
- Examples: `src/components/india-map-simple.tsx`

---

**Quick Start**: Just add `const toast = useToast()` and call `toast.success()` or `toast.error()`!

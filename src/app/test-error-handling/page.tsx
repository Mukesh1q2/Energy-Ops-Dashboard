"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/contexts/toast-context"
import { ErrorBoundary, useErrorHandler } from "@/components/error-boundary"
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Bug,
  Zap,
  Download,
  RefreshCw
} from "lucide-react"

export default function TestErrorHandlingPage() {
  const toast = useToast()
  const [loadingState, setLoadingState] = useState<string>("")

  const testSuccess = () => {
    toast.success("Success notification", "This is a success message with details")
  }

  const testError = () => {
    toast.error("Error notification", "This is an error message that stays longer")
  }

  const testWarning = () => {
    toast.warning("Warning notification", "This is a warning message")
  }

  const testInfo = () => {
    toast.info("Info notification", "This is an informational message")
  }

  const testMultiple = () => {
    toast.success("First notification", "Success message")
    setTimeout(() => toast.warning("Second notification", "Warning message"), 300)
    setTimeout(() => toast.info("Third notification", "Info message"), 600)
  }

  const testDataLoad = async () => {
    setLoadingState("loading")
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const success = Math.random() > 0.3
      
      if (success) {
        toast.success("Data loaded", "Successfully loaded 150 records")
        setLoadingState("success")
      } else {
        throw new Error("Network timeout")
      }
    } catch (error) {
      toast.error(
        "Failed to load data",
        error instanceof Error ? error.message : "Unknown error occurred"
      )
      setLoadingState("error")
    } finally {
      setTimeout(() => setLoadingState(""), 2000)
    }
  }

  const testExport = () => {
    try {
      // Simulate export
      const success = Math.random() > 0.2
      if (!success) throw new Error("Insufficient permissions")
      
      toast.success("Export completed", "Downloaded report.csv with 1,250 rows")
    } catch (error) {
      toast.error(
        "Export failed",
        error instanceof Error ? error.message : "Failed to export file"
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Error Handling Test Suite
          </h1>
          <p className="text-muted-foreground">
            Test all toast notifications and error boundaries
          </p>
          <Badge variant="outline" className="mt-2">
            Development Only
          </Badge>
        </div>

        {/* Basic Toast Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Basic Toast Notifications
            </CardTitle>
            <CardDescription>
              Test different toast notification types
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={testSuccess} variant="outline" className="w-full">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Success
            </Button>
            <Button onClick={testError} variant="outline" className="w-full">
              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
              Error
            </Button>
            <Button onClick={testWarning} variant="outline" className="w-full">
              <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
              Warning
            </Button>
            <Button onClick={testInfo} variant="outline" className="w-full">
              <Info className="w-4 h-4 mr-2 text-blue-500" />
              Info
            </Button>
          </CardContent>
        </Card>

        {/* Advanced Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Scenarios</CardTitle>
            <CardDescription>
              Test real-world use cases with toast notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button onClick={testMultiple} variant="outline" className="w-full">
                Multiple Toasts
              </Button>
              <Button 
                onClick={testDataLoad} 
                variant="outline" 
                className="w-full"
                disabled={loadingState === "loading"}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingState === "loading" ? "animate-spin" : ""}`} />
                Simulate Data Load
              </Button>
              <Button onClick={testExport} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Simulate Export
              </Button>
            </div>
            
            {loadingState && (
              <div className="p-4 rounded-lg bg-muted text-sm">
                Status: <Badge variant={
                  loadingState === "loading" ? "secondary" :
                  loadingState === "success" ? "default" : "destructive"
                }>{loadingState}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Boundary Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-red-500" />
              Error Boundary Tests
            </CardTitle>
            <CardDescription>
              Test React error boundary functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These components will throw errors to test error boundary recovery
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Error Boundary Test 1 */}
              <ErrorBoundary>
                <ErrorTestComponent1 />
              </ErrorBoundary>
              
              {/* Error Boundary Test 2 */}
              <ErrorBoundary>
                <ErrorTestComponent2 />
              </ErrorBoundary>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-600 dark:text-blue-400">
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <p>✅ Click buttons to trigger different toast notifications</p>
            <p>✅ Toast notifications appear in the bottom-right corner</p>
            <p>✅ Toasts auto-dismiss after 5-7 seconds (errors stay longer)</p>
            <p>✅ Click the X button to dismiss toasts manually</p>
            <p>✅ Error boundary tests show recovery UI when errors occur</p>
            <p>✅ Click "Try Again" in error UI to reset component</p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="py-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Test Components that throw errors
function ErrorTestComponent1() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error("Test error from ErrorTestComponent1")
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">Error Test Component 1</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Click button to trigger error
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShouldError(true)}
          className="w-full"
        >
          Throw Error
        </Button>
      </CardContent>
    </Card>
  )
}

function ErrorTestComponent2() {
  const [shouldError, setShouldError] = useState(false)
  const handleError = useErrorHandler()

  const triggerAsyncError = async () => {
    try {
      await new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Async error from ErrorTestComponent2")), 500)
      )
    } catch (error) {
      handleError(error as Error)
    }
  }

  if (shouldError) {
    throw new Error("Sync error from ErrorTestComponent2")
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="text-sm">Error Test Component 2</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Test sync and async errors
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShouldError(true)}
          className="w-full"
        >
          Sync Error
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={triggerAsyncError}
          className="w-full"
        >
          Async Error
        </Button>
      </CardContent>
    </Card>
  )
}

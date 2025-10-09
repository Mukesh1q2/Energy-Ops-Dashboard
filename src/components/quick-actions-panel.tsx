"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Upload, 
  Zap, 
  BarChart3, 
  FileText, 
  Download, 
  Search,
  ArrowRight,
  TrendingUp,
  Battery,
  Play,
  Activity,
  Power
} from "lucide-react"
import { ChartCreationDialog } from "./chart-creation-dialog"
import { ExportDialog } from "./export-dialog"
import { GlobalSearch } from "./global-search"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  onClick: () => void
  shortcut?: string
  color: string
}

export function QuickActionsPanel() {
  const [showChartDialog, setShowChartDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSearchDialog, setShowSearchDialog] = useState(false)

  const handleOptimizationRun = async (type: 'DMO' | 'RMO' | 'SO') => {
    try {
      const response = await fetch('/api/optimization/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      
      const result = await response.json()
      if (result.success) {
        alert(`${type} optimization run started successfully! Run ID: ${result.runId}`)
      } else {
        alert(`Failed to start ${type} optimization: ${result.error}`)
      }
    } catch (error) {
      console.error(`Error triggering ${type} optimization:`, error)
      alert(`Error starting ${type} optimization`)
    }
  }

  const actions: QuickAction[] = [
    {
      id: 'dmo-dashboard',
      title: 'DMO Dashboard',
      description: 'Day-Ahead Market Operations',
      icon: Power,
      onClick: () => window.location.href = '/dmo',
      shortcut: 'Ctrl+D',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    {
      id: 'search',
      title: 'Search Data',
      description: 'Coming Soon',
      icon: Search,
      onClick: () => alert('Coming Soon'),
      color: 'text-gray-600 bg-gray-50 hover:bg-gray-100'
    },
    {
      id: 'reports',
      title: 'View Reports',
      description: 'Coming Soon',
      icon: FileText,
      onClick: () => alert('Coming Soon'),
      color: 'text-green-600 bg-green-50 hover:bg-green-100'
    },
    {
      id: 'daily-ops',
      title: 'Daily Operation Summary',
      description: 'View daily operational insights',
      icon: Activity,
      onClick: () => window.location.href = '/reports?tab=daily',
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
    },
    {
      id: 'weekly-analytics',
      title: 'Weekly Analytics Reports',
      description: 'Comprehensive weekly analysis',
      icon: TrendingUp,
      onClick: () => window.location.href = '/reports?tab=weekly',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'performance-metrics',
      title: 'Performance Metric Dashboard',
      description: 'Real-time performance tracking',
      icon: BarChart3,
      onClick: () => window.location.href = '/analytics',
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    }
  ]

  return (
    <>
      <ChartCreationDialog open={showChartDialog} onOpenChange={setShowChartDialog} />
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
      <GlobalSearch open={showSearchDialog} onOpenChange={setShowSearchDialog} />
      
      <Card>
        <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>
          Shortcuts to common tasks and workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto flex-col items-start p-4 hover:shadow-md transition-all group"
                onClick={action.onClick}
              >
                <div className={`p-2 rounded-lg mb-3 ${action.color} transition-colors`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left w-full">
                  <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {action.description}
                  </p>
                  {action.shortcut && (
                    <kbd className="text-[10px] px-1.5 py-0.5 bg-muted rounded border">
                      {action.shortcut}
                    </kbd>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
    </>
  )
}

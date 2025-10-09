"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface OneClickPlotButtonProps {
  dataSourceId: string
  dashboardId: string
  moduleType: 'dmo' | 'rmo' | 'so'
  onComplete?: () => void
  compact?: boolean
}

export function OneClickPlotButton({
  dataSourceId,
  dashboardId,
  moduleType,
  onComplete,
  compact = false,
}: OneClickPlotButtonProps) {
  const [generating, setGenerating] = useState(false)
  const [lastGeneration, setLastGeneration] = useState<{
    chartCount: number
    timestamp: Date
  } | null>(null)

  const handleGeneratePlots = async () => {
    setGenerating(true)

    try {
      const response = await fetch('/api/dmo/generate-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId,
          dashboardId,
          moduleType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Charts Generated!', {
          description: `Successfully created ${result.chartCount} chart${result.chartCount !== 1 ? 's' : ''}`,
        })

        setLastGeneration({
          chartCount: result.chartCount,
          timestamp: new Date(),
        })

        // Emit custom event for other components to refresh
        window.dispatchEvent(
          new CustomEvent('charts:generated', {
            detail: {
              dataSourceId,
              chartCount: result.chartCount,
            },
          })
        )

        onComplete?.()
      } else {
        toast.error('Failed to generate charts', {
          description: result.error || 'Unknown error occurred',
        })
      }
    } catch (error) {
      console.error('Chart generation error:', error)
      toast.error('Failed to generate charts', {
        description: 'Network or server error occurred',
      })
    } finally {
      setGenerating(false)
    }
  }

  if (compact) {
    return (
      <Button
        onClick={handleGeneratePlots}
        disabled={generating}
        variant="default"
        size="sm"
        className="w-full"
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            One-Click Plot
          </>
        )}
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          One-Click Plot Generator
        </CardTitle>
        <CardDescription>
          Automatically generate all configured charts for {moduleType.toUpperCase()}{' '}
          with proper timeblock axes and filters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Module Type:</span>
            <Badge variant="outline">{moduleType.toUpperCase()}</Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Timeblock Configuration:</span>
            <span className="font-medium">
              {moduleType === 'rmo' ? '48 blocks (30-min)' : '96 blocks (15-min)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Chart Types:</span>
            <span className="font-medium">Price & Volume Analysis</span>
          </div>
        </div>

        {lastGeneration && (
          <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-green-900 dark:text-green-100">
              <CheckCircle className="h-4 w-4" />
              Last Generation Successful
            </div>
            <div className="text-xs text-green-700 dark:text-green-300">
              {lastGeneration.chartCount} chart{lastGeneration.chartCount !== 1 ? 's' : ''} created •{' '}
              {lastGeneration.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleGeneratePlots}
            disabled={generating || !dataSourceId}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Charts...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate All Charts
              </>
            )}
          </Button>

          {!dataSourceId && (
            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Please upload data first to enable chart generation</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
          <p className="font-medium">What will be generated:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-1">
            <li>Timeblock Price Chart (DAM, RTM prices)</li>
            <li>Timeblock Volume Chart (Scheduled, Actual MW)</li>
            <li>Automatic filter configuration from Excel headers</li>
            <li>Proper {moduleType === 'rmo' ? '30-minute' : '15-minute'} interval X-axis</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

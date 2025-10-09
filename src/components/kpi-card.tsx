"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowRight,
  Zap,
  Activity,
  TrendingUp as TrendIcon,
  DollarSign,
  Gauge,
  Cpu,
  CheckCircle,
  Database,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Icon map for dynamic icon selection
const iconMap: Record<string, LucideIcon> = {
  Zap,
  Activity,
  TrendingUp: TrendIcon,
  DollarSign,
  Gauge,
  Cpu,
  CheckCircle,
  Database
}

interface KpiCardProps {
  title: string
  value: number
  unit: string
  change: number
  trend: number[]
  subtitle?: string
  icon?: string
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'teal' | 'indigo' | 'red' | 'yellow'
  href?: string
  onClick?: () => void
}

export function KpiCard({
  title,
  value,
  unit,
  change,
  trend,
  subtitle,
  icon = 'Activity',
  color = 'blue',
  href,
  onClick
}: KpiCardProps) {
  const Icon = iconMap[icon] || Activity
  
  // Color theme mappings
  const colorClasses = {
    blue: {
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
      trend: 'stroke-blue-500',
      card: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600'
    },
    green: {
      badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      icon: 'text-green-600 dark:text-green-400',
      trend: 'stroke-green-500',
      card: 'border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600'
    },
    orange: {
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: 'text-orange-600 dark:text-orange-400',
      trend: 'stroke-orange-500',
      card: 'border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600'
    },
    purple: {
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      icon: 'text-purple-600 dark:text-purple-400',
      trend: 'stroke-purple-500',
      card: 'border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600'
    },
    teal: {
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
      icon: 'text-teal-600 dark:text-teal-400',
      trend: 'stroke-teal-500',
      card: 'border-teal-200 dark:border-teal-800 hover:border-teal-400 dark:hover:border-teal-600'
    },
    indigo: {
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
      icon: 'text-indigo-600 dark:text-indigo-400',
      trend: 'stroke-indigo-500',
      card: 'border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-600'
    },
    red: {
      badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      icon: 'text-red-600 dark:text-red-400',
      trend: 'stroke-red-500',
      card: 'border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600'
    },
    yellow: {
      badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      icon: 'text-yellow-600 dark:text-yellow-400',
      trend: 'stroke-yellow-500',
      card: 'border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600'
    }
  }

  const theme = colorClasses[color]

  // Format large numbers
  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M'
    if (val >= 1000) return (val / 1000).toFixed(2) + 'K'
    if (val % 1 !== 0) return val.toFixed(2)
    return val.toFixed(0)
  }

  // Render sparkline
  const renderSparkline = () => {
    if (!trend || trend.length === 0) return null

    const width = 80
    const height = 30
    const padding = 2
    
    const max = Math.max(...trend)
    const min = Math.min(...trend)
    const range = max - min || 1

    const points = trend.map((val, idx) => {
      const x = (idx / (trend.length - 1)) * (width - 2 * padding) + padding
      const y = height - padding - ((val - min) / range) * (height - 2 * padding)
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width={width} height={height} className="ml-auto">
        <polyline
          points={points}
          fill="none"
          className={theme.trend}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // Render trend indicator
  const renderTrendIndicator = () => {
    const absChange = Math.abs(change)
    const formattedChange = absChange.toFixed(1)

    if (change > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">+{formattedChange}%</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-medium">{formattedChange}%</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <Minus className="h-4 w-4" />
          <span className="text-sm font-medium">0%</span>
        </div>
      )
    }
  }

  const CardWrapper = href ? Link : 'div'
  const cardProps = href ? { href } : onClick ? { onClick, role: 'button', tabIndex: 0 } : {}

  return (
    <CardWrapper {...cardProps}>
      <Card 
        className={cn(
          "transition-all duration-200 hover:shadow-lg",
          theme.card,
          (href || onClick) && "cursor-pointer"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Badge variant="secondary" className={cn("h-8 w-8 rounded-full p-0 flex items-center justify-center", theme.badge)}>
            <Icon className={cn("h-4 w-4", theme.icon)} />
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Main Value */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">
                  {formatValue(value)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {unit}
                </div>
              </div>
              {renderTrendIndicator()}
            </div>

            {/* Sparkline */}
            {trend && trend.length > 0 && (
              <div className="flex items-center justify-between">
                {renderSparkline()}
              </div>
            )}

            {/* Subtitle & Action */}
            <div className="flex items-center justify-between pt-1">
              {subtitle && (
                <p className="text-xs text-muted-foreground">
                  {subtitle}
                </p>
              )}
              {(href || onClick) && (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}

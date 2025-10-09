/**
 * Lazy-loaded components for performance optimization
 * Use dynamic imports to code-split heavy components
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
)

// Chart Components - Lazy loaded
export const LazyGeneratorSchedulingChart = dynamic(
  () => import('@/components/dmo-charts').then(mod => ({ default: mod.GeneratorSchedulingChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyContractSchedulingChart = dynamic(
  () => import('@/components/dmo-charts').then(mod => ({ default: mod.ContractSchedulingChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyMarketBiddingChart = dynamic(
  () => import('@/components/dmo-charts').then(mod => ({ default: mod.MarketBiddingChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyStorageCapacityChart = dynamic(
  () => import('@/components/storage-charts').then(mod => ({ default: mod.StorageCapacityChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyStoragePerformanceChart = dynamic(
  () => import('@/components/storage-charts').then(mod => ({ default: mod.StoragePerformanceChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyPriceTrendsChart = dynamic(
  () => import('@/components/analytics-charts').then(mod => ({ default: mod.PriceTrendsChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyVolumeAnalysisChart = dynamic(
  () => import('@/components/analytics-charts').then(mod => ({ default: mod.VolumeAnalysisChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyPerformanceMetricsChart = dynamic(
  () => import('@/components/analytics-charts').then(mod => ({ default: mod.PerformanceMetricsChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyTransmissionFlowChart = dynamic(
  () => import('@/components/transmission-charts').then(mod => ({ default: mod.TransmissionFlowChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyTransmissionLossesChart = dynamic(
  () => import('@/components/transmission-charts').then(mod => ({ default: mod.TransmissionLossesChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyConsumptionBySectorChart = dynamic(
  () => import('@/components/consumption-charts').then(mod => ({ default: mod.ConsumptionBySectorChart })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyDemandPatternChart = dynamic(
  () => import('@/components/consumption-charts').then(mod => ({ default: mod.DemandPatternChart })),
  { loading: LoadingFallback, ssr: false }
)

// Heavy components - Lazy loaded
export const LazyInteractiveChartGallery = dynamic(
  () => import('@/components/interactive-chart-gallery').then(mod => ({ default: mod.InteractiveChartGallery })),
  { loading: LoadingFallback }
)

export const LazyAIInsightsPanel = dynamic(
  () => import('@/components/ai-insights-panel').then(mod => ({ default: mod.AIInsightsPanel })),
  { loading: LoadingFallback }
)

export const LazyDataQualityDashboard = dynamic(
  () => import('@/components/data-quality-dashboard').then(mod => ({ default: mod.DataQualityDashboard })),
  { loading: LoadingFallback }
)

export const LazySystemHealthMonitor = dynamic(
  () => import('@/components/system-health-monitor').then(mod => ({ default: mod.SystemHealthMonitor })),
  { loading: LoadingFallback }
)

// Data Source Manager - Heavy component
export const LazyDataSourceManager = dynamic(
  () => import('@/components/data-source-manager').then(mod => ({ default: mod.DataSourceManager })),
  { loading: LoadingFallback }
)

export const LazyHeaderMapper = dynamic(
  () => import('@/components/header-mapper').then(mod => ({ default: mod.HeaderMapper })),
  { loading: LoadingFallback }
)

export const LazyRMOOptimizationCharts = dynamic(
  () => import('@/components/rmo-optimization-charts').then(mod => ({ default: mod.RMOOptimizationCharts })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyInstalledCapacityCharts = dynamic(
  () => import('@/components/installed-capacity-charts').then(mod => ({ default: mod.InstalledCapacityCharts })),
  { loading: LoadingFallback, ssr: false }
)

export const LazyGenerationCharts = dynamic(
  () => import('@/components/generation-charts').then(mod => ({ default: mod.GenerationCharts })),
  { loading: LoadingFallback, ssr: false }
)

export const LazySupplyStatusCharts = dynamic(
  () => import('@/components/supply-status-charts').then(mod => ({ default: mod.SupplyStatusCharts })),
  { loading: LoadingFallback, ssr: false }
)

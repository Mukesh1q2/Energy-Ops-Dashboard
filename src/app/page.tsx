"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Power, 
  TrendingUp, 
  Factory, 
  FileText, 
  Download,
  Calendar,
  Map,
  BarChart3,
  Settings,
  ChevronRight,
  Home,
  Activity,
  Database,
  Filter,
  Battery,
  PieChart,
  DollarSign,
  AlertTriangle,
  Zap
} from "lucide-react"
import { DataSourceManager } from "@/components/data-source-manager"
import { DataSourceMenu } from "@/components/data-source-menu";
import { HeaderMapper } from "@/components/header-mapper";
import { RMOOptimizationCharts } from "@/components/rmo-optimization-charts";
import { DynamicFilters } from "@/components/dynamic-filters"
import { InstalledCapacityCharts } from "@/components/installed-capacity-charts";
import { GenerationCharts } from "@/components/generation-charts";
import { SupplyStatusCharts } from "@/components/supply-status-charts";
import { OneClickPlotModal } from "@/components/one-click-plot-modal";
import { 
  GeneratorSchedulingChart, 
  ContractSchedulingChart, 
  MarketBiddingChart 
} from "@/components/dmo-charts"
import { 
  StorageCapacityChart, 
  StoragePerformanceChart 
} from "@/components/storage-charts"
import { 
  PriceTrendsChart, 
  VolumeAnalysisChart, 
  PerformanceMetricsChart 
} from "@/components/analytics-charts"
import { EnhancedAnalyticsForecasting } from "@/components/enhanced-analytics-forecasting"
import { 
  TransmissionFlowChart, 
  TransmissionLossesChart 
} from "@/components/transmission-charts"
import { 
  ConsumptionBySectorChart, 
  DemandPatternChart 
} from "@/components/consumption-charts"
import { KpiGrid } from "@/components/kpi-grid"
import { QuickActionsPanel } from "@/components/quick-actions-panel"
import { RecentActivityFeed } from "@/components/recent-activity-feed"
import { DataQualityDashboard } from "@/components/data-quality-dashboard"
import { SystemHealthMonitor } from "@/components/system-health-monitor"
import { FAQSection } from "@/components/faq-section"
import { NotificationsPanel } from "@/components/notifications-panel"
import { UserMenu } from "@/components/auth/user-menu"
import { AIInsightsPanel } from "@/components/ai-insights-panel"
import { InteractiveChartGallery } from "@/components/interactive-chart-gallery"
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal"
import { DashboardSettingsModal, DashboardSettings } from "@/components/dashboard-settings-modal"
import { ArchivesPage } from "@/components/archives-page"
import { RmoPriceChart, RmoScheduleChart, RmoOptimizationChart } from "@/components/rmo-charts"
import { AdvancedFilterPanel } from "@/components/advanced-filter-panel"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useSocket } from "@/hooks/use-socket"
import { BatchExportDialog } from "@/components/batch-export-dialog"
import type { ExportDataset } from "@/lib/batch-export-utils"
import { formatNumber, formatDateTime } from "@/lib/export-utils"

interface FilterState {
  selectedRegions: string[]
  selectedStates: string[]
  selectedTechnologyTypes: string[]
  selectedUnitNames: string[]
  selectedContractNames: string[]
  selectedContractTypes: string[]
  selectedMarketTypes: string[]
  dateRange: { from: Date | undefined; to: Date | undefined }
}

interface FilterOptions {
  regions: string[]
  states: string[]
  technologyTypes: string[]
  unitNames: string[]
  contractNames: string[]
  contractTypes: string[]
  marketTypes: string[]
}

export default function ElectricityDashboard() {
  const { isConnected, on, off } = useSocket();
  const [activeModule, setActiveModule] = useState("home")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [kpiData, setKpiData] = useState<any>(null)
  const [loadingKpi, setLoadingKpi] = useState(true)
  const [dataSourceToMap, setDataSourceToMap] = useState<string | null>(null);
  const [activeDataSource, setActiveDataSource] = useState<string | null>(null);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings | undefined>(undefined);
  
  const [filters, setFilters] = useState<FilterState>({
    selectedRegions: [],
    selectedStates: [],
    selectedTechnologyTypes: [],
    selectedUnitNames: [],
    selectedContractNames: [],
    selectedContractTypes: [],
    selectedMarketTypes: [],
    dateRange: { from: undefined, to: undefined }
  })

  // Dynamic filter options fetched from actual data
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    regions: [],
    states: [],
    technologyTypes: [],
    unitNames: [],
    contractNames: [],
    contractTypes: [],
    marketTypes: []
  })

  // Fetch dynamic filter options from API
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/dmo/filters?type=all')
      const result = await response.json()
      
      if (result.success) {
        setFilterOptions({
          regions: result.data.regions || [],
          states: result.data.states || [],
          technologyTypes: result.data.technologyTypes || [],
          unitNames: result.data.unitNames || [],
          contractNames: result.data.contractNames || [],
          contractTypes: result.data.contractTypes || [],
          marketTypes: result.data.marketTypes || []
        })
      }
    } catch (error) {
      console.error("Error fetching filter options:", error)
      // Fallback to basic options if API fails
      setFilterOptions({
        regions: ["Northern", "Western", "Southern", "Eastern", "North Eastern"],
        states: ["All India"],
        technologyTypes: ["Coal", "Gas", "Hydro", "Nuclear", "Solar", "Wind", "Biomass", "Storage"],
        unitNames: [],
        contractNames: [],
        contractTypes: ["PPA", "Tender", "Merchant", "REC", "Banking"],
        marketTypes: ["Day-Ahead", "Real-Time", "Term-Ahead", "Ancillary Services"]
      })
    }
  }

  const fetchKpiData = async () => {
    try {
      setLoadingKpi(true)
      const response = await fetch('/api/dashboard/kpi')
      const result = await response.json()
      
      if (result.success) {
        setKpiData(result.data)
      }
    } catch (error) {
      console.error("Error fetching KPI data:", error)
    } finally {
      setLoadingKpi(false)
    }
  }

  useEffect(() => {
    if (activeModule === "home") {
      fetchKpiData()
    }
    // Fetch filter options when component mounts or module changes
    fetchFilterOptions()
  }, [activeModule])
  
  // Listen for real-time WebSocket updates
  useEffect(() => {
    if (isConnected) {
      // Listen for KPI updates
      on('kpi:update', (data: any) => {
        console.log('📊 KPI update received:', data)
        setKpiData(data.data)
      })
      
      // Listen for new notifications
      on('notification:new', (data: any) => {
        console.log('🔔 New notification:', data)
        // Notification panel will handle this automatically
      })
      
      // Listen for system health updates
      on('system-health:update', (data: any) => {
        console.log('💚 System health update:', data)
        // System health monitor will handle this
      })
    }
    
    return () => {
      if (isConnected) {
        off('kpi:update')
        off('notification:new')
        off('system-health:update')
      }
    }
  }, [isConnected, on, off])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleApplyFilters = () => {
    console.log("Applying filters:", filters)
    // Here you would typically trigger data refresh with the new filters
    setShowAdvancedFilters(false)
  }

  const handleClearFilters = () => {
    setFilters({
      selectedRegions: [],
      selectedStates: [],
      selectedTechnologyTypes: [],
      selectedUnitNames: [],
      selectedContractNames: [],
      selectedContractTypes: [],
      selectedMarketTypes: [],
      dateRange: { from: undefined, to: undefined }
    })
    setShowAdvancedFilters(false)
  }

  const modules = [
    { id: "home", name: "Home", icon: Home },
    { id: "dmo", name: "Day-Ahead Market (DMO)", icon: TrendingUp },
    { id: "rmo", name: "Real-Time Market (RMO)", icon: Zap },
    { id: "storage-operations", name: "Storage Operations (SO)", icon: Battery },
    { id: "archives", name: "Archives", icon: FileText },
    { id: "analytics", name: "Analytics", icon: PieChart },
    { id: "sandbox", name: "Sandbox", icon: Database },
    { id: "installed-capacity", name: "Installed Capacity", icon: Factory },
    { id: "generation", name: "Generation", icon: Power },
    // { id: "transmission", name: "Transmission", icon: Map }, // Disabled
    { id: "capacity-addition", name: "Capacity Addition", icon: BarChart3 },
    { id: "consumption", name: "Consumption", icon: TrendingUp },
  ]

  // Helper function to get available datasets for batch export based on active module
  const getBatchExportDatasets = (module: string) => {
    // Common columns used across datasets
    const stateColumns = [
      { key: 'rank', label: 'Rank' },
      { key: 'state', label: 'State' },
      { key: 'capacity_mw', label: 'Capacity (MW)', format: (v: any) => formatNumber(v, 0) },
      { key: 'percentage', label: 'Share (%)', format: (v: any) => formatNumber(v, 2) }
    ]

    const generatorColumns = [
      { key: 'time_period', label: 'Time Period', format: (v: any) => formatDateTime(v) },
      { key: 'technology_type', label: 'Technology' },
      { key: 'plant_name', label: 'Plant Name' },
      { key: 'contract_name', label: 'Contract' },
      { key: 'scheduled_mw', label: 'Scheduled (MW)', format: (v: any) => formatNumber(v, 2) },
      { key: 'actual_mw', label: 'Actual (MW)', format: (v: any) => formatNumber(v || 0, 2) },
      { key: 'region', label: 'Region' },
      { key: 'state', label: 'State' }
    ]

    const contractColumns = [
      { key: 'time_period', label: 'Time Period', format: (v: any) => formatDateTime(v) },
      { key: 'contract_type', label: 'Contract Type' },
      { key: 'contract_name', label: 'Contract Name' },
      { key: 'scheduled_mw', label: 'Scheduled (MW)', format: (v: any) => formatNumber(v, 2) },
      { key: 'actual_mw', label: 'Actual (MW)', format: (v: any) => formatNumber(v || 0, 2) },
      { key: 'cumulative_mw', label: 'Cumulative (MW)', format: (v: any) => formatNumber(v || 0, 2) },
      { key: 'region', label: 'Region' },
      { key: 'state', label: 'State' }
    ]

    const marketColumns = [
      { key: 'time_period', label: 'Time Period', format: (v: any) => formatDateTime(v) },
      { key: 'market_type', label: 'Market Type' },
      { key: 'plant_name', label: 'Plant Name' },
      { key: 'bid_price_rs_per_mwh', label: 'Bid Price (Rs/MWh)', format: (v: any) => formatNumber(v, 2) },
      { key: 'bid_volume_mw', label: 'Bid Volume (MW)', format: (v: any) => formatNumber(v, 2) },
      { key: 'clearing_price_rs_per_mwh', label: 'Clearing Price (Rs/MWh)', format: (v: any) => formatNumber(v || 0, 2) },
      { key: 'cleared_volume_mw', label: 'Cleared Volume (MW)', format: (v: any) => formatNumber(v || 0, 2) },
      { key: 'region', label: 'Region' },
      { key: 'state', label: 'State' }
    ]

    switch (module) {
      case 'dmo':
        return [
          {
            id: 'generator-scheduling',
            name: 'Generator Scheduling',
            description: 'Scheduled vs actual generation by technology and unit',
            recordCount: 192, // 24 hours × 8 technologies
            dataProvider: async (): Promise<ExportDataset> => {
              const response = await fetch('/api/dmo/generator-scheduling')
              const result = await response.json()
              return {
                name: 'generator_scheduling',
                data: result.success ? result.data : [],
                columns: generatorColumns,
                format: 'csv'
              }
            }
          },
          {
            id: 'contract-scheduling',
            name: 'Contract Scheduling',
            description: 'Scheduling data by contract type and name',
            recordCount: 120, // 24 hours × 5 contract types
            dataProvider: async (): Promise<ExportDataset> => {
              const response = await fetch('/api/dmo/contract-scheduling')
              const result = await response.json()
              return {
                name: 'contract_scheduling',
                data: result.success ? result.data : [],
                columns: contractColumns,
                format: 'csv'
              }
            }
          },
          {
            id: 'market-bidding',
            name: 'Market Bidding',
            description: 'Bid price distribution and clearing price trends',
            recordCount: 96, // 24 hours × 4 market types
            dataProvider: async (): Promise<ExportDataset> => {
              const response = await fetch('/api/dmo/market-bidding')
              const result = await response.json()
              return {
                name: 'market_bidding',
                data: result.success ? result.data : [],
                columns: marketColumns,
                format: 'csv'
              }
            }
          }
        ]

      case 'installed-capacity':
        return [
          {
            id: 'state-capacity',
            name: 'State-wise Capacity',
            description: 'Installed capacity distribution across Indian states',
            recordCount: 18,
            dataProvider: async (): Promise<ExportDataset> => {
              const response = await fetch('/api/capacity/states')
              const result = await response.json()
              return {
                name: 'state_capacity',
                data: result.success ? result.data : [],
                columns: stateColumns,
                format: 'csv'
              }
            }
          }
        ]

      case 'home':
        return [
          {
            id: 'kpi-summary',
            name: 'KPI Summary',
            description: 'Key performance indicators and metrics',
            recordCount: 8,
            dataProvider: (): ExportDataset => {
              const kpiItems = kpiData ? Object.entries(kpiData).map(([key, value]) => ({
                metric: key,
                value: value,
                timestamp: new Date().toISOString()
              })) : []
              return {
                name: 'kpi_summary',
                data: kpiItems,
                columns: [
                  { key: 'metric', label: 'Metric' },
                  { key: 'value', label: 'Value' },
                  { key: 'timestamp', label: 'Timestamp', format: (v: any) => formatDateTime(v) }
                ],
                format: 'csv'
              }
            }
          }
        ]

      default:
        return [
          {
            id: 'dashboard-data',
            name: 'Dashboard Data',
            description: 'General dashboard data export',
            recordCount: 0,
            dataProvider: (): ExportDataset => ({
              name: 'dashboard_data',
              data: [],
              columns: [],
              format: 'csv'
            })
          }
        ]
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Power className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">OptiBid Dashboard</h1>
              <p className="text-sm text-muted-foreground">Power Market Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              if (module.id === 'sandbox') {
                return (
                  <Button
                    key={module.id}
                    variant={activeModule === module.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/sandbox'}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {module.name}
                  </Button>
                );
              }
              return (
                <Button
                  key={module.id}
                  variant={activeModule === module.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveModule(module.id)}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {module.name}
                  {activeModule === module.id && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Dynamic Filters
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <div>
            <h2 className="text-2xl font-bold">
              {modules.find(m => m.id === activeModule)?.name || "Dashboard"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {filters.selectedRegions.length > 0 && `Regions: ${filters.selectedRegions.join(", ")}`}
              {filters.selectedStates.length > 0 && `States: ${filters.selectedStates.join(", ")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Live
              </Badge>
            )}
            <NotificationsPanel />
            <UserMenu />
            <BatchExportDialog 
              availableDatasets={getBatchExportDatasets(activeModule)}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: activeModule === 'sandbox' && activeDataSource ? 'datasource' : 'dashboard',
                      format: 'csv',
                      data_source_id: activeDataSource
                    })
                  })
                  
                  if (response.ok) {
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `export_${new Date().toISOString().split('T')[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } else {
                    const error = await response.json()
                    alert(`Export failed: ${error.error || 'Unknown error'}`)
                  }
                } catch (error) {
                  console.error('Export error:', error)
                  alert('Failed to export data')
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeDataSource && (
            <div className="flex justify-end mb-4">
              <Button onClick={() => setIsPlotModalOpen(true)}>One-Click Plot</Button>
            </div>
          )}

          {isPlotModalOpen && activeDataSource && (
            <OneClickPlotModal
              isOpen={isPlotModalOpen}
              onClose={() => setIsPlotModalOpen(false)}
              dataSourceId={activeDataSource}
            />
          )}

          {/* Dynamic Filters Modal */}
          {activeDataSource && (
            <DynamicFilters
              dataSourceId={activeDataSource}
              onFilterChange={handleFiltersChange}
            />
          )}

          {activeModule === "home" && (
            <div className="space-y-8">
              {/* Enhanced Welcome Header with Gradient */}
              <div className="text-center space-y-4 py-8">
                <div className="inline-block">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                    OptiBid Command Center
                  </h1>
                  <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full animate-pulse"></div>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Optimization for Day-Ahead, Real-Time & Storage Markets
                </p>
                <p className="text-sm text-muted-foreground max-w-3xl mx-auto italic">
                  Engineered for optimal bidding strategies, intelligent dispatch scheduling, and real-time decision support for energy market operations.
                </p>
              </div>
              {/* Quick Actions + Recent Activity - Phase 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <div className="lg:col-span-2">
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <QuickActionsPanel />
                  </div>
                </div>
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <RecentActivityFeed />
                </div>
              </div>
              
              {/* Data Quality + System Health - Phase 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <DataQualityDashboard />
                </div>
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                  <SystemHealthMonitor />
                </div>
              </div>
              
              {/* FAQ Section */}
              <div className="animate-slide-up" style={{animationDelay: '0.3s'}}>
                <FAQSection />
              </div>
              
              {/* Footer with Stats */}
              <div className="pt-8 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                    <div className="text-sm text-muted-foreground">Monitoring</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">Real-time</div>
                    <div className="text-sm text-muted-foreground">Updates</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">8 KPIs</div>
                    <div className="text-sm text-muted-foreground">Tracked</div>
                  </div>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">Advanced</div>
                    <div className="text-sm text-muted-foreground">Analytics</div>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Developed by <span className="font-semibold text-primary">Piyush Thukral</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    © {new Date().getFullYear()} OptiBid Command Center. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeModule === "dmo" && (
            <div className="space-y-6">
              {/* Header with logo and schedule info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Power className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Day-Ahead Market Operations</h3>
                    <p className="text-sm text-muted-foreground">Real-time market scheduling and bidding data</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Scheduled Run: 22-09-2025, 10:15 AM</div>
                  <div className="text-sm text-muted-foreground">Next Run Scheduled: 23-09-2025, 10 AM</div>
                </div>
              </div>

              {/* DMO Charts */}
              <div className="grid grid-cols-1 gap-6">
                <GeneratorSchedulingChart />
                <ContractSchedulingChart />
                <MarketBiddingChart />
              </div>
            </div>
          )}

          {activeModule === "rmo" && (
            <div className="space-y-6">
              {/* Header with logo and schedule info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Real-Time Market Operations</h3>
                    <p className="text-sm text-muted-foreground">Live market pricing and dispatch optimization</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Run: 22-09-2025, 10:15 AM</div>
                  <div className="text-sm text-muted-foreground">Status: Active</div>
                </div>
              </div>

              {/* RMO Filters */}
              <AdvancedFilterPanel
                module="rmo"
                onFiltersChange={handleFiltersChange}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />

              {/* RMO Charts */}
              <div className="grid grid-cols-1 gap-6">
                <RmoPriceChart />
                <RmoScheduleChart />
                <RmoOptimizationChart />
              </div>
            </div>
          )}

          {activeModule === "archives" && (
            <ArchivesPage />
          )}

          {activeModule === "sandbox" && (
            <div className="space-y-6">
              {dataSourceToMap ? (
                <>
                  <HeaderMapper dataSourceId={dataSourceToMap} />
                  <RMOOptimizationCharts dataSourceId={dataSourceToMap} />
                </>
              ) : (
                <DataSourceManager />
              )}
            </div>
          )}

          {activeModule === "storage-operations" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Battery className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Storage Operations</h3>
                    <p className="text-sm text-muted-foreground">Battery storage and energy management systems</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Updated: 22-09-2025, 10:15 AM</div>
                  <div className="text-sm text-muted-foreground">Next Update: 23-09-2025, 10 AM</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <StorageCapacityChart />
                <StoragePerformanceChart />
              </div>
            </div>
          )}

          {activeModule === "analytics" && (
            <EnhancedAnalyticsForecasting />
          )}

      {activeModule === "transmission" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Map className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Transmission Operations</h3>
                    <p className="text-sm text-muted-foreground">Power transmission network analysis and monitoring</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Updated: 22-09-2025, 10:15 AM</div>
                  <div className="text-sm text-muted-foreground">Next Update: 23-09-2025, 10 AM</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <TransmissionFlowChart />
                <TransmissionLossesChart />
              </div>
            </div>
          )}

          {activeModule === "consumption" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Power Consumption Analysis</h3>
                    <p className="text-sm text-muted-foreground">Electricity consumption patterns and demand forecasting</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Updated: 22-09-2025, 10:15 AM</div>
                  <div className="text-sm text-muted-foreground">Next Update: 23-09-2025, 10 AM</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <ConsumptionBySectorChart />
                <DemandPatternChart />
              </div>
            </div>
          )}

          {activeModule === "installed-capacity" && <InstalledCapacityCharts />}

          {activeModule === "generation" && <GenerationCharts />}

          {activeModule === "capacity-addition" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Capacity Addition Tracking</h3>
                    <p className="text-sm text-muted-foreground">New power generation capacity additions and projections</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Last Updated: 22-09-2025, 10:15 AM</div>
                  <div className="text-sm text-muted-foreground">Next Update: 23-09-2025, 10 AM</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Capacity Additions</CardTitle>
                    <CardDescription>New capacity additions by technology and timeline</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Addition Analytics</p>
                      <p className="text-sm text-muted-foreground">
                        Upload data to track capacity additions
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Future Projections</CardTitle>
                    <CardDescription>Capacity expansion plans and projections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Projection Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        Upload data to see future capacity projections
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeModule !== "home" && activeModule !== "dmo" && activeModule !== "rmo" && activeModule !== "archives" && activeModule !== "sandbox" && activeModule !== "storage-operations" && activeModule !== "analytics" && activeModule !== "transmission" && activeModule !== "consumption" && activeModule !== "installed-capacity" && activeModule !== "generation" && activeModule !== "capacity-addition" && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">
                  {modules.find(m => m.id === activeModule)?.name}
                </h3>
                <p className="text-muted-foreground">
                  Detailed analysis and metrics for {modules.find(m => m.id === activeModule)?.name.toLowerCase()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <DashboardSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          setDashboardSettings(settings)
          console.log('Settings saved:', settings)
        }}
        currentSettings={dashboardSettings}
      />
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')
    
    // Calculate time window for trend data
    const now = new Date()
    const timeWindow = new Date(now.getTime() - hours * 60 * 60 * 1000)
    const previousWindow = new Date(now.getTime() - hours * 2 * 60 * 60 * 1000)

    // 1. Total Capacity
    const capacityData = await prisma.electricityData.aggregate({
      where: {
        time_period: { gte: timeWindow },
        capacity_mw: { not: null }
      },
      _sum: { capacity_mw: true },
      _avg: { capacity_mw: true }
    })

    const previousCapacity = await prisma.electricityData.aggregate({
      where: {
        time_period: { gte: previousWindow, lt: timeWindow },
        capacity_mw: { not: null }
      },
      _avg: { capacity_mw: true }
    })

    // Get capacity trend (last 10 data points)
    const capacityTrend = await prisma.electricityData.groupBy({
      by: ['time_period'],
      where: {
        time_period: { gte: timeWindow },
        capacity_mw: { not: null }
      },
      _avg: { capacity_mw: true },
      orderBy: { time_period: 'asc' },
      take: 10
    })

    // 2. Active Generation
    const generationData = await prisma.electricityData.aggregate({
      where: {
        time_period: { gte: timeWindow },
        generation_mw: { not: null }
      },
      _sum: { generation_mw: true },
      _avg: { generation_mw: true },
      _max: { generation_mw: true }
    })

    const previousGeneration = await prisma.electricityData.aggregate({
      where: {
        time_period: { gte: previousWindow, lt: timeWindow },
        generation_mw: { not: null }
      },
      _avg: { generation_mw: true }
    })

    const generationTrend = await prisma.electricityData.groupBy({
      by: ['time_period'],
      where: {
        time_period: { gte: timeWindow },
        generation_mw: { not: null }
      },
      _avg: { generation_mw: true },
      orderBy: { time_period: 'asc' },
      take: 10
    })

    // 3. Grid Load (Demand)
    const demandData = await prisma.electricityData.aggregate({
      where: {
        time_period: { gte: timeWindow },
        demand_mw: { not: null }
      },
      _avg: { demand_mw: true },
      _max: { demand_mw: true }
    })

    const previousDemand = await prisma.electricityData.aggregate({
      where: {
        time_period: { gte: previousWindow, lt: timeWindow },
        demand_mw: { not: null }
      },
      _avg: { demand_mw: true }
    })

    const demandTrend = await prisma.electricityData.groupBy({
      by: ['time_period'],
      where: {
        time_period: { gte: timeWindow },
        demand_mw: { not: null }
      },
      _avg: { demand_mw: true },
      orderBy: { time_period: 'asc' },
      take: 10
    })

    // 4. Market Price
    const priceData = await prisma.dMOMarketBidding.aggregate({
      where: {
        time_period: { gte: timeWindow },
        clearing_price_rs_per_mwh: { not: null }
      },
      _avg: { clearing_price_rs_per_mwh: true },
      _min: { clearing_price_rs_per_mwh: true },
      _max: { clearing_price_rs_per_mwh: true }
    })

    const previousPrice = await prisma.dMOMarketBidding.aggregate({
      where: {
        time_period: { gte: previousWindow, lt: timeWindow },
        clearing_price_rs_per_mwh: { not: null }
      },
      _avg: { clearing_price_rs_per_mwh: true }
    })

    const priceTrend = await prisma.dMOMarketBidding.groupBy({
      by: ['time_period'],
      where: {
        time_period: { gte: timeWindow },
        clearing_price_rs_per_mwh: { not: null }
      },
      _avg: { clearing_price_rs_per_mwh: true },
      orderBy: { time_period: 'asc' },
      take: 10
    })

    // 5. System Efficiency (Generation / Capacity ratio)
    const currentEfficiency = capacityData._avg.capacity_mw 
      ? (generationData._avg.generation_mw || 0) / capacityData._avg.capacity_mw * 100
      : 0

    const prevEfficiency = previousCapacity._avg.capacity_mw
      ? (previousGeneration._avg.generation_mw || 0) / previousCapacity._avg.capacity_mw * 100
      : 0

    // 6. Optimization Performance
    const optimizationStats = await prisma.optimizationResult.aggregate({
      where: {
        time_period: { gte: timeWindow },
        optimization_status: 'success'
      },
      _count: true,
      _avg: { solver_time_ms: true }
    })

    const previousOptimizations = await prisma.optimizationResult.count({
      where: {
        time_period: { gte: previousWindow, lt: timeWindow },
        optimization_status: 'success'
      }
    })

    // 7. Job Runs Status
    const activeJobs = await prisma.jobRun.count({
      where: {
        status: { in: ['pending', 'running'] }
      }
    })

    const recentJobsSuccess = await prisma.jobRun.count({
      where: {
        started_at: { gte: timeWindow },
        status: 'success'
      }
    })

    const recentJobsFailed = await prisma.jobRun.count({
      where: {
        started_at: { gte: timeWindow },
        status: 'failed'
      }
    })

    const jobSuccessRate = recentJobsSuccess + recentJobsFailed > 0
      ? (recentJobsSuccess / (recentJobsSuccess + recentJobsFailed)) * 100
      : 100

    // 8. Data Quality Score
    const totalDataSources = await prisma.dataSource.count()
    const connectedSources = await prisma.dataSource.count({
      where: { status: 'connected' }
    })

    const recentUploads = await prisma.uploadedFile.count({
      where: {
        created_at: { gte: timeWindow },
        status: 'completed'
      }
    })

    const failedUploads = await prisma.uploadedFile.count({
      where: {
        created_at: { gte: timeWindow },
        status: 'error'
      }
    })

    const dataQualityScore = totalDataSources > 0
      ? (connectedSources / totalDataSources) * 100
      : 0

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return 0
      return ((current - previous) / previous) * 100
    }

    // Format response
    const kpiData = {
      total_capacity: {
        value: capacityData._avg.capacity_mw || 0,
        unit: 'MW',
        change: calculateChange(
          capacityData._avg.capacity_mw || 0,
          previousCapacity._avg.capacity_mw || 0
        ),
        trend: capacityTrend.map(t => t._avg.capacity_mw || 0),
        subtitle: `Total: ${(capacityData._sum.capacity_mw || 0).toFixed(0)} MW`,
        icon: 'Zap',
        color: 'blue'
      },
      active_generation: {
        value: generationData._avg.generation_mw || 0,
        unit: 'MW',
        change: calculateChange(
          generationData._avg.generation_mw || 0,
          previousGeneration._avg.generation_mw || 0
        ),
        trend: generationTrend.map(t => t._avg.generation_mw || 0),
        subtitle: `Peak: ${(generationData._max.generation_mw || 0).toFixed(0)} MW`,
        icon: 'Activity',
        color: 'green'
      },
      grid_load: {
        value: demandData._avg.demand_mw || 0,
        unit: 'MW',
        change: calculateChange(
          demandData._avg.demand_mw || 0,
          previousDemand._avg.demand_mw || 0
        ),
        trend: demandTrend.map(t => t._avg.demand_mw || 0),
        subtitle: `Peak: ${(demandData._max.demand_mw || 0).toFixed(0)} MW`,
        icon: 'TrendingUp',
        color: 'orange'
      },
      market_price: {
        value: priceData._avg.clearing_price_rs_per_mwh || 0,
        unit: '₹/MWh',
        change: calculateChange(
          priceData._avg.clearing_price_rs_per_mwh || 0,
          previousPrice._avg.clearing_price_rs_per_mwh || 0
        ),
        trend: priceTrend.map(t => t._avg.clearing_price_rs_per_mwh || 0),
        subtitle: `Range: ₹${(priceData._min.clearing_price_rs_per_mwh || 0).toFixed(0)} - ₹${(priceData._max.clearing_price_rs_per_mwh || 0).toFixed(0)}`,
        icon: 'DollarSign',
        color: 'purple'
      },
      system_efficiency: {
        value: currentEfficiency,
        unit: '%',
        change: calculateChange(currentEfficiency, prevEfficiency),
        trend: generationTrend.map((g, i) => {
          const cap = capacityTrend[i]?._avg.capacity_mw || 1
          return ((g._avg.generation_mw || 0) / cap) * 100
        }),
        subtitle: `Utilization Factor`,
        icon: 'Gauge',
        color: 'teal'
      },
      optimization_runs: {
        value: optimizationStats._count,
        unit: 'runs',
        change: calculateChange(optimizationStats._count, previousOptimizations),
        trend: [], // Could add hourly breakdown
        subtitle: `Avg: ${(optimizationStats._avg.solver_time_ms || 0).toFixed(0)}ms`,
        icon: 'Cpu',
        color: 'indigo'
      },
      job_success_rate: {
        value: jobSuccessRate,
        unit: '%',
        change: 0, // Could compare with previous period
        trend: [], // Could add trend
        subtitle: `${activeJobs} active, ${recentJobsFailed} failed`,
        icon: 'CheckCircle',
        color: recentJobsFailed > 0 ? 'red' : 'green'
      },
      data_quality: {
        value: dataQualityScore,
        unit: '%',
        change: 0, // Could track over time
        trend: [], // Could add trend
        subtitle: `${connectedSources}/${totalDataSources} sources, ${recentUploads} uploads`,
        icon: 'Database',
        color: dataQualityScore > 80 ? 'green' : dataQualityScore > 60 ? 'yellow' : 'red'
      }
    }

    return NextResponse.json({
      success: true,
      data: kpiData,
      timestamp: now.toISOString(),
      period_hours: hours
    })
  } catch (error) {
    console.error('KPI API Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch KPI data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

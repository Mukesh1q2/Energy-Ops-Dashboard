import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get KPI data from all DMO tables
    const [generatorData, contractData, marketData, electricityData] = await Promise.all([
      db.dMOGeneratorScheduling.findMany({
        select: {
          scheduled_mw: true,
          actual_mw: true,
          technology_type: true,
          time_period: true,
          region: true
        }
      }),
      db.dMOContractScheduling.findMany({
        select: {
          scheduled_mw: true,
          actual_mw: true,
          contract_type: true,
          time_period: true
        }
      }),
      db.dMOMarketBidding.findMany({
        select: {
          bid_volume_mw: true,
          cleared_volume_mw: true,
          bid_price_rs_per_mwh: true,
          clearing_price_rs_per_mwh: true,
          time_period: true
        }
      }),
      db.electricityData.findMany({
        select: {
          generation_mw: true,
          capacity_mw: true,
          demand_mw: true,
          technology_type: true,
          time_period: true
        }
      })
    ])

    // Also try to get data from uploaded Excel files with RMO/DMO columns
    let uploadedGeneratorData: any[] = []
    try {
      const dataSources = await db.dataSource.findMany({
        where: {
          type: 'excel',
          status: 'active',
        },
        orderBy: {
          created_at: 'desc',
        },
      })

      for (const source of dataSources) {
        const columns = await db.dataSourceColumn.findMany({
          where: { data_source_id: source.id },
        })

        const columnNames = columns.map(c => c.column_name.toLowerCase())
        const hasSchedulingColumns = 
          columnNames.some(n => n.includes('scheduledmw') || n.includes('scheduled_mw')) &&
          columnNames.some(n => n.includes('technologytype') || n.includes('technology_type'))

        if (hasSchedulingColumns) {
          const config = source.config as any
          const tableName = config?.tableName

          if (tableName && /^ds_[a-zA-Z0-9_]+$/.test(tableName)) {
            const query = `SELECT * FROM "${tableName}" LIMIT 1000`
            const rows = await db.$queryRawUnsafe(query) as any[]
            
            uploadedGeneratorData = rows.map((row: any) => ({
              scheduled_mw: parseFloat(row.scheduledmw || row.ScheduledMW || '0'),
              actual_mw: parseFloat(row.modelresultsmw || row.ModelResultsMW || row.actualmw || row.ActualMW || '0'),
              technology_type: row.technologytype || row.TechnologyType || 'Unknown',
              time_period: row.timeperiod || row.TimePeriod || new Date().toISOString(),
              region: row.region || row.Region || 'Unknown'
            }))
            break // Use first matching source
          }
        }
      }
    } catch (uploadError) {
      console.log('No uploaded Excel data found for KPI aggregation:', uploadError)
    }

    // Merge data from both sources
    const allGeneratorData = [...generatorData, ...uploadedGeneratorData]

    // Calculate KPIs using merged data
    const totalScheduledCapacity = allGeneratorData.reduce((sum, item) => sum + (item.scheduled_mw || 0), 0)
    const totalActualGeneration = allGeneratorData.reduce((sum, item) => sum + (item.actual_mw || 0), 0)
    const totalContractVolume = contractData.reduce((sum, item) => sum + (item.scheduled_mw || 0), 0)
    const totalMarketVolume = marketData.reduce((sum, item) => sum + (item.bid_volume_mw || 0), 0)
    
    // Calculate averages
    const avgClearingPrice = marketData
      .filter(item => item.clearing_price_rs_per_mwh)
      .reduce((sum, item) => sum + (item.clearing_price_rs_per_mwh || 0), 0) / 
      marketData.filter(item => item.clearing_price_rs_per_mwh).length || 0

    // Technology mix from merged generator data
    const technologyMix = allGeneratorData.reduce((acc, item) => {
      if (item.technology_type) {
        acc[item.technology_type] = (acc[item.technology_type] || 0) + (item.scheduled_mw || 0)
      }
      return acc
    }, {} as Record<string, number>)

    const totalTechCapacity = Object.values(technologyMix).reduce((sum, val) => sum + val, 0)
    const technologyMixPercentage = Object.entries(technologyMix).reduce((acc, [tech, mw]) => {
      acc[tech] = totalTechCapacity > 0 ? (mw / totalTechCapacity) * 100 : 0
      return acc
    }, {} as Record<string, number>)

    // Regional performance (simplified - using regions from merged generator data)
    const regions = [...new Set(allGeneratorData.map(item => item.region).filter(Boolean))]
    const regionalPerformance = regions.map(region => {
      const regionData = allGeneratorData.filter(item => item.region === region)
      const totalRegionScheduled = regionData.reduce((sum, item) => sum + (item.scheduled_mw || 0), 0)
      const totalRegionActual = regionData.reduce((sum, item) => sum + (item.actual_mw || 0), 0)
      const availability = totalRegionScheduled > 0 ? (totalRegionActual / totalRegionScheduled) * 100 : 0
      
      return {
        region,
        availability: Math.round(availability * 10) / 10,
        scheduled: totalRegionScheduled,
        actual: totalRegionActual
      }
    })

    // Recent trends (last 30 days) using merged data
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentGeneratorData = allGeneratorData.filter(item => new Date(item.time_period) >= thirtyDaysAgo)
    const recentTrend = recentGeneratorData.reduce((acc, item) => {
      const date = new Date(item.time_period).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { scheduled: 0, actual: 0 }
      }
      acc[date].scheduled += item.scheduled_mw || 0
      acc[date].actual += item.actual_mw || 0
      return acc
    }, {} as Record<string, { scheduled: number; actual: number }>)

    const kpiData = {
      totalCapacity: Math.round(totalScheduledCapacity * 10) / 10,
      totalGeneration: Math.round(totalActualGeneration * 10) / 10,
      totalMarketVolume: Math.round(totalMarketVolume * 10) / 10,
      avgClearingPrice: Math.round(avgClearingPrice * 100) / 100,
      technologyMix: technologyMixPercentage,
      regionalPerformance,
      recentTrend: Object.entries(recentTrend).map(([date, data]) => ({
        date,
        ...data
      })),
      dataCounts: {
        generatorRecords: allGeneratorData.length,
        uploadedRecords: uploadedGeneratorData.length,
        contractRecords: contractData.length,
        marketRecords: marketData.length,
        electricityRecords: electricityData.length
      }
    }

    return NextResponse.json({
      success: true,
      data: kpiData
    })

  } catch (error) {
    console.error('Error fetching dashboard KPI data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard KPI data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
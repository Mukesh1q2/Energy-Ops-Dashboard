import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchFromExcelTable } from '@/lib/excel-data-helper'

/**
 * POST /api/dmo/chart-data
 * Fetch chart data for a data source with optional filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataSourceId, moduleType, filters = {} } = body

    if (!dataSourceId) {
      return NextResponse.json(
        { success: false, error: 'dataSourceId is required' },
        { status: 400 }
      )
    }

    // Get data source to determine which table to query
    const dataSource = await db.dataSource.findUnique({
      where: { id: dataSourceId },
    })

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      )
    }

    const config = dataSource.config as any
    const tableName = config?.tableName || 'DMOGeneratorScheduling'

    const isDynamic = /^ds_[a-zA-Z0-9_]+$/.test(tableName)

    // Build where clause based on filters
    const whereClause: any = {}
    
    // Add filter conditions
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        whereClause[key] = value
      }
    })

    // Fetch data based on table name
    let rawData: any[] = []

    if (isDynamic) {
      // Fetch from dynamic Excel table
      rawData = await fetchFromExcelTable(tableName, 50000)
    } else if (tableName === 'DMOGeneratorScheduling') {
      rawData = await db.dMOGeneratorScheduling.findMany({
        where: whereClause,
        take: 50000,
        orderBy: { time_period: 'asc' },
      })
    } else if (tableName === 'DMOContractScheduling') {
      rawData = await db.dMOContractScheduling.findMany({
        where: whereClause,
        take: 50000,
        orderBy: { time_period: 'asc' },
      })
    } else if (tableName === 'DMOMarketBidding') {
      rawData = await db.dMOMarketBidding.findMany({
        where: whereClause,
        take: 50000,
        orderBy: { time_period: 'asc' },
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Unknown table name' },
        { status: 400 }
      )
    }

    // Transform data to timeblock format
    // Group by timeblock and aggregate
    const timeblockData = new Map<number, any>()

    rawData.forEach((row: any) => {
      // Determine time variables from dynamic or direct rows
      const tp = row.time_period || row.timeperiod || row.TimePeriod
      const minutesBlock = moduleType === 'rmo' ? 30 : 15

      let timeblockIndex: number | null = null
      const tb = row.timeblock || row.TimeBlock
      if (tb) {
        timeblockIndex = Number(tb)
      } else if (tp) {
        const d = new Date(tp)
        if (!isNaN(d.getTime())) {
          const minutes = d.getHours() * 60 + d.getMinutes()
          timeblockIndex = Math.floor(minutes / minutesBlock) + 1
        }
      }
      if (!timeblockIndex) return

      if (!timeblockData.has(timeblockIndex)) {
        timeblockData.set(timeblockIndex, {
          timeblock_index: timeblockIndex,
          scheduled_mw: 0,
          actual_mw: 0,
          dam_price: 0,
          rtm_price: 0,
          gdam_price: 0,
          count: 0,
        })
      }

      const block = timeblockData.get(timeblockIndex)!
      const scheduled = row.scheduled_mw ?? row.scheduledmw ?? row.ScheduledMW
      const actual = row.actual_mw ?? row.modelresultsmw ?? row.ModelResultsMW
      const dam = row.dam_price ?? row.damprice ?? row.DAMPrice ?? row.bid_price_rs_per_mwh
      const rtm = row.rtm_price ?? row.rtmprice ?? row.RTMPrice ?? row.clearing_price_rs_per_mwh
      const gdam = row.gdam_price ?? row.gdamprice ?? row.GDAMPrice

      block.scheduled_mw += Number(scheduled || 0)
      block.actual_mw += Number(actual || 0)
      block.dam_price += Number(dam || 0)
      block.rtm_price += Number(rtm || 0)
      block.gdam_price += Number(gdam || 0)
      block.count += 1
    })

    // Calculate averages
    const chartData = Array.from(timeblockData.values()).map((block) => ({
      timeblock_index: block.timeblock_index,
      scheduled_mw: block.count > 0 ? block.scheduled_mw / block.count : 0,
      actual_mw: block.count > 0 ? block.actual_mw / block.count : 0,
      dam_price: block.count > 0 ? block.dam_price / block.count : 0,
      rtm_price: block.count > 0 ? block.rtm_price / block.count : 0,
      gdam_price: block.count > 0 ? block.gdam_price / block.count : 0,
    }))

    // Sort by timeblock index
    chartData.sort((a, b) => a.timeblock_index - b.timeblock_index)

    return NextResponse.json({
      success: true,
      data: chartData,
      count: chartData.length,
      rawCount: rawData.length,
    })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch chart data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

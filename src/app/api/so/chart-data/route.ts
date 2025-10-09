import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withUserAuth, type AuthenticatedRequest } from '@/lib/with-auth'
import { fetchFromExcelTable } from '@/lib/excel-data-helper'

/**
 * POST /api/so/chart-data
 * Generate chart data for Storage Operations (SO) with 96 timeblock aggregation
 */
export const POST = withUserAuth(async (request: AuthenticatedRequest) => {
  try {
    const { dataSourceId, filters = {} } = await request.json()

    if (!dataSourceId) {
      return NextResponse.json(
        { success: false, error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    // Load data source config to detect dynamic Excel table
    const ds = await db.dataSource.findUnique({ where: { id: dataSourceId } })
    if (!ds) {
      return NextResponse.json({ success: false, error: 'Data source not found' }, { status: 404 })
    }
    const config = ds.config as any
    const tableName = config?.tableName
    const isDynamic = tableName && /^ds_[a-zA-Z0-9_]+$/.test(tableName)

    let rawRows: any[] = []

    if (isDynamic) {
      // Read directly from uploaded Excel dynamic table
      rawRows = await fetchFromExcelTable(tableName, 50000)
    } else {
      // Fallback: Use MarketSnapshotData if available
      const where: any = { data_source_id: dataSourceId }
      if (filters.state) where.state = filters.state
      if (filters.plant_name) where.plant_name = filters.plant_name
      if (filters.region) where.region = filters.region

      rawRows = await db.marketSnapshotData.findMany({
        where,
        orderBy: [{ timeblock: 'asc' }]
      }) as any
    }

    // Aggregate to 96 blocks (15-min)
    const blocks: Record<number, {
      count: number
      energy_price: number
      battery_soc: number
      charging_mw: number
      discharging_mw: number
      net_power_mw: number
      scheduled_mw: number
      actual_mw: number
    }> = {}

    for (const row of rawRows) {
      let tb = Number(row.timeblock || row.TimeBlock)
      if (!tb) {
        const tp = row.time_period || row.timeperiod || row.TimePeriod
        if (!tp) continue
        const d = new Date(tp)
        if (isNaN(d.getTime())) continue
        const minutes = d.getHours() * 60 + d.getMinutes()
        tb = Math.floor(minutes / 15) + 1
      }

      if (!blocks[tb]) {
        blocks[tb] = {
          count: 0,
          energy_price: 0,
          battery_soc: 0,
          charging_mw: 0,
          discharging_mw: 0,
          net_power_mw: 0,
          scheduled_mw: 0,
          actual_mw: 0,
        }
      }

      const b = blocks[tb]
      b.count += 1
      // Use DAM price as energy price if not provided explicitly
      const dam = Number(row.dam_price ?? row.damprice ?? row.DAMPrice ?? 0)
      b.energy_price += dam
      // Derived values for storage demo
      const scheduled = Number(row.scheduled_mw ?? row.scheduledmw ?? row.ScheduledMW ?? 0)
      const actual = Number(row.actual_mw ?? row.modelresultsmw ?? row.ModelResultsMW ?? 0)
      b.scheduled_mw += scheduled
      b.actual_mw += actual
      // Simple heuristics for charging/discharging/net power
      const charge = Math.max(0, -scheduled)
      const discharge = Math.max(0, actual)
      b.charging_mw += charge
      b.discharging_mw += discharge
      b.net_power_mw += (discharge - charge)
      // Battery SOC proxy from price signal (optional)
      b.battery_soc += Math.max(0, Math.min(100, dam / 100))
    }

    const data = Array.from({ length: 96 }, (_, i) => {
      const idx = i + 1
      const b = blocks[idx]
      if (!b || b.count === 0) {
        return {
          timeblock_index: idx,
          energy_price: 0,
          battery_soc: 0,
          charging_mw: 0,
          discharging_mw: 0,
          net_power_mw: 0,
          scheduled_mw: 0,
          actual_mw: 0,
        }
      }
      return {
        timeblock_index: idx,
        energy_price: b.energy_price / b.count,
        battery_soc: b.battery_soc / b.count,
        charging_mw: b.charging_mw,
        discharging_mw: b.discharging_mw,
        net_power_mw: b.net_power_mw,
        scheduled_mw: b.scheduled_mw,
        actual_mw: b.actual_mw,
      }
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error generating SO chart data:', error)
    return NextResponse.json({ success: false, error: 'Failed to generate SO chart data' }, { status: 500 })
  }
});

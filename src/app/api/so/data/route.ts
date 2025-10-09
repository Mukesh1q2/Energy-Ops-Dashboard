import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withUserAuth, type AuthenticatedRequest } from '@/lib/with-auth'

/**
 * GET /api/so/data
 * Fetch Storage Operations data from uploaded Excel files
 */
export const GET = withUserAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '1000')
    const state = searchParams.get('state')
    const plantName = searchParams.get('plant_name')
    
    // Build where clause for filtering
    const where: any = {}
    
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      
      where.time_period = {
        gte: startDate,
        lt: endDate
      }
    }
    
    if (state) {
      where.state = state
    }
    
    if (plantName) {
      where.plant_name = plantName
    }

    // Fetch storage operations data from MarketSnapshotData table
    // (In a real implementation, this would be a separate SOData table)
    const data = await db.marketSnapshotData.findMany({
      where,
      take: limit,
      orderBy: [
        { time_period: 'desc' },
        { timeblock: 'asc' }
      ]
    })

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No SO data found. Please upload a Storage Operations Excel file with battery data.',
        data: [],
      })
    }

    // Transform data for SO-specific needs (battery storage operations)
    const transformedData = data.map(record => ({
      TimePeriod: record.time_period,
      TimeBlock: record.timeblock, // SO uses 96 blocks like DMO
      BatterySOC: record.dam_price || 0, // State of Charge (%)
      ChargingMW: record.scheduled_mw || 0, // Charging power
      DischargingMW: record.modelresult_mw || 0, // Discharging power
      EnergyPrice: record.rtm_price || 0, // Energy price for arbitrage
      StorageEfficiency: 0.85, // Battery round-trip efficiency
      State: record.state,
      PlantName: record.plant_name,
      Region: record.region,
      ContractName: record.contract_name,
      ModelID: `SO_${Date.now()}`,
      ModelTriggerTime: new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transformedData,
      recordCount: transformedData.length,
    })
  } catch (error) {
    console.error('Error fetching SO data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch SO data',
      details: error instanceof Error ? error.message : 'Unknown error',
      data: [],
    }, { status: 500 })
  }
});
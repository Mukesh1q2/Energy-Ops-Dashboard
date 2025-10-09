import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withUserAuth, type AuthenticatedRequest } from '@/lib/with-auth'

/**
 * GET /api/so/filters
 * Get available filter options for Storage Operations data
 */
export const GET = withUserAuth(async (request: AuthenticatedRequest) => {
  try {
    // Get unique values for common filters from storage operations data
    const states = await db.marketSnapshotData.findMany({
      select: { state: true },
      where: { state: { not: null } },
      distinct: ['state']
    })

    const plants = await db.marketSnapshotData.findMany({
      select: { plant_name: true },
      where: { plant_name: { not: null } },
      distinct: ['plant_name'],
      take: 100
    })

    const regions = await db.marketSnapshotData.findMany({
      select: { region: true },
      where: { region: { not: null } },
      distinct: ['region']
    })

    const contracts = await db.marketSnapshotData.findMany({
      select: { contract_name: true },
      where: { contract_name: { not: null } },
      distinct: ['contract_name'],
      take: 50
    })

    // Storage-specific filters
    const batteryTypes = [
      'Lithium-Ion',
      'Lead-Acid', 
      'Flow Battery',
      'Compressed Air',
      'Pumped Hydro'
    ]

    const storageCapacities = [
      '< 10 MW',
      '10-50 MW',
      '50-100 MW',
      '100-500 MW',
      '> 500 MW'
    ]

    const operationModes = [
      'Grid Stabilization',
      'Energy Arbitrage',
      'Peak Shaving',
      'Frequency Regulation',
      'Backup Power'
    ]

    return NextResponse.json({
      success: true,
      data: {
        states: states.map(s => s.state).filter(Boolean),
        plants: plants.map(p => p.plant_name).filter(Boolean),
        regions: regions.map(r => r.region).filter(Boolean), 
        contracts: contracts.map(c => c.contract_name).filter(Boolean),
        batteryTypes,
        storageCapacities,
        operationModes,
        timeBlocks: Array.from({ length: 96 }, (_, i) => i + 1), // 96 15-minute blocks
        socLevels: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
        efficiencyRanges: ['70-80%', '80-90%', '90-95%', '95%+']
      }
    })
  } catch (error) {
    console.error('Error fetching SO filters:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch SO filters',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
});
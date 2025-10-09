import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataSourceId = searchParams.get('data_source_id')
    const modelId = searchParams.get('model_id')
    const plantName = searchParams.get('plant_name')
    const region = searchParams.get('region')
    const state = searchParams.get('state')
    const technologyType = searchParams.get('technology_type')
    const timeBlock = searchParams.get('time_block')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '1000')

    // Build where clause
    const where: any = {}

    if (dataSourceId) {
      where.data_source_id = dataSourceId
    }

    if (modelId) {
      where.model_id = modelId
    }

    if (plantName) {
      where.plant_name = plantName
    }

    if (region) {
      where.region = region
    }

    if (state) {
      where.state = state
    }

    if (technologyType) {
      where.technology_type = technologyType
    }

    if (timeBlock) {
      where.time_block = parseInt(timeBlock)
    }

    if (status) {
      where.optimization_status = status
    }

    // Fetch results
    const results = await db.optimizationResult.findMany({
      where,
      orderBy: [
        { model_trigger_time: 'desc' },
        { time_block: 'asc' }
      ],
      take: limit
    })

    // Get unique filter options
    const allResults = await db.optimizationResult.findMany({
      where: dataSourceId ? { data_source_id: dataSourceId } : {},
      select: {
        model_id: true,
        plant_name: true,
        region: true,
        state: true,
        technology_type: true,
        optimization_status: true
      }
    })

    const filterOptions = {
      modelIds: [...new Set(allResults.map(r => r.model_id))],
      plantNames: [...new Set(allResults.map(r => r.plant_name))],
      regions: [...new Set(allResults.map(r => r.region))],
      states: [...new Set(allResults.map(r => r.state))],
      technologyTypes: [...new Set(allResults.map(r => r.technology_type))],
      statuses: [...new Set(allResults.map(r => r.optimization_status))]
    }

    // Calculate aggregated metrics
    const metrics = results.length > 0 ? {
      totalResults: results.length,
      totalScheduledMW: results.reduce((sum, r) => sum + (r.scheduled_mw || 0), 0),
      totalOptimizedMW: results.reduce((sum, r) => sum + (r.model_results_mw || 0), 0),
      averageObjectiveValue: results.reduce((sum, r) => sum + (r.objective_value || 0), 0) / results.length,
      averageSolveTime: results.reduce((sum, r) => sum + (r.solver_time_ms || 0), 0) / results.length,
      successRate: (results.filter(r => r.optimization_status === 'success').length / results.length) * 100
    } : null

    return NextResponse.json({
      success: true,
      data: {
        results,
        filterOptions,
        metrics,
        count: results.length
      }
    })
  } catch (error) {
    console.error('Error fetching optimization results:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch optimization results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST endpoint to clear/delete optimization results
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { model_id, data_source_id } = body

    if (!model_id && !data_source_id) {
      return NextResponse.json(
        { success: false, error: 'Either model_id or data_source_id is required' },
        { status: 400 }
      )
    }

    const where: any = {}
    if (model_id) where.model_id = model_id
    if (data_source_id) where.data_source_id = data_source_id

    const result = await db.optimizationResult.deleteMany({
      where
    })

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} optimization results`,
      count: result.count
    })
  } catch (error) {
    console.error('Error deleting optimization results:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete optimization results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

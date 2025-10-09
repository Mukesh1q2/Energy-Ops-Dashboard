import { NextRequest, NextResponse } from 'next/server'
import { createDefaultCharts } from '@/lib/data-source-manager'
import { getIo } from '@/lib/socket'

/**
 * POST /api/dmo/generate-charts
 * Generate default charts for a data source
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataSourceId, dashboardId, moduleType } = body

    // Validate inputs
    if (!dataSourceId) {
      return NextResponse.json(
        { success: false, error: 'dataSourceId is required' },
        { status: 400 }
      )
    }

    if (!dashboardId) {
      return NextResponse.json(
        { success: false, error: 'dashboardId is required' },
        { status: 400 }
      )
    }

    if (!moduleType || !['dmo', 'rmo', 'so'].includes(moduleType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid moduleType. Must be dmo, rmo, or so' },
        { status: 400 }
      )
    }

    console.log('Generating charts for:', { dataSourceId, dashboardId, moduleType })

    // Generate charts using data-source-manager
    const charts = await createDefaultCharts(
      dataSourceId,
      dashboardId,
      moduleType as 'dmo' | 'rmo' | 'so',
      'system' // TODO: Get actual user from session
    )

    // Emit Socket.IO event to notify clients
    const io = getIo()
    if (io) {
      io.to('dashboard').emit('charts:generated', {
        dataSourceId,
        dashboardId,
        chartCount: charts.length,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      chartCount: charts.length,
      charts: charts.map((c) => ({
        id: c.dashboard_id,
        name: c.name,
        type: (c.chart_config as any).type,
      })),
      message: `Successfully generated ${charts.length} chart${charts.length !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error('Error generating charts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate charts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

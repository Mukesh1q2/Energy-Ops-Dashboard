import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dashboardId = searchParams.get('dashboard_id') || 'default'
    const dataSourceId = searchParams.get('data_source_id')

    const where: any = {
      dashboard_id: dashboardId
    }

    if (dataSourceId) {
      where.data_source_id = dataSourceId
    }

    const charts = await db.dashboardChart.findMany({
      where,
      include: {
        dataSource: true
      },
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: charts
    })
  } catch (error) {
    console.error('Error fetching charts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch charts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dashboard_id, data_source_id, name, chart_config, created_by } = body

    if (!dashboard_id || !data_source_id || !name || !chart_config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const chart = await db.dashboardChart.create({
      data: {
        dashboard_id,
        data_source_id,
        name,
        chart_config,
        created_by: created_by || 'system'
      }
    })

    return NextResponse.json({
      success: true,
      data: chart
    })
  } catch (error) {
    console.error('Error creating chart:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { chart_id } = body

    if (!chart_id) {
      return NextResponse.json(
        { success: false, error: 'Chart ID is required' },
        { status: 400 }
      )
    }

    await db.dashboardChart.delete({
      where: { id: chart_id }
    })

    return NextResponse.json({
      success: true,
      message: 'Chart deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting chart:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withUserAuth, type AuthenticatedRequest } from '@/lib/with-auth'

/**
 * GET /api/data-sources/[id]/preview
 * Get a preview of the data source content
 */
export const GET = withUserAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch data source with columns
    const dataSource = await db.dataSource.findUnique({
      where: { id },
      include: {
        columns: {
          select: {
            column_name: true,
            data_type: true,
            sample_values: true,
            label: true
          }
        }
      }
    })

    if (!dataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // For now, we'll create sample preview data based on the columns
    // In a real implementation, you'd query the actual data table
    const preview = []
    
    if (dataSource.columns.length > 0) {
      // Generate sample rows based on column metadata
      for (let i = 0; i < Math.min(limit, 10); i++) {
        const row: any = {}
        dataSource.columns.forEach(col => {
          if (col.sample_values && Array.isArray(col.sample_values) && col.sample_values.length > 0) {
            // Use actual sample values
            row[col.column_name] = col.sample_values[i % col.sample_values.length]
          } else {
            // Generate placeholder based on data type
            switch (col.data_type) {
              case 'number':
                row[col.column_name] = Math.round(Math.random() * 1000)
                break
              case 'date':
                row[col.column_name] = new Date().toISOString().split('T')[0]
                break
              case 'boolean':
                row[col.column_name] = Math.random() > 0.5
                break
              default:
                row[col.column_name] = `Sample ${col.column_name} ${i + 1}`
            }
          }
        })
        preview.push(row)
      }
    }

    // If no columns exist, try to get data from MarketSnapshotData as fallback
    if (preview.length === 0) {
      try {
        const marketData = await db.marketSnapshotData.findMany({
          where: { data_source_id: id },
          take: limit,
          orderBy: { created_at: 'desc' }
        })

        if (marketData.length > 0) {
          marketData.forEach(record => {
            preview.push({
              'Time Period': record.time_period?.toISOString().split('T')[0],
              'Timeblock': record.timeblock,
              'DAM Price': record.dam_price,
              'RTM Price': record.rtm_price,
              'Scheduled MW': record.scheduled_mw,
              'State': record.state,
              'Plant Name': record.plant_name,
              'Region': record.region
            })
          })
        }
      } catch (fallbackError) {
        console.warn('Fallback data fetch failed:', fallbackError)
      }
    }

    return NextResponse.json({
      success: true,
      preview,
      dataSource: {
        id: dataSource.id,
        name: dataSource.name,
        type: dataSource.type,
        recordCount: dataSource.record_count,
        columnCount: dataSource.columns.length,
        columns: dataSource.columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          label: col.label || col.column_name,
          sampleCount: Array.isArray(col.sample_values) ? col.sample_values.length : 0
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching data source preview:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
});
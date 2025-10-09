import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/with-auth'

/**
 * GET /api/admin/data-sources
 * Fetch all data sources with detailed information for admin management
 */
export const GET = withAdminAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (type) {
      where.type = type
    }

    // Fetch data sources with related information
    const dataSources = await db.dataSource.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { created_at: 'desc' },
      include: {
        columns: {
          select: {
            id: true,
            column_name: true,
            data_type: true,
            sample_values: true,
            expose_as_filter: true,
            label: true
          }
        },
        charts: {
          select: {
            id: true,
            name: true,
            dashboard_id: true,
            created_at: true
          }
        },
        _count: {
          select: {
            columns: true,
            charts: true
          }
        }
      }
    })

    // Get total count for pagination
    const totalCount = await db.dataSource.count({ where })

    // Transform data for admin UI
    const transformedDataSources = dataSources.map(ds => ({
      id: ds.id,
      name: ds.name,
      type: ds.type.toUpperCase(),
      status: ds.status.toUpperCase(),
      size: ds.record_count ? ds.record_count * 1024 : 0, // Rough estimate
      rowCount: ds.record_count,
      columnCount: ds._count.columns,
      uploadedAt: ds.created_at.toISOString(),
      lastAccessed: ds.last_sync?.toISOString() || null,
      uploadedBy: 'Admin', // TODO: Add user tracking
      columns: ds.columns,
      charts: ds.charts,
      config: ds.config
    }))

    return NextResponse.json({
      success: true,
      dataSources: transformedDataSources,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    console.error('Error fetching admin data sources:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
});
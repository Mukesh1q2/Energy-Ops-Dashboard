import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/dmo/data-sources
 * Fetch all data sources or the latest one
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latest = searchParams.get('latest') === 'true'
    const moduleType = searchParams.get('moduleType')

    if (latest) {
      // Get the most recently updated data source
      const dataSource = await prisma.dataSource.findFirst({
        where: moduleType
          ? {
              name: {
                startsWith: `dmo-${moduleType}`,
              },
            }
          : undefined,
        orderBy: {
          updated_at: 'desc',
        },
        include: {
          columns: {
            where: {
              expose_as_filter: true,
            },
          },
        },
      })

      if (!dataSource) {
        return NextResponse.json({
          success: false,
          error: 'No data source found',
        })
      }

      return NextResponse.json({
        success: true,
        dataSource,
      })
    }

    // Get all data sources
    const dataSources = await prisma.dataSource.findMany({
      where: {
        name: {
          startsWith: 'dmo-',
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
      include: {
        _count: {
          select: {
            columns: true,
            charts: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      dataSources,
      count: dataSources.length,
    })
  } catch (error) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch data sources',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 })
    }

    const searchQuery = query.toLowerCase()
    const results: any[] = []

    // Search data sources
    const dataSources = await db.dataSource.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { type: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      take: 10
    })

    for (const ds of dataSources) {
      results.push({
        id: ds.id,
        type: 'datasource',
        title: ds.name,
        description: `${ds.type} data source • ${ds.record_count || 0} records`,
        metadata: { type: ds.type, record_count: ds.record_count },
        url: '/sandbox'
      })
    }

    // Search charts
    const charts = await db.chart.findMany({
      where: {
        name: { contains: searchQuery, mode: 'insensitive' }
      },
      include: {
        data_source: true
      },
      take: 10
    })

    for (const chart of charts) {
      results.push({
        id: chart.id,
        type: 'chart',
        title: chart.name,
        description: `Chart from ${chart.data_source.name}`,
        metadata: { chart_type: (chart.chart_config as any)?.type },
        url: '/'
      })
    }

    // Search optimization runs
    const optimizationRuns = await db.activity.findMany({
      where: {
        OR: [
          { activity_type: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ],
        activity_type: {
          in: ['DMO', 'RMO', 'SO']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    })

    for (const run of optimizationRuns) {
      results.push({
        id: run.id,
        type: 'optimization',
        title: `${run.activity_type} Run`,
        description: run.description || `${run.activity_type} optimization executed`,
        metadata: { status: run.status, timestamp: run.timestamp },
        url: '/archives'
      })
    }

    // Sort results by relevance (exact matches first)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchQuery
      const bExact = b.title.toLowerCase() === searchQuery
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      const aStarts = a.title.toLowerCase().startsWith(searchQuery)
      const bStarts = b.title.toLowerCase().startsWith(searchQuery)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      
      return 0
    })

    return NextResponse.json({
      success: true,
      data: results.slice(0, 20), // Limit to 20 total results
      count: results.length
    })

  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

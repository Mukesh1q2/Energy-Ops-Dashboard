import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const model_type = searchParams.get('model_type')
    const data_source_id = searchParams.get('data_source_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (model_type) where.model_type = model_type
    if (data_source_id) where.data_source_id = data_source_id
    if (status) where.status = status

    // Fetch jobs
    const jobs = await db.jobRun.findMany({
      where,
      orderBy: { started_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { logs: true }
        }
      }
    })

    // Get total count
    const total = await db.jobRun.count({ where })

    return NextResponse.json({
      success: true,
      data: jobs.map(job => ({
        ...job,
        log_count: job._count.logs
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

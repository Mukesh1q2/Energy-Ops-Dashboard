import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List activities with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const action = searchParams.get('action')
    const entity_type = searchParams.get('entity_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}
    if (type) where.type = type
    if (action) where.action = action
    if (entity_type) where.entity_type = entity_type
    if (status) where.status = status

    // Fetch activities
    const activities = await db.activity.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count
    const total = await db.activity.count({ where })

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch activities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST: Create activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      action,
      title,
      description,
      entity_type,
      entity_id,
      user_id,
      status,
      metadata
    } = body

    // Validate required fields
    if (!type || !action || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const activity = await db.activity.create({
      data: {
        type,
        action,
        title,
        description,
        entity_type,
        entity_id,
        user_id,
        status: status || 'success',
        metadata: metadata || {}
      }
    })

    return NextResponse.json({
      success: true,
      data: activity
    })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

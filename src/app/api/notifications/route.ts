import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: List notifications with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')
    const is_read = searchParams.get('is_read')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      is_archived: false
    }
    if (type) where.type = type
    if (category) where.category = category
    if (severity) where.severity = severity
    if (is_read !== null && is_read !== undefined) {
      where.is_read = is_read === 'true'
    }

    // Fetch notifications
    const notifications = await db.notification.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset
    })

    // Get counts by type
    const counts = await db.notification.groupBy({
      by: ['type'],
      where: { is_read: false, is_archived: false },
      _count: true
    })

    const unreadCounts = counts.reduce((acc, item) => {
      acc[item.type] = item._count
      return acc
    }, {} as Record<string, number>)

    // Get total count
    const total = await db.notification.count({ where })
    const unreadTotal = await db.notification.count({ 
      where: { is_read: false, is_archived: false } 
    })

    return NextResponse.json({
      success: true,
      data: notifications,
      counts: {
        total,
        unread: unreadTotal,
        by_type: unreadCounts
      },
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST: Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      category,
      title,
      message,
      severity,
      action_url,
      action_label,
      metadata,
      user_id
    } = body

    // Validate required fields
    if (!type || !category || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        type,
        category,
        title,
        message,
        severity: severity || 'low',
        action_url,
        action_label,
        metadata: metadata || {},
        user_id
      }
    })

    return NextResponse.json({
      success: true,
      data: notification
    })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PATCH: Mark notifications as read/unread
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids, is_read } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification IDs' },
        { status: 400 }
      )
    }

    const updated = await db.notification.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        is_read: is_read !== false,
        read_at: is_read !== false ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        updated: updated.count
      }
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE: Archive notifications
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ids = searchParams.get('ids')?.split(',') || []

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No notification IDs provided' },
        { status: 400 }
      )
    }

    const updated = await db.notification.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        is_archived: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        archived: updated.count
      }
    })
  } catch (error) {
    console.error('Error archiving notifications:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to archive notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

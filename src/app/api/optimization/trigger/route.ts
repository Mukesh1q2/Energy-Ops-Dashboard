import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { computeLimiter, withRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  return withRateLimit(request, computeLimiter, async () => {
  try {
    const { type } = await request.json()

    if (!type || !['DMO', 'RMO', 'SO'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid optimization type' },
        { status: 400 }
      )
    }

    // Generate a unique run ID
    const runId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create notification for optimization run
    const notification = await prisma.notification.create({
      data: {
        type: 'system',
        category: 'optimization',
        title: `${type} Optimization Run Activated`,
        message: `${type} optimization model has been triggered and is now running. Run ID: ${runId}`,
        severity: 'info',
        is_read: false,
        is_archived: false,
        metadata: JSON.stringify({
          runId,
          optimizationType: type,
          status: 'running',
          startTime: new Date().toISOString()
        })
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'optimization',
        action: 'trigger',
        title: `${type} Optimization Started`,
        description: `${type} optimization run has been activated with ID: ${runId}`,
        entity_type: 'optimization_run',
        entity_id: runId,
        status: 'running',
        metadata: JSON.stringify({
          optimizationType: type,
          runId,
          triggeredAt: new Date().toISOString()
        })
      }
    })

    // In a real application, this would trigger the actual optimization model
    // For now, we'll simulate with a timeout that creates a completion notification
    setTimeout(async () => {
      try {
        await prisma.notification.create({
          data: {
            type: 'system',
            category: 'optimization',
            title: `${type} Optimization Run Completed`,
            message: `${type} optimization model has completed successfully. Run ID: ${runId}`,
            severity: 'success',
            is_read: false,
            is_archived: false,
            metadata: JSON.stringify({
              runId,
              optimizationType: type,
              status: 'completed',
              endTime: new Date().toISOString(),
              duration: Math.floor(Math.random() * 300) + 60 // Random duration 60-360 seconds
            })
          }
        })

        await prisma.activity.create({
          data: {
            type: 'optimization',
            action: 'complete',
            title: `${type} Optimization Completed`,
            description: `${type} optimization run ${runId} has completed successfully`,
            entity_type: 'optimization_run',
            entity_id: runId,
            status: 'completed',
            metadata: JSON.stringify({
              optimizationType: type,
              runId,
              completedAt: new Date().toISOString()
            })
          }
        })
      } catch (error) {
        console.error('Error creating completion notification:', error)
      }
    }, 30000) // Simulate 30 seconds processing time

    return NextResponse.json({
      success: true,
      message: `${type} optimization run triggered successfully`,
      runId,
      notification
    })
  } catch (error: any) {
    console.error('Error triggering optimization:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger optimization' },
      { status: 500 }
    )
  }
  }) // Close withRateLimit
}

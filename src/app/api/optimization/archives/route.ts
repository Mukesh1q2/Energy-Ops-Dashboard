import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Fetch activities that represent optimization runs
    const activities = await prisma.activity.findMany({
      where: {
        type: 'optimization',
        action: {
          in: ['trigger', 'complete']
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 100 // Limit to last 100 runs
    })

    // Group by runId and combine trigger/complete records
    const runsMap = new Map()
    
    activities.forEach((activity) => {
      const metadata = JSON.parse(activity.metadata || '{}')
      const runId = metadata.runId || activity.entity_id
      
      if (!runId) return
      
      if (!runsMap.has(runId)) {
        runsMap.set(runId, {
          id: runId,
          type: metadata.optimizationType || 'DMO',
          status: activity.status || 'completed',
          startTime: activity.created_at,
          endTime: null,
          duration: null,
          results: null,
          logs: []
        })
      }
      
      const run = runsMap.get(runId)
      
      if (activity.action === 'complete') {
        run.endTime = activity.created_at
        run.status = 'completed'
        if (run.startTime) {
          run.duration = Math.floor(
            (new Date(activity.created_at).getTime() - new Date(run.startTime).getTime()) / 1000
          )
        }
        // Simulate some results
        run.results = {
          optimized: `${Math.floor(Math.random() * 1000)} MW`,
          cost: Math.floor(Math.random() * 10000000) + 1000000,
          efficiency: `${(Math.random() * 10 + 85).toFixed(2)}%`
        }
      }
      
      run.logs.push({
        timestamp: activity.created_at,
        action: activity.action,
        title: activity.title,
        description: activity.description
      })
    })

    const runs = Array.from(runsMap.values())

    return NextResponse.json({
      success: true,
      runs,
      total: runs.length
    })
  } catch (error: any) {
    console.error('Error fetching archives:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch archives' },
      { status: 500 }
    )
  }
}

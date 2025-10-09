import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job_id = id

    const job = await db.jobRun.findUnique({
      where: { job_id },
      select: {
        job_id: true,
        model_type: true,
        status: true,
        progress: true,
        started_at: true,
        completed_at: true,
        error_message: true,
        results_count: true,
        objective_value: true,
        solver_time_ms: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Calculate duration if running
    let duration_ms = null
    if (job.started_at) {
      const endTime = job.completed_at || new Date()
      duration_ms = endTime.getTime() - job.started_at.getTime()
    }

    return NextResponse.json({
      success: true,
      data: {
        ...job,
        duration_ms,
        is_running: job.status === 'running' || job.status === 'pending',
        is_complete: job.status === 'success' || job.status === 'failed'
      }
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

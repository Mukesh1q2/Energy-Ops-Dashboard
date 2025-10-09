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
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: job
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

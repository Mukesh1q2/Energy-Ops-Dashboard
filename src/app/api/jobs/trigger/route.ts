import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model_type, data_source_id, model_config, triggered_by = 'manual' } = body

    // Validate required fields
    if (!model_type || !data_source_id) {
      return NextResponse.json(
        { success: false, error: 'model_type and data_source_id are required' },
        { status: 400 }
      )
    }

    // Validate model type
    const validModelTypes = ['DMO', 'RMO', 'SO']
    if (!validModelTypes.includes(model_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid model_type. Must be one of: ${validModelTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id: data_source_id }
    })

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      )
    }

    // For DMO, check if already run today
    if (model_type === 'DMO') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const existingDMORun = await db.jobRun.findFirst({
        where: {
          model_type: 'DMO',
          data_source_id: data_source_id,
          started_at: {
            gte: today
          },
          status: {
            in: ['success', 'running', 'pending']
          }
        }
      })

      if (existingDMORun) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'DMO has already been run today. Only one DMO run is allowed per day.',
            existing_job_id: existingDMORun.job_id
          },
          { status: 409 }
        )
      }
    }

    // Generate unique job ID
    const job_id = `${model_type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Create job run record
    // If a specific optimization model is provided, attach it
    let model_id: string | undefined = body.model_id
    if (model_id) {
      const mdl = await db.optimizationModel.findUnique({ where: { id: model_id } })
      if (!mdl) model_id = undefined
    }

    const jobRun = await db.jobRun.create({
      data: {
        job_id,
        model_type,
        model_id: model_id,
        data_source_id,
        status: 'pending',
        progress: 0,
        triggered_by,
        model_config: model_config || {}
      }
    })

    // Create initial log entry
    await db.jobLog.create({
      data: {
        job_id,
        level: 'INFO',
        message: `${model_type} optimization job started`,
        metadata: { data_source_id, triggered_by }
      }
    })

    // Start the optimization job asynchronously
    startOptimizationJob(job_id, model_type, data_source_id, model_config)

    return NextResponse.json({
      success: true,
      data: {
        job_id,
        model_type,
        status: 'pending',
        message: `${model_type} optimization job has been queued`
      }
    })
  } catch (error) {
    console.error('Error triggering optimization job:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger optimization job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function startOptimizationJob(
  job_id: string, 
  model_type: string, 
  data_source_id: string,
  model_config: any
) {
  try {
    // Update status to running
    await db.jobRun.update({
      where: { job_id },
      data: { 
        status: 'running',
        progress: 10
      }
    })

    await db.jobLog.create({
      data: {
        job_id,
        level: 'INFO',
        message: 'Job execution started',
        metadata: { model_type }
      }
    })

    // Determine Python script path based on model type or uploaded model
    let scriptPath: string | null = null

    // Prefer specific uploaded optimization model if exists
    const jr = await db.jobRun.findUnique({ where: { job_id }, select: { model_id: true } })
    if (jr?.model_id) {
      const mdl = await db.optimizationModel.findUnique({ where: { id: jr.model_id } })
      if (mdl?.file_path) {
        scriptPath = mdl.file_path
      }
    }

    // Fallback to default script map
    if (!scriptPath) {
      const scriptMap: Record<string, string> = {
        DMO: 'optimization/dmo_optimization.py',
        RMO: 'optimization/rmo_optimization.py',
        SO: 'optimization/so_optimization.py'
      }
      scriptPath = path.join(process.cwd(), scriptMap[model_type])
    }

    // Spawn Python process
    const pythonProcess = spawn('python', [
      scriptPath,
      '--data-source-id', data_source_id,
      '--job-id', job_id,
      '--config', JSON.stringify(model_config || {})
    ])

    let outputBuffer = ''
    let errorBuffer = ''

    pythonProcess.stdout.on('data', async (data) => {
      const output = data.toString()
      outputBuffer += output
      
      // Log progress
      await db.jobLog.create({
        data: {
          job_id,
          level: 'INFO',
          message: output.trim()
        }
      }).catch(console.error)

      // Parse progress if available
      const progressMatch = output.match(/PROGRESS:(\d+)/)
      if (progressMatch) {
        const progress = parseInt(progressMatch[1])
        await db.jobRun.update({
          where: { job_id },
          data: { progress }
        }).catch(console.error)
      }
    })

    pythonProcess.stderr.on('data', async (data) => {
      const error = data.toString()
      errorBuffer += error
      
      await db.jobLog.create({
        data: {
          job_id,
          level: 'ERROR',
          message: error.trim()
        }
      }).catch(console.error)
    })

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        // Success
        await db.jobRun.update({
          where: { job_id },
          data: {
            status: 'success',
            progress: 100,
            completed_at: new Date()
          }
        })

        await db.jobLog.create({
          data: {
            job_id,
            level: 'INFO',
            message: 'Job completed successfully'
          }
        })
      } else {
        // Failed
        await db.jobRun.update({
          where: { job_id },
          data: {
            status: 'failed',
            completed_at: new Date(),
            error_message: errorBuffer || `Process exited with code ${code}`
          }
        })

        await db.jobLog.create({
          data: {
            job_id,
            level: 'ERROR',
            message: `Job failed with exit code ${code}`,
            metadata: { error: errorBuffer }
          }
        })
      }
    })

    pythonProcess.on('error', async (error) => {
      await db.jobRun.update({
        where: { job_id },
        data: {
          status: 'failed',
          completed_at: new Date(),
          error_message: error.message
        }
      })

      await db.jobLog.create({
        data: {
          job_id,
          level: 'ERROR',
          message: `Job execution error: ${error.message}`
        }
      })
    })

  } catch (error) {
    console.error('Error in startOptimizationJob:', error)
    
    await db.jobRun.update({
      where: { job_id },
      data: {
        status: 'failed',
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      }
    }).catch(console.error)

    await db.jobLog.create({
      data: {
        job_id,
        level: 'ERROR',
        message: `Job execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }).catch(console.error)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data_source_id } = body

    if (!data_source_id) {
      return NextResponse.json(
        { success: false, error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    // Path to database and Python script
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    const pythonScript = path.join(process.cwd(), 'optimization_runner.py')

    // Check if Python is available
    let pythonCommand = 'python3'
    try {
      await execAsync('python3 --version')
    } catch {
      try {
        await execAsync('python --version')
        pythonCommand = 'python'
      } catch {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Python not found. Please install Python 3.7 or higher.',
            details: 'Python is required to run optimization models.'
          },
          { status: 500 }
        )
      }
    }

    // Run Python optimization script
    const command = `${pythonCommand} "${pythonScript}" "${dbPath}" "${data_source_id}"`
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      })

      if (stderr && !stderr.includes('warning')) {
        console.error('Python stderr:', stderr)
      }

      // Parse Python script output (JSON)
      const result = JSON.parse(stdout.trim())

      if (result.success) {
        return NextResponse.json({
          success: true,
          data: {
            model_id: result.model_id,
            status: result.status,
            objective_value: result.objective_value,
            solve_time_ms: result.solve_time_ms,
            results_count: result.results_count,
            message: 'Optimization completed successfully'
          }
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Optimization failed',
            details: result.error,
            model_id: result.model_id
          },
          { status: 500 }
        )
      }
    } catch (error: any) {
      console.error('Optimization execution error:', error)
      
      // Check if it's a timeout
      if (error.killed && error.signal === 'SIGTERM') {
        return NextResponse.json(
          {
            success: false,
            error: 'Optimization timeout',
            details: 'The optimization took too long to complete (>5 minutes)'
          },
          { status: 408 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to run optimization',
          details: error.message || 'Unknown error occurred',
          stderr: error.stderr
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in optimization API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process optimization request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check if optimization is available
export async function GET(request: NextRequest) {
  try {
    // Check Python availability
    let pythonAvailable = false
    let pythonVersion = ''
    
    try {
      const { stdout } = await execAsync('python3 --version')
      pythonAvailable = true
      pythonVersion = stdout.trim()
    } catch {
      try {
        const { stdout } = await execAsync('python --version')
        pythonAvailable = true
        pythonVersion = stdout.trim()
      } catch {
        pythonAvailable = false
      }
    }

    // Check PuLP availability
    let pulpAvailable = false
    if (pythonAvailable) {
      try {
        const pythonCommand = pythonVersion.includes('python3') ? 'python3' : 'python'
        await execAsync(`${pythonCommand} -c "import pulp"`)
        pulpAvailable = true
      } catch {
        pulpAvailable = false
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        python_available: pythonAvailable,
        python_version: pythonVersion,
        pulp_available: pulpAvailable,
        optimization_ready: pythonAvailable && pulpAvailable,
        install_command: pulpAvailable ? null : 'pip install pulp'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check optimization availability',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

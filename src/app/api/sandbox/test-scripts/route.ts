// src/app/api/sandbox/test-scripts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTestScriptExecutor } from '@/lib/socket';

/**
 * GET /api/sandbox/test-scripts
 * List all active test scripts
 */
export async function GET(request: NextRequest) {
  try {
    const scripts = await db.testScript.findMany({
      where: { status: 'active' },
      orderBy: { uploaded_at: 'desc' },
      include: {
        executions: {
          orderBy: { started_at: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({
      success: true,
      scripts: scripts.map(script => ({
        ...script,
        lastExecution: script.executions[0] || null,
        executions: undefined
      }))
    });
  } catch (error) {
    console.error('Error fetching test scripts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test scripts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sandbox/test-scripts
 * Execute a test script
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scriptId, args } = body;

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    const executor = getTestScriptExecutor();
    if (!executor) {
      return NextResponse.json(
        { success: false, error: 'Test script executor not initialized' },
        { status: 500 }
      );
    }

    // Execute script asynchronously
    executor.executeScript({ scriptId, args }).catch(error => {
      console.error('Script execution error:', error);
    });

    return NextResponse.json({
      success: true,
      message: 'Script execution started',
      status: 'running'
    });

  } catch (error) {
    console.error('Error executing test script:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute test script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sandbox/test-scripts?id={scriptId}
 * Archive a test script
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get('id');

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    await db.testScript.update({
      where: { id: scriptId },
      data: { status: 'archived' }
    });

    return NextResponse.json({
      success: true,
      message: 'Script archived successfully'
    });

  } catch (error) {
    console.error('Error archiving script:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive script' },
      { status: 500 }
    );
  }
}

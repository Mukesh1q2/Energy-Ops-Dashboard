import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';

/**
 * GET /api/sandbox/scripts
 * List all uploaded Python scripts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const scripts = await db.testScript.findMany({
      where: status !== 'all' ? { status } : undefined,
      take: limit,
      skip: offset,
      orderBy: { uploaded_at: 'desc' },
      include: {
        executions: {
          take: 1,
          orderBy: { started_at: 'desc' }
        },
        _count: {
          select: { executions: true }
        }
      }
    });

    const total = await db.testScript.count({
      where: status !== 'all' ? { status } : undefined
    });

    return NextResponse.json({
      success: true,
      data: {
        scripts: scripts.map(script => ({
          id: script.id,
          scriptName: script.script_name,
          originalFilename: script.original_filename,
          fileSize: script.file_size,
          uploadedBy: script.uploaded_by,
          uploadedAt: script.uploaded_at,
          status: script.status,
          description: script.description,
          lastRunAt: script.last_run_at,
          totalRuns: script.total_runs,
          executionCount: script._count.executions,
          lastExecution: script.executions[0] || null
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch scripts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sandbox/scripts
 * Delete a script
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('id');

    if (!scriptId) {
      return NextResponse.json(
        { success: false, error: 'Script ID is required' },
        { status: 400 }
      );
    }

    // Get script info
    const script = await prisma.testScript.findUnique({
      where: { id: scriptId }
    });

    if (!script) {
      return NextResponse.json(
        { success: false, error: 'Script not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      await fs.unlink(script.file_path);
    } catch (error) {
      console.warn('Failed to delete script file:', error);
      // Continue with database deletion even if file delete fails
    }

    // Delete from database (cascade will delete executions and logs)
    await db.testScript.delete({
      where: { id: scriptId }
    });

    // Create activity log
    await db.activity.create({
      data: {
        type: 'sandbox',
        action: 'deleted',
        title: 'Python Script Deleted',
        description: `Script "${script.original_filename}" deleted`,
        entity_type: 'TestScript',
        entity_id: scriptId,
        status: 'success'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Script deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

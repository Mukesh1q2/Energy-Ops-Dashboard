// src/app/api/optimization/models/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/optimization/models
 * List all optimization models with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelType = searchParams.get('modelType');
    const status = searchParams.get('status') || 'active';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (modelType) {
      where.model_type = modelType;
    }
    if (status) {
      where.status = status;
    }

    const models = await db.optimizationModel.findMany({
      where,
      orderBy: { uploaded_at: 'desc' },
      take: limit,
      include: {
        jobRuns: {
          orderBy: { started_at: 'desc' },
          take: 1 // Get last run
        }
      }
    });

    // Get counts by type
    const counts = await db.optimizationModel.groupBy({
      by: ['model_type'],
      where: { status: 'active' },
      _count: true
    });

    return NextResponse.json({
      success: true,
      models: models.map(model => ({
        ...model,
        lastRun: model.jobRuns[0] || null,
        jobRuns: undefined // Remove from response
      })),
      counts: counts.reduce((acc, item) => {
        acc[item.model_type] = item._count;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/optimization/models?id={modelId}
 * Delete or archive a model
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get('id');
    const archive = searchParams.get('archive') === 'true';

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required' },
        { status: 400 }
      );
    }

    if (archive) {
      // Archive instead of delete
      await db.optimizationModel.update({
        where: { id: modelId },
        data: { status: 'archived' }
      });

      return NextResponse.json({
        success: true,
        message: 'Model archived successfully'
      });
    } else {
      // Check if model has associated job runs
      const jobCount = await db.jobRun.count({
        where: { model_id: modelId }
      });

      if (jobCount > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete model with associated job runs. Archive it instead.'
          },
          { status: 400 }
        );
      }

      await db.optimizationModel.delete({
        where: { id: modelId }
      });

      return NextResponse.json({
        success: true,
        message: 'Model deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

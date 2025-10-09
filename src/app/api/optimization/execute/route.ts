// src/app/api/optimization/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOptimizationExecutor } from '@/lib/socket';

/**
 * POST /api/optimization/execute
 * Execute an optimization model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelId, modelType, dataSourceId, config } = body;

    // Validation
    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'Model ID is required' },
        { status: 400 }
      );
    }

    if (!modelType || !['DMO', 'RMO', 'SO'].includes(modelType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model type' },
        { status: 400 }
      );
    }

    // Verify model exists
    const model = await prisma.optimizationModel.findUnique({
      where: { id: modelId }
    });

    if (!model) {
      return NextResponse.json(
        { success: false, error: 'Model not found' },
        { status: 404 }
      );
    }

    if (model.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Model is not active' },
        { status: 400 }
      );
    }

    // Get data source (use first available if not specified)
    let resolvedDataSourceId = dataSourceId;
    if (!resolvedDataSourceId) {
      const dataSource = await prisma.dataSource.findFirst({
        where: { status: 'connected' }
      });
      if (!dataSource) {
        return NextResponse.json(
          { success: false, error: 'No active data source found' },
          { status: 400 }
        );
      }
      resolvedDataSourceId = dataSource.id;
    }

    // Get optimization executor
    const executor = getOptimizationExecutor();
    if (!executor) {
      return NextResponse.json(
        { success: false, error: 'Optimization executor not initialized' },
        { status: 500 }
      );
    }

    // Execute model (async - returns immediately with job ID)
    const result = await executor.executeModel({
      modelId,
      modelType: modelType as 'DMO' | 'RMO' | 'SO',
      dataSourceId: resolvedDataSourceId,
      triggeredBy: 'manual',
      modelConfig: config
    });

    return NextResponse.json({
      success: true,
      message: 'Model execution started',
      jobId: result.jobId,
      status: result.status,
      logFilePath: result.logFilePath
    });

  } catch (error) {
    console.error('Error executing model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/optimization/execute?jobId={jobId}
 * Get status of a running job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const executor = getOptimizationExecutor();
    if (!executor) {
      return NextResponse.json(
        { success: false, error: 'Optimization executor not initialized' },
        { status: 500 }
      );
    }

    const jobStatus = await executor.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: jobStatus
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

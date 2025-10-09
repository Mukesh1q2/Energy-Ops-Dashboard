import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mutationLimiter, withRateLimit } from '@/lib/rate-limit';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Apply rate limiting
  return withRateLimit(request, mutationLimiter, async () => {
  try {
    const { id } = await context.params;

    // First check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id },
      include: {
        columns: true,
        charts: true
      }
    });

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      );
    }

    // Delete related columns first
    await db.dataSourceColumn.deleteMany({
      where: { data_source_id: id }
    });

    // Delete related charts
    await db.dashboardChart.deleteMany({
      where: { data_source_id: id }
    });

    // If it's a file-based source, drop the dynamic table
    if (dataSource.type === 'file' && dataSource.config) {
      const config = dataSource.config as any;
      if (config.tableName) {
        try {
          await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "${config.tableName}"`);
        } catch (error) {
          console.error('Error dropping table:', error);
          // Continue with deletion even if table drop fails
        }
      }
    }

    // Delete the data source
    await db.dataSource.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Data source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete data source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
  }) // Close withRateLimit
}

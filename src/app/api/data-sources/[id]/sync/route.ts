import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id }
    });

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      );
    }

    // Get record count from dynamic table
    let recordCount = 0;
    if (dataSource.type === 'file' && dataSource.config) {
      const config = dataSource.config as any;
      if (config.tableName) {
        try {
          const result = await db.$queryRawUnsafe<Array<{ count: number }>>(
            `SELECT COUNT(*) as count FROM "${config.tableName}"`
          );
          recordCount = result[0]?.count || 0;
        } catch (error) {
          console.error('Error counting records:', error);
        }
      }
    }

    // Update data source with last sync time and record count
    const updatedSource = await db.dataSource.update({
      where: { id },
      data: {
        last_sync: new Date(),
        record_count: recordCount,
        status: 'connected'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Data source synced successfully',
      data: {
        id: updatedSource.id,
        name: updatedSource.name,
        recordCount,
        lastSync: updatedSource.last_sync
      }
    });
  } catch (error) {
    console.error('Error syncing data source:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync data source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

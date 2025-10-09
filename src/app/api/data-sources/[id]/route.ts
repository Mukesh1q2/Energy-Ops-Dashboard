import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/with-auth'
import { storage } from '@/lib/storage'

/**
 * DELETE /api/data-sources/[id]
 * Delete a data source and all associated data
 */
export const DELETE = withAdminAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params

    // Check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id },
      include: {
        columns: true,
        _count: {
          select: {
            marketSnapshotData: true
          }
        }
      }
    })

    if (!dataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // Start transaction to ensure data consistency
    await db.$transaction(async (prisma) => {
      // Delete associated market snapshot data records
      if (dataSource._count.marketSnapshotData > 0) {
        await prisma.marketSnapshotData.deleteMany({
          where: { data_source_id: id }
        })
      }

      // Delete associated columns
      await prisma.dataSourceColumn.deleteMany({
        where: { data_source_id: id }
      })

      // Delete charts that might be using this data source
      await prisma.chart.deleteMany({
        where: { data_source_id: id }
      })

      // Delete the data source
      await prisma.dataSource.delete({
        where: { id }
      })
    })

    // Try to delete associated files from storage if they exist
    if (dataSource.file_path) {
      try {
        await storage.delete(dataSource.file_path)
      } catch (fileError) {
        console.warn('Failed to delete file:', dataSource.file_path, fileError)
        // Don't fail the whole operation if file deletion fails
      }
    }

    // Log the deletion for audit trail
    console.log(`Data source deleted: ${dataSource.name} (${id}) by user: ${request.user?.email}`, {
      deletedRecords: dataSource._count.marketSnapshotData,
      deletedColumns: dataSource.columns.length,
      deletedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Data source deleted successfully',
      details: {
        name: dataSource.name,
        recordsDeleted: dataSource._count.marketSnapshotData,
        columnsDeleted: dataSource.columns.length
      }
    })

  } catch (error) {
    console.error('Error deleting data source:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete data source',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

/**
 * GET /api/data-sources/[id]
 * Get detailed information about a specific data source
 */
export const GET = withAdminAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params

    const dataSource = await db.dataSource.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { column_name: 'asc' }
        },
        charts: {
          select: {
            id: true,
            title: true,
            chart_type: true,
            created_at: true
          }
        },
        _count: {
          select: {
            marketSnapshotData: true
          }
        }
      }
    })

    if (!dataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // Get sample data for the first few records
    let sampleData: any[] = []
    try {
      const samples = await db.marketSnapshotData.findMany({
        where: { data_source_id: id },
        take: 5,
        orderBy: { created_at: 'desc' }
      })
      sampleData = samples.map(record => ({
        time_period: record.time_period?.toISOString(),
        timeblock: record.timeblock,
        dam_price: record.dam_price,
        gdam_price: record.gdam_price,
        rtm_price: record.rtm_price,
        scheduled_mw: record.scheduled_mw,
        modelresult_mw: record.modelresult_mw
      }))
    } catch (sampleError) {
      console.warn('Could not fetch sample data for data source:', id)
    }

    return NextResponse.json({
      success: true,
      dataSource: {
        ...dataSource,
        recordCount: dataSource._count.marketSnapshotData,
        sampleData
      }
    })

  } catch (error) {
    console.error('Error fetching data source:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data source',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

/**
 * PATCH /api/data-sources/[id]
 * Update data source properties (name, description, status, column mappings)
 */
export const PATCH = withAdminAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params
    const body = await request.json()

    const {
      name,
      description,
      status,
      columnUpdates
    } = body

    // Check if data source exists
    const existingDataSource = await db.dataSource.findUnique({
      where: { id },
      include: { columns: true }
    })

    if (!existingDataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // Update in transaction
    const updatedDataSource = await db.$transaction(async (prisma) => {
      // Update basic data source properties
      const updated = await prisma.dataSource.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(status && { status }),
          updated_at: new Date()
        }
      })

      // Update column mappings if provided
      if (columnUpdates && Array.isArray(columnUpdates)) {
        for (const colUpdate of columnUpdates) {
          if (colUpdate.id) {
            await prisma.dataSourceColumn.update({
              where: { id: colUpdate.id },
              data: {
                ...(colUpdate.label && { label: colUpdate.label }),
                ...(colUpdate.expose_as_filter !== undefined && { expose_as_filter: colUpdate.expose_as_filter }),
                ...(colUpdate.data_type && { data_type: colUpdate.data_type })
              }
            })
          }
        }
      }

      return updated
    })

    // Log the update
    console.log(`Data source updated: ${updatedDataSource.name} (${id}) by user: ${request.user?.email}`)

    return NextResponse.json({
      success: true,
      message: 'Data source updated successfully',
      dataSource: updatedDataSource
    })

  } catch (error) {
    console.error('Error updating data source:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update data source',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
});
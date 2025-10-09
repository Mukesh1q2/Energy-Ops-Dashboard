import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdminAuth, type AuthenticatedRequest } from '@/lib/with-auth'

/**
 * GET /api/data-sources/[id]/columns
 * Get column information for a data source
 */
export const GET = withAdminAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params

    // Check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!dataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // Fetch columns with their mapping information
    const columns = await db.dataSourceColumn.findMany({
      where: { data_source_id: id },
      orderBy: { column_name: 'asc' }
    })

    return NextResponse.json({
      success: true,
      dataSource: {
        id: dataSource.id,
        name: dataSource.name
      },
      columns
    })

  } catch (error) {
    console.error('Error fetching data source columns:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch columns',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

/**
 * PUT /api/data-sources/[id]/columns
 * Update column mappings for a data source
 */
export const PUT = withAdminAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params
    const body = await request.json()

    const { columns } = body

    if (!Array.isArray(columns)) {
      return NextResponse.json({
        success: false,
        error: 'Column mappings must be provided as an array'
      }, { status: 400 })
    }

    // Check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!dataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // Update column mappings in transaction
    const updatedColumns = await db.$transaction(async (prisma) => {
      const results = []

      for (const columnData of columns) {
        const {
          column_name,
          data_type,
          label,
          expose_as_filter,
          sample_values
        } = columnData

        if (!column_name) {
          continue // Skip invalid columns
        }

        // Upsert column (update if exists, create if not)
        const updatedColumn = await prisma.dataSourceColumn.upsert({
          where: {
            data_source_id_column_name: {
              data_source_id: id,
              column_name
            }
          },
          update: {
            data_type: data_type || 'STRING',
            label: label || column_name,
            expose_as_filter: expose_as_filter || false,
            sample_values: Array.isArray(sample_values) ? sample_values : []
          },
          create: {
            data_source_id: id,
            column_name,
            data_type: data_type || 'STRING',
            label: label || column_name,
            expose_as_filter: expose_as_filter || false,
            sample_values: Array.isArray(sample_values) ? sample_values : []
          }
        })

        results.push(updatedColumn)
      }

      return results
    })

    // Log the mapping update
    console.log(`Column mappings updated for data source: ${dataSource.name} (${id}) by user: ${request.user?.email}`, {
      columnsUpdated: updatedColumns.length,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Column mappings updated successfully',
      columns: updatedColumns
    })

  } catch (error) {
    console.error('Error updating column mappings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update column mappings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
})

/**
 * POST /api/data-sources/[id]/columns/detect
 * Auto-detect column mappings from uploaded data
 */
export const POST = withAdminAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params
    const body = await request.json()
    const { sampleData } = body

    if (!Array.isArray(sampleData) || sampleData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Sample data must be provided as a non-empty array'
      }, { status: 400 })
    }

    // Check if data source exists
    const dataSource = await db.dataSource.findUnique({
      where: { id },
      select: { id: true, name: true }
    })

    if (!dataSource) {
      return NextResponse.json({
        success: false,
        error: 'Data source not found'
      }, { status: 404 })
    }

    // Auto-detect column types and generate mappings
    const firstRow = sampleData[0]
    const columnMappings = []

    for (const [columnName, value] of Object.entries(firstRow)) {
      // Detect data type
      let dataType = 'STRING'
      const sampleValues = sampleData.map(row => row[columnName]).filter(v => v !== null && v !== undefined)
      
      if (sampleValues.length > 0) {
        // Check if all values are numbers
        if (sampleValues.every(v => !isNaN(Number(v)))) {
          dataType = sampleValues.some(v => String(v).includes('.')) ? 'DECIMAL' : 'INTEGER'
        }
        // Check if values look like dates
        else if (sampleValues.some(v => !isNaN(Date.parse(String(v))))) {
          dataType = 'DATETIME'
        }
        // Check if values are boolean-like
        else if (sampleValues.every(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase()))) {
          dataType = 'BOOLEAN'
        }
      }

      // Generate suggested label (capitalize and replace underscores)
      const suggestedLabel = columnName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')

      // Determine if should be exposed as filter
      const uniqueValues = [...new Set(sampleValues)]
      const shouldExposeAsFilter = uniqueValues.length <= 50 && uniqueValues.length > 1

      columnMappings.push({
        column_name: columnName,
        data_type: dataType,
        label: suggestedLabel,
        expose_as_filter: shouldExposeAsFilter,
        sample_values: uniqueValues.slice(0, 20), // Limit sample values
        suggested: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Column mappings detected successfully',
      columnMappings,
      detectionInfo: {
        totalColumns: columnMappings.length,
        suggestedFilters: columnMappings.filter(c => c.expose_as_filter).length,
        dataTypes: columnMappings.reduce((acc, c) => {
          acc[c.data_type] = (acc[c.data_type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    })

  } catch (error) {
    console.error('Error detecting column mappings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to detect column mappings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
});
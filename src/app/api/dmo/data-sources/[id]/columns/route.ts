import { NextRequest, NextResponse } from 'next/server'
import { getFilterableColumns } from '@/lib/data-source-manager'

/**
 * GET /api/dmo/data-sources/[id]/columns
 * Get filterable columns for a data source
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dataSourceId = params.id

    const columns = await getFilterableColumns(dataSourceId)

    return NextResponse.json({
      success: true,
      columns,
      count: columns.length,
    })
  } catch (error) {
    console.error('Error fetching filterable columns:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filterable columns',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

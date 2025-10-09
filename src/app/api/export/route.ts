import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, // 'optimization', 'datasource', 'dashboard'
      format, // 'csv', 'excel', 'json'
      data_source_id,
      model_id,
      filters
    } = body

    if (!type || !format) {
      return NextResponse.json(
        { success: false, error: 'Export type and format are required' },
        { status: 400 }
      )
    }

    let data: any[] = []
    let filename = ''

    // Fetch data based on type
    switch (type) {
      case 'optimization':
        const where: any = {}
        if (data_source_id) where.data_source_id = data_source_id
        if (model_id) where.model_id = model_id
        if (filters) Object.assign(where, filters)

        data = await db.optimizationResult.findMany({
          where,
          orderBy: { created_at: 'desc' }
        })
        filename = `optimization_results_${new Date().toISOString().split('T')[0]}`
        break

      case 'datasource':
        if (!data_source_id) {
          return NextResponse.json(
            { success: false, error: 'data_source_id is required for datasource export' },
            { status: 400 }
          )
        }

        const dataSource = await db.dataSource.findUnique({
          where: { id: data_source_id }
        })

        if (!dataSource || !dataSource.config || typeof dataSource.config !== 'object') {
          return NextResponse.json(
            { success: false, error: 'Data source not found or not configured' },
            { status: 404 }
          )
        }

        const config = dataSource.config as { tableName?: string }
        if (!config.tableName) {
          return NextResponse.json(
            { success: false, error: 'Data source table not configured' },
            { status: 400 }
          )
        }

        // Query data from data source table
        data = await db.$queryRawUnsafe(`SELECT * FROM "${config.tableName}" LIMIT 10000`)
        filename = `datasource_${dataSource.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}`
        break

      case 'dashboard':
        // Export dashboard configuration
        const charts = await db.dashboardChart.findMany({
          where: data_source_id ? { data_source_id } : {},
          include: { dataSource: true }
        })
        data = charts
        filename = `dashboard_export_${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid export type' },
          { status: 400 }
        )
    }

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data to export' },
        { status: 404 }
      )
    }

    // Convert data to requested format
    let exportData: string | Buffer
    let contentType: string
    let fileExtension: string

    switch (format) {
      case 'csv':
        exportData = convertToCSV(data)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break

      case 'json':
        exportData = JSON.stringify(data, null, 2)
        contentType = 'application/json'
        fileExtension = 'json'
        break

      case 'excel':
        // For Excel, we'll return CSV for now
        // Full Excel support requires additional libraries
        exportData = convertToCSV(data)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid export format' },
          { status: 400 }
        )
    }

    // Return file download response
    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}.${fileExtension}"`,
        'Content-Length': exportData.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  // Get all unique keys from all objects
  const allKeys = Array.from(
    new Set(data.flatMap(obj => Object.keys(obj)))
  )

  // Create header row
  const headers = allKeys.join(',')

  // Create data rows
  const rows = data.map(obj => {
    return allKeys.map(key => {
      let value = obj[key]
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return ''
      }
      
      // Handle dates
      if (value instanceof Date) {
        value = value.toISOString()
      }
      
      // Handle objects/arrays
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      
      // Convert to string and escape quotes
      value = String(value).replace(/"/g, '""')
      
      // Wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value}"`
      }
      
      return value
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

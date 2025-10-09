import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dataSourceId = searchParams.get('data_source_id')
    const format = searchParams.get('format') || 'csv'
    const includeHeaders = searchParams.get('include_headers') === 'true'
    const limitStr = searchParams.get('limit') || 'all'
    const limit = limitStr === 'all' ? undefined : parseInt(limitStr)

    if (!dataSourceId) {
      return NextResponse.json(
        { success: false, error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    // Get the data source
    const dataSource = await db.dataSource.findUnique({
      where: { id: dataSourceId },
    })

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      )
    }

    // Get the columns for this data source
    const columns = await db.dataSourceColumn.findMany({
      where: { data_source_id: dataSourceId },
      orderBy: { column_name: 'asc' }
    })

    // Fetch data from ElectricityData table
    const data = await db.electricityData.findMany({
      take: limit,
      orderBy: { time_period: 'desc' }
    })

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found' },
        { status: 404 }
      )
    }

    const fileName = `${dataSource.name.replace(/\s+/g, '_')}_export_${new Date().toISOString().split('T')[0]}`

    // Export based on format
    if (format === 'json') {
      return new NextResponse(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}.json"`
        }
      })
    } else if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(data[0])
      const csvRows = []
      
      if (includeHeaders) {
        csvRows.push(headers.join(','))
      }

      for (const row of data) {
        const values = headers.map(header => {
          const value = (row as any)[header]
          // Escape values with commas or quotes
          if (value === null || value === undefined) return ''
          const strValue = String(value)
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`
          }
          return strValue
        })
        csvRows.push(values.join(','))
      }

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}.csv"`
        }
      })
    } else if (format === 'excel') {
      // Generate Excel
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}.xlsx"`
        }
      })
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported format' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

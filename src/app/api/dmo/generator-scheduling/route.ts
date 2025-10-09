import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchDMOGeneratorData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const region = searchParams.get('region')
    const state = searchParams.get('state')
    const technologyType = searchParams.get('technologyType')
    const unitName = searchParams.get('unitName')
    const contractName = searchParams.get('contractName')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const exportFormat = searchParams.get('export')

    let whereClause: any = {}
    
    if (region) whereClause.region = { contains: region }
    if (state) whereClause.state = { contains: state }
    if (technologyType) whereClause.technology_type = { contains: technologyType }
    if (unitName) whereClause.plant_name = { contains: unitName }
    if (contractName) whereClause.contract_name = { contains: contractName }
    
    if (from || to) {
      whereClause.time_period = {}
      if (from) whereClause.time_period.gte = new Date(from)
      if (to) whereClause.time_period.lte = new Date(to)
    }

    // Fetch from both Prisma tables and uploaded Excel
    const [prismaData, excelData] = await Promise.all([
      db.dMOGeneratorScheduling.findMany({
        where: whereClause,
        orderBy: {
          time_period: 'asc'
        },
        take: exportFormat ? undefined : 1000 // Limit for non-export requests
      }),
      fetchDMOGeneratorData(1000)
    ])

    // Apply filters to Excel data
    let filteredExcelData = excelData
    if (region) filteredExcelData = filteredExcelData.filter(d => d.region?.toLowerCase().includes(region.toLowerCase()))
    if (state) filteredExcelData = filteredExcelData.filter(d => d.state?.toLowerCase().includes(state.toLowerCase()))
    if (technologyType) filteredExcelData = filteredExcelData.filter(d => d.technology_type?.toLowerCase().includes(technologyType.toLowerCase()))
    if (unitName) filteredExcelData = filteredExcelData.filter(d => d.plant_name?.toLowerCase().includes(unitName.toLowerCase()))
    if (contractName) filteredExcelData = filteredExcelData.filter(d => d.contract_name?.toLowerCase().includes(contractName.toLowerCase()))
    if (from) filteredExcelData = filteredExcelData.filter(d => new Date(d.time_period) >= new Date(from))
    if (to) filteredExcelData = filteredExcelData.filter(d => new Date(d.time_period) <= new Date(to))

    // Merge data from both sources
    const data = [...prismaData, ...filteredExcelData]

    if (exportFormat === 'csv') {
      // Convert to CSV format
      const headers = [
        'Time Period', 'Region', 'State', 'Plant ID', 'Plant Name', 
        'Technology Type', 'Contract Name', 'Scheduled MW', 'Actual MW'
      ]
      
      const csvRows = [
        headers.join(','),
        ...data.map(row => [
          row.time_period.toISOString().split('T')[0],
          row.region,
          row.state,
          row.plant_id,
          row.plant_name,
          row.technology_type,
          row.contract_name || '',
          row.scheduled_mw,
          row.actual_mw || ''
        ].join(','))
      ]
      
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="generator-scheduling.csv"'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data,
      total: data.length
    })

  } catch (error) {
    console.error('Error fetching generator scheduling data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch generator scheduling data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
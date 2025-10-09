import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchMarketBiddingData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const region = searchParams.get('region')
    const state = searchParams.get('state')
    const unitName = searchParams.get('unitName')
    const marketType = searchParams.get('marketType')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const exportFormat = searchParams.get('export')

    let whereClause: any = {}
    
    if (region) whereClause.region = { contains: region }
    if (state) whereClause.state = { contains: state }
    if (unitName) whereClause.plant_name = { contains: unitName }
    if (marketType) whereClause.market_type = { contains: marketType }
    
    if (from || to) {
      whereClause.time_period = {}
      if (from) whereClause.time_period.gte = new Date(from)
      if (to) whereClause.time_period.lte = new Date(to)
    }

    // Fetch from both Prisma tables and uploaded Excel
    const [prismaData, excelData] = await Promise.all([
      db.dMOMarketBidding.findMany({
        where: whereClause,
        orderBy: {
          time_period: 'asc'
        },
        take: exportFormat ? undefined : 1000 // Limit for non-export requests
      }),
      fetchMarketBiddingData(1000)
    ])

    // Apply filters to Excel data
    let filteredExcelData = excelData
    if (region) filteredExcelData = filteredExcelData.filter(d => d.region?.toLowerCase().includes(region.toLowerCase()))
    if (state) filteredExcelData = filteredExcelData.filter(d => d.state?.toLowerCase().includes(state.toLowerCase()))
    if (unitName) filteredExcelData = filteredExcelData.filter(d => d.plant_name?.toLowerCase().includes(unitName.toLowerCase()))
    if (marketType) filteredExcelData = filteredExcelData.filter(d => d.market_type?.toLowerCase().includes(marketType.toLowerCase()))
    if (from) filteredExcelData = filteredExcelData.filter(d => new Date(d.time_period) >= new Date(from))
    if (to) filteredExcelData = filteredExcelData.filter(d => new Date(d.time_period) <= new Date(to))

    // Merge data from both sources
    const data = [...prismaData, ...filteredExcelData]

    if (exportFormat === 'csv') {
      // Convert to CSV format
      const headers = [
        'Time Period', 'Region', 'State', 'Plant ID', 'Plant Name', 'Market Type',
        'Bid Price (Rs/MWh)', 'Bid Volume (MW)', 'Clearing Price (Rs/MWh)', 'Cleared Volume (MW)'
      ]
      
      const csvRows = [
        headers.join(','),
        ...data.map(row => [
          row.time_period.toISOString().split('T')[0],
          row.region,
          row.state,
          row.plant_id,
          row.plant_name,
          row.market_type,
          row.bid_price_rs_per_mwh,
          row.bid_volume_mw,
          row.clearing_price_rs_per_mwh || '',
          row.cleared_volume_mw || ''
        ].join(','))
      ]
      
      return new NextResponse(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="market-bidding.csv"'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data,
      total: data.length
    })

  } catch (error) {
    console.error('Error fetching market bidding data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch market bidding data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchStorageData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const storageType = searchParams.get('storageType')
    const timeframe = searchParams.get('timeframe') || '24h'

    // Build where clause based on filters
    const where: any = {}
    
    if (region && region !== 'all') {
      where.region = region
    }
    
    if (storageType && storageType !== 'all') {
      where.technology_type = storageType
    }

    // Calculate time range based on timeframe
    const now = new Date()
    let timeFilter = {}
    
    switch (timeframe) {
      case '1h':
        timeFilter = { gte: new Date(now.getTime() - 60 * 60 * 1000) }
        break
      case '24h':
        timeFilter = { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        break
      case '7d':
        timeFilter = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        break
      case '30d':
        timeFilter = { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        break
    }

    if (Object.keys(timeFilter).length > 0) {
      where.time_period = timeFilter
    }

    // Fetch storage-related data from ElectricityData table
    // We'll look for records with technology_type containing storage-related terms
    // or capacity_mw data that could represent storage
    const storageData = await db.electricityData.findMany({
      where: {
        ...where,
        OR: [
          { technology_type: { contains: 'Storage' } },
          { technology_type: { contains: 'storage' } },
          { technology_type: { contains: 'Battery' } },
          { technology_type: { contains: 'battery' } },
          { technology_type: { contains: 'Pumped' } },
          { technology_type: { contains: 'pumped' } },
          { resource_type: { contains: 'Storage' } },
          { resource_type: { contains: 'storage' } },
          { capacity_mw: { gt: 0 } } // Include any capacity data as potential storage
        ]
      },
      orderBy: { time_period: 'desc' },
      take: 1000 // Limit to prevent too much data
    })

    // Fetch storage data from uploaded Excel files
    let excelData: any[] = []
    try {
      const storageExcelData = await fetchStorageData(1000)
      // Filter by region if specified
      excelData = storageExcelData
        .filter(item => region === 'all' || !region || item.region === region)
        .filter(item => storageType === 'all' || !storageType || item.storage_type === storageType)
        .map(item => ({
          id: item.id,
          time_period: new Date(item.time_period),
          region: item.region,
          state: item.state,
          technology_type: item.storage_type,
          capacity_mw: item.capacity_mw,
          generation_mw: item.charge_mw,
          demand_mw: item.discharge_mw,
          resource_type: 'Storage',
          state_of_charge_percent: item.state_of_charge_percent,
          efficiency_percent: item.efficiency_percent,
          cycles: item.cycles
        }))
    } catch (err) {
      console.log('No Excel storage data available:', err)
    }

    // Merge Prisma data with Excel data
    const allStorageData = [...storageData, ...excelData]

    // Transform data for storage charts with real calculations
    const transformedData = allStorageData.map((item, index, array) => {
      const capacity = item.capacity_mw || 100 // Default capacity if not available
      const chargeMw = item.generation_mw || 0
      const dischargeMw = item.demand_mw || 0
      
      // Use pre-calculated values from Excel data if available
      let stateOfChargePercent = item.state_of_charge_percent
      let efficiency = item.efficiency_percent
      let cycles = item.cycles || 0
      
      // If not available, calculate state of charge based on charge/discharge balance
      if (stateOfChargePercent === undefined || stateOfChargePercent === null) {
        // SOC = (Current Charge / Capacity) * 100
        const netCharge = chargeMw - dischargeMw
        stateOfChargePercent = capacity > 0 
          ? Math.max(0, Math.min(100, (chargeMw / capacity) * 100))
          : 50
      }
      
      // Calculate efficiency from actual charge/discharge data if not provided
      if (efficiency === undefined || efficiency === null) {
        // Efficiency = (Energy Out / Energy In) * 100
        efficiency = chargeMw > 0 
          ? Math.min(100, (dischargeMw / chargeMw) * 100)
          : 90 // Default efficiency if no charge data
      }
      
      // Count cycles based on charge/discharge transitions if not provided
      if (!cycles && index > 0) {
        const prevItem = array[index - 1]
        const prevCharge = prevItem.generation_mw || 0
        const prevDischarge = prevItem.demand_mw || 0
        
        // If we were charging and now discharging, or vice versa, count as half cycle
        if ((chargeMw > dischargeMw && prevCharge < prevDischarge) ||
            (chargeMw < dischargeMw && prevCharge > prevDischarge)) {
          cycles = 0.5
        }
      }
      
      return {
        id: item.id,
        time_period: item.time_period.toISOString(),
        region: item.region,
        state: item.state,
        storage_type: item.technology_type || 'Storage',
        capacity_mw: capacity,
        charge_mw: chargeMw,
        discharge_mw: dischargeMw,
        state_of_charge_percent: Math.round(stateOfChargePercent * 10) / 10,
        efficiency_percent: Math.round(efficiency * 10) / 10,
        cycles: cycles
      }
    })

    // Get unique filter options from the merged data
    const uniqueRegions = [...new Set(allStorageData.map(item => item.region).filter(Boolean))]
    const uniqueStorageTypes = [...new Set(allStorageData.map(item => item.technology_type).filter(Boolean))]

    return NextResponse.json({
      success: true,
      data: {
        storageData: transformedData,
        filterOptions: {
          regions: uniqueRegions,
          storageTypes: uniqueStorageTypes.length > 0 ? uniqueStorageTypes : ['Battery', 'Pumped Hydro', 'Compressed Air']
        }
      }
    })

  } catch (error) {
    console.error('Error fetching storage data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch storage data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
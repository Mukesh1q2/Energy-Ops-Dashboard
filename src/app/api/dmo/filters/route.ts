import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchDMOGeneratorData, fetchDMOContractData, fetchMarketBiddingData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type') || 'all'

    const filterOptions: any = {
      technologyTypes: [],
      unitNames: [],
      contractNames: [],
      contractTypes: [],
      marketTypes: [],
      regions: [],
      states: [],
      timeBlocks: [],
      modelIds: [],
      priceRanges: {
        damPrice: { min: 0, max: 0 },
        gdamPrice: { min: 0, max: 0 },
        rtmPrice: { min: 0, max: 0 }
      },
      scheduledMwRange: { min: 0, max: 0 },
      timePeriods: { earliest: null, latest: null }
    }

    // Also fetch data from uploaded Excel files
    const [excelGeneratorData, excelContractData, excelMarketData] = await Promise.all([
      fetchDMOGeneratorData(10000),
      fetchDMOContractData(10000),
      fetchMarketBiddingData(10000)
    ])

    if (dataType === 'all' || dataType === 'generator') {
      // Get unique technology types from generator scheduling (Prisma)
      const generatorData = await db.dMOGeneratorScheduling.findMany({
        select: {
          technology_type: true,
          plant_name: true,
          contract_name: true,
          region: true,
          state: true
        },
        distinct: ['technology_type', 'plant_name', 'contract_name', 'region', 'state']
      })

      // Merge with Excel data
      const allGeneratorData = [...generatorData, ...excelGeneratorData]

      filterOptions.technologyTypes = [...new Set(allGeneratorData.map(g => g.technology_type))].filter(Boolean).sort()
      filterOptions.unitNames = [...new Set(allGeneratorData.map(g => g.plant_name))].filter(Boolean).sort()
      filterOptions.contractNames = [...new Set(allGeneratorData.map(g => g.contract_name))].filter(Boolean).sort()
      filterOptions.regions = [...new Set(allGeneratorData.map(g => g.region))].filter(Boolean).sort()
      filterOptions.states = [...new Set(allGeneratorData.map(g => g.state))].filter(Boolean).sort()
    }

    if (dataType === 'all' || dataType === 'contract') {
      // Get unique contract types and names from contract scheduling (Prisma)
      const contractData = await db.dMOContractScheduling.findMany({
        select: {
          contract_type: true,
          contract_name: true,
          region: true,
          state: true
        },
        distinct: ['contract_type', 'contract_name', 'region', 'state']
      })

      // Merge with Excel data
      const allContractData = [...contractData, ...excelContractData]

      filterOptions.contractTypes = [...new Set(allContractData.map(c => c.contract_type))].filter(Boolean).sort()
      filterOptions.contractNames = [...new Set([
        ...filterOptions.contractNames,
        ...allContractData.map(c => c.contract_name)
      ])].filter(Boolean).sort()
      
      filterOptions.regions = [...new Set([
        ...filterOptions.regions,
        ...allContractData.map(c => c.region)
      ])].filter(Boolean).sort()
      filterOptions.states = [...new Set([
        ...filterOptions.states,
        ...allContractData.map(c => c.state)
      ])].filter(Boolean).sort()
    }

    if (dataType === 'all' || dataType === 'market') {
      // Get unique market types and unit names from market bidding (Prisma)
      const marketData = await db.dMOMarketBidding.findMany({
        select: {
          market_type: true,
          plant_name: true,
          region: true,
          state: true
        },
        distinct: ['market_type', 'plant_name', 'region', 'state']
      })

      // Merge with Excel data
      const allMarketData = [...marketData, ...excelMarketData]

      filterOptions.marketTypes = [...new Set(allMarketData.map(m => m.market_type))].filter(Boolean).sort()
      filterOptions.unitNames = [...new Set([
        ...filterOptions.unitNames,
        ...allMarketData.map(m => m.plant_name)
      ])].filter(Boolean).sort()
      
      filterOptions.regions = [...new Set([
        ...filterOptions.regions,
        ...allMarketData.map(m => m.region)
      ])].filter(Boolean).sort()
      filterOptions.states = [...new Set([
        ...filterOptions.states,
        ...allMarketData.map(m => m.state)
      ])].filter(Boolean).sort()
    }

    // Extract additional filter options from Excel data
    if (excelGeneratorData.length > 0 || excelContractData.length > 0 || excelMarketData.length > 0) {
      const allExcelData = [...excelGeneratorData, ...excelContractData, ...excelMarketData]
      
      // Extract TimeBlocks (from RMO data which has timeblock field)
      const timeBlocks = allExcelData
        .map(d => (d as any).time_block || (d as any).TimeBlock)
        .filter(Boolean)
      filterOptions.timeBlocks = [...new Set(timeBlocks)].sort((a, b) => Number(a) - Number(b))
      
      // Extract ModelIDs
      const modelIds = allExcelData
        .map(d => (d as any).model_id || (d as any).ModelID)
        .filter(Boolean)
      filterOptions.modelIds = [...new Set(modelIds)].sort()
      
      // Calculate price ranges
      const damPrices = allExcelData
        .map(d => (d as any).bid_price_rs_per_mwh || (d as any).DAMPrice)
        .filter(p => p && !isNaN(p))
      const gdamPrices = allExcelData
        .map(d => (d as any).clearing_price_rs_per_mwh || (d as any).GDAMPrice)
        .filter(p => p && !isNaN(p))
      const rtmPrices = allExcelData
        .map(d => (d as any).RTMPrice)
        .filter(p => p && !isNaN(p))
      
      if (damPrices.length > 0) {
        filterOptions.priceRanges.damPrice = {
          min: Math.min(...damPrices),
          max: Math.max(...damPrices)
        }
      }
      if (gdamPrices.length > 0) {
        filterOptions.priceRanges.gdamPrice = {
          min: Math.min(...gdamPrices),
          max: Math.max(...gdamPrices)
        }
      }
      if (rtmPrices.length > 0) {
        filterOptions.priceRanges.rtmPrice = {
          min: Math.min(...rtmPrices),
          max: Math.max(...rtmPrices)
        }
      }
      
      // Calculate scheduled MW range
      const scheduledMws = allExcelData
        .map(d => d.scheduled_mw || (d as any).ScheduledMW)
        .filter(mw => mw && !isNaN(mw))
      if (scheduledMws.length > 0) {
        filterOptions.scheduledMwRange = {
          min: Math.min(...scheduledMws),
          max: Math.max(...scheduledMws)
        }
      }
      
      // Extract time period range
      const timePeriods = allExcelData
        .map(d => d.time_period)
        .filter(Boolean)
        .map(t => new Date(t))
        .filter(d => !isNaN(d.getTime()))
      if (timePeriods.length > 0) {
        filterOptions.timePeriods = {
          earliest: new Date(Math.min(...timePeriods.map(d => d.getTime()))),
          latest: new Date(Math.max(...timePeriods.map(d => d.getTime())))
        }
      }
    }

    // All arrays already sorted above, but ensure consistency
    Object.keys(filterOptions).forEach(key => {
      if (Array.isArray(filterOptions[key])) {
        filterOptions[key] = [...new Set(filterOptions[key])].filter(Boolean).sort()
      }
    })

    return NextResponse.json({
      success: true,
      data: filterOptions
    })

  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch filter options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
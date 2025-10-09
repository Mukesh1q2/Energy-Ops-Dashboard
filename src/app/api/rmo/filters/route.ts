import { NextRequest, NextResponse } from 'next/server'
import { fetchRMOData } from '@/lib/excel-data-helper'

export async function GET(request: NextRequest) {
  try {
    // Fetch RMO data from uploaded Excel files
    const rmoData = await fetchRMOData(10000)

    const filterOptions: any = {
      technologyTypes: [],
      regions: [],
      states: [],
      contractTypes: [],
      plantNames: [],
      contractNames: [],
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

    if (rmoData.length > 0) {
      // Extract unique values
      filterOptions.technologyTypes = [...new Set(rmoData.map(d => d.TechnologyType))].filter(Boolean).sort()
      filterOptions.regions = [...new Set(rmoData.map(d => d.Region))].filter(Boolean).sort()
      filterOptions.states = [...new Set(rmoData.map(d => d.State))].filter(Boolean).sort()
      filterOptions.contractTypes = [...new Set(rmoData.map(d => d.ContractType))].filter(Boolean).sort()
      filterOptions.plantNames = [...new Set(rmoData.map(d => d.PlantName))].filter(Boolean).sort()
      filterOptions.contractNames = [...new Set(rmoData.map(d => d.ContractName))].filter(Boolean).sort()
      filterOptions.timeBlocks = [...new Set(rmoData.map(d => d.TimeBlock))].filter(Boolean).sort((a, b) => Number(a) - Number(b))
      filterOptions.modelIds = [...new Set(rmoData.map(d => d.ModelID))].filter(Boolean).sort()

      // Calculate price ranges
      const damPrices = rmoData.map(d => d.DAMPrice).filter(p => p && !isNaN(p))
      const gdamPrices = rmoData.map(d => d.GDAMPrice).filter(p => p && !isNaN(p))
      const rtmPrices = rmoData.map(d => d.RTMPrice).filter(p => p && !isNaN(p))

      if (damPrices.length > 0) {
        filterOptions.priceRanges.damPrice = {
          min: Math.floor(Math.min(...damPrices)),
          max: Math.ceil(Math.max(...damPrices))
        }
      }
      if (gdamPrices.length > 0) {
        filterOptions.priceRanges.gdamPrice = {
          min: Math.floor(Math.min(...gdamPrices)),
          max: Math.ceil(Math.max(...gdamPrices))
        }
      }
      if (rtmPrices.length > 0) {
        filterOptions.priceRanges.rtmPrice = {
          min: Math.floor(Math.min(...rtmPrices)),
          max: Math.ceil(Math.max(...rtmPrices))
        }
      }

      // Calculate scheduled MW range
      const scheduledMws = rmoData.map(d => d.ScheduledMW).filter(mw => mw && !isNaN(mw))
      if (scheduledMws.length > 0) {
        filterOptions.scheduledMwRange = {
          min: Math.floor(Math.min(...scheduledMws)),
          max: Math.ceil(Math.max(...scheduledMws))
        }
      }

      // Extract time period range
      const timePeriods = rmoData
        .map(d => d.TimePeriod)
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

    return NextResponse.json({
      success: true,
      data: filterOptions
    })

  } catch (error) {
    console.error('Error fetching RMO filter options:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch RMO filter options',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

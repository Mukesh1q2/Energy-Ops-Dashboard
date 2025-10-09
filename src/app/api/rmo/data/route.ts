import { NextRequest, NextResponse } from 'next/server'
import { fetchRMOData } from '@/lib/excel-data-helper'
import { apiLimiter, withRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  return withRateLimit(request, apiLimiter, async () => {
    try {
      // Use the helper utility to fetch RMO data from uploaded Excel files
      const transformedData = await fetchRMOData(1000)

      if (transformedData.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No RMO data source found. Please upload an RMO Excel file with DAMPrice and ScheduledMW columns.',
          data: [],
        })
      }

      return NextResponse.json({
        success: true,
        data: transformedData,
        recordCount: transformedData.length,
      })
    } catch (error) {
      console.error('Error fetching RMO data:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch RMO data',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      }, { status: 500 })
    }
  })
}

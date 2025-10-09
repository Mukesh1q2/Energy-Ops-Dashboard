import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Generate sample real-time pricing data
    const now = new Date()
    const time_periods = []
    const prices = []
    const forecast_prices = []

    // Generate data for the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      time_periods.push(time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
      
      // Simulate pricing with some variation
      const basePrice = 3500 + Math.random() * 1000
      prices.push(Number(basePrice.toFixed(2)))
      forecast_prices.push(Number((basePrice + (Math.random() - 0.5) * 200).toFixed(2)))
    }

    return NextResponse.json({
      success: true,
      time_periods,
      prices,
      forecast_prices,
      lastUpdated: now.toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching RMO pricing:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch pricing data' },
      { status: 500 }
    )
  }
}

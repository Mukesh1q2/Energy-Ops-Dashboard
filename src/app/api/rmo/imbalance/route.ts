import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Generate sample imbalance data
    const now = new Date()
    const time_periods = []
    const imbalance = []

    // Generate data for the last 12 hours
    for (let i = 11; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      time_periods.push(time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
      
      // Simulate imbalance with positive and negative values
      const value = (Math.random() - 0.5) * 100
      imbalance.push(Number(value.toFixed(2)))
    }

    return NextResponse.json({
      success: true,
      time_periods,
      imbalance,
      lastUpdated: now.toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching RMO imbalance:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch imbalance data' },
      { status: 500 }
    )
  }
}

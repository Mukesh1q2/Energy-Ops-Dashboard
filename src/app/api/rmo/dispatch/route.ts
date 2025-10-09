import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Generate sample dispatch data
    const plants = ['Plant A', 'Plant B', 'Plant C', 'Plant D', 'Plant E', 'Plant F']
    const scheduled = []
    const actual = []

    plants.forEach(() => {
      const baseValue = 200 + Math.random() * 300
      scheduled.push(Number(baseValue.toFixed(2)))
      actual.push(Number((baseValue + (Math.random() - 0.5) * 50).toFixed(2)))
    })

    return NextResponse.json({
      success: true,
      plants,
      scheduled,
      actual,
      lastUpdated: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching RMO dispatch:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dispatch data' },
      { status: 500 }
    )
  }
}

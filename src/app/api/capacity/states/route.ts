import { NextRequest, NextResponse } from 'next/server'

/**
 * API Endpoint: GET /api/capacity/states
 * Returns state-wise installed capacity data aggregated from ElectricityData table
 * Currently returns simulated data - database query can be enabled when ready
 */
export async function GET(request: NextRequest) {
  try {
    // For now, always use simulated data to avoid database/query issues
    // TODO: Enable real database query once ElectricityData has state column populated
    const simulatedData = generateSimulatedStateData()
    
    return NextResponse.json({
      success: true,
      data: simulatedData,
      meta: {
        total_states: simulatedData.length,
        total_capacity_mw: simulatedData.reduce((sum, item) => sum + item.capacity_mw, 0),
        fallback: true,
        message: 'Using simulated data - enable database query when ready'
      }
    })

  } catch (error) {
    console.error('Error in state capacity endpoint:', error)
    
    // Return simulated data as fallback
    const simulatedData = generateSimulatedStateData()
    
    return NextResponse.json({
      success: true,
      data: simulatedData,
      meta: {
        total_states: simulatedData.length,
        total_capacity_mw: simulatedData.reduce((sum, item) => sum + item.capacity_mw, 0),
        fallback: true,
        message: 'Using simulated data - error occurred'
      }
    })
  }
}

/**
 * Generate simulated state-wise capacity data
 * Used as fallback when database has no data
 */
function generateSimulatedStateData() {
  const indianStates = [
    { name: "Maharashtra", base: 42000 },
    { name: "Gujarat", base: 38000 },
    { name: "Tamil Nadu", base: 35000 },
    { name: "Karnataka", base: 32000 },
    { name: "Rajasthan", base: 28000 },
    { name: "Uttar Pradesh", base: 26000 },
    { name: "Madhya Pradesh", base: 24000 },
    { name: "Andhra Pradesh", base: 22000 },
    { name: "Telangana", base: 20000 },
    { name: "West Bengal", base: 18000 },
    { name: "Punjab", base: 16000 },
    { name: "Haryana", base: 15000 },
    { name: "Kerala", base: 13000 },
    { name: "Odisha", base: 12000 },
    { name: "Bihar", base: 10000 },
    { name: "Chhattisgarh", base: 9000 },
    { name: "Jharkhand", base: 8000 },
    { name: "Assam", base: 7000 }
  ]

  // Add random variation (+/- 20%)
  const statesWithVariation = indianStates.map(state => ({
    state: state.name,
    capacity_mw: Math.floor(state.base * (0.8 + Math.random() * 0.4)),
    technology_count: Math.floor(Math.random() * 5) + 3
  }))

  // Sort by capacity
  statesWithVariation.sort((a, b) => b.capacity_mw - a.capacity_mw)

  // Calculate percentages and ranks
  const totalCapacity = statesWithVariation.reduce((sum, item) => sum + item.capacity_mw, 0)

  return statesWithVariation.map((item, index) => ({
    ...item,
    percentage: (item.capacity_mw / totalCapacity) * 100,
    rank: index + 1
  }))
}

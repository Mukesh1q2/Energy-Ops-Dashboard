/**
 * Simulated Data Generator for OptiBid Dashboard
 * Generates realistic dummy data for all chart components
 */

// Time series helper
const generateTimePoints = (count: number, interval: 'hour' | 'day' | 'week' = 'hour') => {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now)
    if (interval === 'hour') {
      date.setHours(now.getHours() - (count - i))
    } else if (interval === 'day') {
      date.setDate(now.getDate() - (count - i))
    } else {
      date.setDate(now.getDate() - (count - i) * 7)
    }
    return date
  })
}

// Random value generators
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(randomBetween(min, max))

// DMO - Generator Scheduling Data
export const generateGeneratorSchedulingData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  const technologies = ['Coal', 'Gas', 'Hydro', 'Nuclear', 'Solar', 'Wind']
  
  return timePoints.flatMap((time, idx) => 
    technologies.map(tech => ({
      id: `gen-${idx}-${tech}`,
      time_period: time.toISOString(),
      region: ['Northern', 'Western', 'Southern'][randomInt(0, 3)],
      state: 'Maharashtra',
      plant_id: `PLT-${randomInt(100, 999)}`,
      plant_name: `${tech} Plant ${randomInt(1, 5)}`,
      technology_type: tech,
      contract_name: `Contract-${String.fromCharCode(65 + randomInt(0, 5))}`,
      scheduled_mw: randomBetween(100, 500),
      actual_mw: randomBetween(90, 510)
    }))
  )
}

// DMO - Contract Scheduling Data
export const generateContractSchedulingData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  const contractTypes = ['PPA', 'Tender', 'Merchant', 'REC', 'Banking']
  
  return timePoints.flatMap((time, idx) => 
    contractTypes.map(type => ({
      id: `cont-${idx}-${type}`,
      time_period: time.toISOString(),
      region: ['Northern', 'Western', 'Southern'][randomInt(0, 3)],
      state: 'Gujarat',
      contract_name: `${type}-Contract-${randomInt(1, 10)}`,
      contract_type: type,
      scheduled_mw: randomBetween(200, 800),
      actual_mw: randomBetween(190, 820),
      cumulative_mw: randomBetween(1000, 5000)
    }))
  )
}

// DMO - Market Bidding Data
export const generateMarketBiddingData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  const marketTypes = ['Day-Ahead', 'Real-Time', 'Term-Ahead']
  
  return timePoints.flatMap((time, idx) => 
    marketTypes.map(market => ({
      id: `bid-${idx}-${market}`,
      time_period: time.toISOString(),
      region: ['Northern', 'Western'][randomInt(0, 2)],
      state: 'Tamil Nadu',
      plant_id: `PLT-${randomInt(100, 999)}`,
      plant_name: `Plant ${randomInt(1, 20)}`,
      market_type: market,
      bid_price_rs_per_mwh: randomBetween(2500, 6500),
      bid_volume_mw: randomBetween(50, 300),
      clearing_price_rs_per_mwh: randomBetween(2400, 6400),
      cleared_volume_mw: randomBetween(45, 295)
    }))
  )
}

// RMO - Price Chart Data
export const generateRmoPriceData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  
  return timePoints.map((time, idx) => ({
    id: `rmo-price-${idx}`,
    time_period: time.toISOString(),
    time_block: time.getHours(),
    market_clearing_price: randomBetween(2000, 8000),
    system_marginal_price: randomBetween(1900, 8100),
    area_clearing_price: randomBetween(1950, 8050),
    volume_traded: randomBetween(500, 2000),
    region: 'Western',
    state: 'Maharashtra'
  }))
}

// RMO - Schedule Data
export const generateRmoScheduleData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  
  return timePoints.map((time, idx) => ({
    id: `rmo-sched-${idx}`,
    time_period: time.toISOString(),
    time_block: time.getHours(),
    scheduled_generation: randomBetween(800, 1500),
    actual_generation: randomBetween(780, 1520),
    scheduled_demand: randomBetween(900, 1400),
    actual_demand: randomBetween(880, 1420),
    net_schedule: randomBetween(-200, 200),
    region: 'Northern',
    state: 'Delhi'
  }))
}

// Storage - Capacity & Performance Data
export const generateStorageData = (count: number = 10) => {
  const storageTypes = ['Battery', 'Pumped Hydro', 'Compressed Air']
  const regions = ['Northern', 'Western', 'Southern', 'Eastern']
  
  return storageTypes.flatMap(type => 
    regions.map((region, idx) => ({
      id: `storage-${type}-${region}`,
      time_period: new Date().toISOString(),
      region,
      state: ['Delhi', 'Maharashtra', 'Tamil Nadu', 'West Bengal'][idx],
      storage_type: type,
      capacity_mw: randomBetween(100, 1000),
      charge_mw: randomBetween(50, 400),
      discharge_mw: randomBetween(40, 380),
      state_of_charge_percent: randomBetween(20, 95),
      efficiency_percent: randomBetween(85, 98),
      cycles: randomInt(1, 5)
    }))
  )
}

// Generation Charts Data
export const generateGenerationData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  const baseGeneration = 300000 // 300 GW base
  
  return timePoints.map((time, idx) => {
    const hourFactor = Math.sin((time.getHours() / 24) * Math.PI * 2) * 0.2 + 1
    return {
      hour: `${time.getHours()}:00`,
      time: time.toISOString(),
      generation: baseGeneration * hourFactor + randomBetween(-10000, 10000),
      capacity: 420000, // 420 GW installed
      demand: baseGeneration * hourFactor * 1.05 + randomBetween(-5000, 5000),
      coal: baseGeneration * 0.45 * hourFactor,
      solar: baseGeneration * 0.18 * (time.getHours() >= 6 && time.getHours() <= 18 ? 1 : 0.1),
      wind: baseGeneration * 0.12 * (0.8 + Math.random() * 0.4),
      hydro: baseGeneration * 0.11 * hourFactor,
      gas: baseGeneration * 0.06 * hourFactor,
      nuclear: baseGeneration * 0.03,
      others: baseGeneration * 0.05
    }
  })
}

// Consumption Data
export const generateConsumptionData = () => {
  const sectors = [
    { name: 'Industrial', value: 42, growth: 5.2 },
    { name: 'Domestic', value: 24, growth: 7.8 },
    { name: 'Commercial', value: 18, growth: 6.5 },
    { name: 'Agriculture', value: 12, growth: 3.2 },
    { name: 'Others', value: 4, growth: 4.1 }
  ]
  
  return sectors.map(sector => ({
    ...sector,
    consumption: randomBetween(50000, 150000),
    peak_demand: randomBetween(60000, 180000),
    avg_consumption: randomBetween(45000, 140000)
  }))
}

// Demand Pattern Data
export const generateDemandPatternData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  
  return timePoints.map(time => {
    const hour = time.getHours()
    let demandFactor = 0.7
    
    // Peak hours: 9-12 and 18-22
    if ((hour >= 9 && hour <= 12) || (hour >= 18 && hour <= 22)) {
      demandFactor = 1.0
    } else if (hour >= 1 && hour <= 5) {
      demandFactor = 0.5
    }
    
    return {
      time: `${hour}:00`,
      timestamp: time.toISOString(),
      demand: 300000 * demandFactor + randomBetween(-10000, 10000),
      forecast: 300000 * demandFactor + randomBetween(-5000, 5000),
      actual: 300000 * demandFactor + randomBetween(-8000, 8000),
      industrial: 120000 * demandFactor,
      domestic: 70000 * (hour >= 6 && hour <= 23 ? 1.2 : 0.3),
      commercial: 55000 * (hour >= 9 && hour <= 21 ? 1.3 : 0.2),
      agriculture: 35000 * (hour >= 6 && hour <= 18 ? 1.0 : 1.5)
    }
  })
}

// Analytics - Price Trends
export const generatePriceTrendsData = (count: number = 30) => {
  const timePoints = generateTimePoints(count, 'day')
  
  return timePoints.map((time, idx) => ({
    date: time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    timestamp: time.toISOString(),
    dayAheadPrice: randomBetween(3000, 7000),
    realTimePrice: randomBetween(2800, 7200),
    termAheadPrice: randomBetween(3200, 6800),
    volume: randomBetween(15000, 35000),
    transactions: randomInt(500, 1500)
  }))
}

// Analytics - Volume Analysis
export const generateVolumeAnalysisData = (count: number = 24) => {
  const timePoints = generateTimePoints(count, 'hour')
  
  return timePoints.map(time => ({
    hour: `${time.getHours()}:00`,
    timestamp: time.toISOString(),
    buyVolume: randomBetween(5000, 15000),
    sellVolume: randomBetween(4800, 14800),
    netVolume: randomBetween(-2000, 2000),
    transactions: randomInt(50, 200),
    avgPrice: randomBetween(3500, 6500)
  }))
}

// Transmission Data
export const generateTransmissionData = () => {
  const corridors = [
    'Northern-Western',
    'Western-Southern',
    'Southern-Eastern',
    'Eastern-Northern',
    'Northern-NorthEastern'
  ]
  
  return corridors.map(corridor => ({
    corridor,
    capacity: randomBetween(5000, 15000),
    flow: randomBetween(3000, 14000),
    utilization: randomBetween(60, 95),
    losses: randomBetween(2, 8),
    congestion: randomBetween(0, 30),
    available: randomBetween(1000, 5000)
  }))
}

// Export all generators
export const SimulatedDataGenerators = {
  generator: generateGeneratorSchedulingData,
  contract: generateContractSchedulingData,
  marketBidding: generateMarketBiddingData,
  rmoPrice: generateRmoPriceData,
  rmoSchedule: generateRmoScheduleData,
  storage: generateStorageData,
  generation: generateGenerationData,
  consumption: generateConsumptionData,
  demandPattern: generateDemandPatternData,
  priceTrends: generatePriceTrendsData,
  volumeAnalysis: generateVolumeAnalysisData,
  transmission: generateTransmissionData
}

export default SimulatedDataGenerators

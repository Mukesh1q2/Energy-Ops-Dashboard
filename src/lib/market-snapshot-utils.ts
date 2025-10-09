/**
 * Market Snapshot Utility Functions
 * Extracted aggregation logic for unit testing
 */

export interface MarketSnapshotRecord {
  dam_price: number | null
  rtm_price: number | null
  gdam_price: number | null
  scheduled_mw: number | null
  modelresult_mw: number | null
  purchase_bid_mw: number | null
  sell_bid_mw: number | null
  created_at: Date
}

export interface AggregatedStats {
  totalRecords: number
  avgDamPrice: number
  avgRtmPrice: number
  avgGdamPrice: number
  totalScheduledVolume: number
  totalModelResultVolume: number
  totalPurchaseBidVolume: number
  totalSellBidVolume: number
  lastUpdated: string | null
}

/**
 * Calculate average price from array of prices, filtering out nulls
 */
export function calculateAveragePrice(prices: (number | null)[]): number {
  const validPrices = prices.filter((p): p is number => p !== null && !isNaN(p))
  
  if (validPrices.length === 0) {
    return 0
  }
  
  const sum = validPrices.reduce((acc, price) => acc + price, 0)
  return sum / validPrices.length
}

/**
 * Calculate total volume from array of volumes, filtering out nulls
 */
export function calculateTotalVolume(volumes: (number | null)[]): number {
  const validVolumes = volumes.filter((v): v is number => v !== null && !isNaN(v))
  return validVolumes.reduce((sum, vol) => sum + vol, 0)
}

/**
 * Find the most recent date from an array of dates
 */
export function findLatestDate(dates: Date[]): Date | null {
  if (dates.length === 0) {
    return null
  }
  
  return dates.reduce((latest, current) => {
    return current > latest ? current : latest
  })
}

/**
 * Round number to specified decimal places
 */
export function roundToDecimalPlaces(value: number, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Aggregate market snapshot records into statistics
 */
export function aggregateMarketSnapshotStats(
  records: MarketSnapshotRecord[]
): AggregatedStats {
  const totalRecords = records.length

  // Handle empty dataset
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      avgDamPrice: 0,
      avgRtmPrice: 0,
      avgGdamPrice: 0,
      totalScheduledVolume: 0,
      totalModelResultVolume: 0,
      totalPurchaseBidVolume: 0,
      totalSellBidVolume: 0,
      lastUpdated: null
    }
  }

  // Extract prices
  const damPrices = records.map(r => r.dam_price)
  const rtmPrices = records.map(r => r.rtm_price)
  const gdamPrices = records.map(r => r.gdam_price)

  // Calculate averages
  const avgDamPrice = calculateAveragePrice(damPrices)
  const avgRtmPrice = calculateAveragePrice(rtmPrices)
  const avgGdamPrice = calculateAveragePrice(gdamPrices)

  // Extract volumes
  const scheduledVolumes = records.map(r => r.scheduled_mw)
  const modelResultVolumes = records.map(r => r.modelresult_mw)
  const purchaseBidVolumes = records.map(r => r.purchase_bid_mw)
  const sellBidVolumes = records.map(r => r.sell_bid_mw)

  // Calculate totals
  const totalScheduledVolume = calculateTotalVolume(scheduledVolumes)
  const totalModelResultVolume = calculateTotalVolume(modelResultVolumes)
  const totalPurchaseBidVolume = calculateTotalVolume(purchaseBidVolumes)
  const totalSellBidVolume = calculateTotalVolume(sellBidVolumes)

  // Find latest update
  const dates = records.map(r => r.created_at)
  const lastUpdated = findLatestDate(dates)

  return {
    totalRecords,
    avgDamPrice: roundToDecimalPlaces(avgDamPrice),
    avgRtmPrice: roundToDecimalPlaces(avgRtmPrice),
    avgGdamPrice: roundToDecimalPlaces(avgGdamPrice),
    totalScheduledVolume: roundToDecimalPlaces(totalScheduledVolume),
    totalModelResultVolume: roundToDecimalPlaces(totalModelResultVolume),
    totalPurchaseBidVolume: roundToDecimalPlaces(totalPurchaseBidVolume),
    totalSellBidVolume: roundToDecimalPlaces(totalSellBidVolume),
    lastUpdated: lastUpdated?.toISOString() || null
  }
}

/**
 * Aggregate records by time interval (hourly)
 */
export function aggregateByHour(records: MarketSnapshotRecord[]): Map<string, AggregatedStats> {
  const hourlyMap = new Map<string, MarketSnapshotRecord[]>()

  // Group records by hour
  records.forEach(record => {
    const hour = new Date(record.created_at)
    hour.setMinutes(0, 0, 0)
    const hourKey = hour.toISOString()

    if (!hourlyMap.has(hourKey)) {
      hourlyMap.set(hourKey, [])
    }
    hourlyMap.get(hourKey)!.push(record)
  })

  // Aggregate each hour
  const result = new Map<string, AggregatedStats>()
  hourlyMap.forEach((hourRecords, hourKey) => {
    result.set(hourKey, aggregateMarketSnapshotStats(hourRecords))
  })

  return result
}

/**
 * Aggregate records by time interval (15-minute blocks)
 */
export function aggregateBy15Minutes(records: MarketSnapshotRecord[]): Map<string, AggregatedStats> {
  const intervalMap = new Map<string, MarketSnapshotRecord[]>()

  // Group records by 15-minute intervals
  records.forEach(record => {
    const time = new Date(record.created_at)
    const minutes = Math.floor(time.getMinutes() / 15) * 15
    time.setMinutes(minutes, 0, 0)
    const intervalKey = time.toISOString()

    if (!intervalMap.has(intervalKey)) {
      intervalMap.set(intervalKey, [])
    }
    intervalMap.get(intervalKey)!.push(record)
  })

  // Aggregate each interval
  const result = new Map<string, AggregatedStats>()
  intervalMap.forEach((intervalRecords, intervalKey) => {
    result.set(intervalKey, aggregateMarketSnapshotStats(intervalRecords))
  })

  return result
}

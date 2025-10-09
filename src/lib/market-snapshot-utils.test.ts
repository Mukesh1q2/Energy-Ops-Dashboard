import { describe, it, expect } from 'vitest'
import {
  calculateAveragePrice,
  calculateTotalVolume,
  findLatestDate,
  roundToDecimalPlaces,
  aggregateMarketSnapshotStats,
  aggregateByHour,
  aggregateBy15Minutes,
  type MarketSnapshotRecord
} from './market-snapshot-utils'

describe('Market Snapshot Utilities', () => {
  describe('calculateAveragePrice', () => {
    it('should calculate average of valid prices', () => {
      const prices = [100, 200, 300]
      expect(calculateAveragePrice(prices)).toBe(200)
    })

    it('should handle array with null values', () => {
      const prices = [100, null, 200, null, 300]
      expect(calculateAveragePrice(prices)).toBe(200)
    })

    it('should return 0 for empty array', () => {
      expect(calculateAveragePrice([])).toBe(0)
    })

    it('should return 0 for array with only nulls', () => {
      const prices = [null, null, null]
      expect(calculateAveragePrice(prices)).toBe(0)
    })

    it('should handle NaN values', () => {
      const prices = [100, NaN, 200]
      expect(calculateAveragePrice(prices)).toBe(150)
    })

    it('should handle decimal prices correctly', () => {
      const prices = [100.5, 200.7, 300.3]
      expect(calculateAveragePrice(prices)).toBeCloseTo(200.5, 1)
    })

    it('should handle single value', () => {
      expect(calculateAveragePrice([42])).toBe(42)
    })

    it('should handle negative prices', () => {
      const prices = [-100, 100, 200]
      expect(calculateAveragePrice(prices)).toBeCloseTo(66.67, 1)
    })

    it('should handle very large numbers', () => {
      const prices = [1000000, 2000000, 3000000]
      expect(calculateAveragePrice(prices)).toBe(2000000)
    })
  })

  describe('calculateTotalVolume', () => {
    it('should calculate sum of valid volumes', () => {
      const volumes = [10, 20, 30]
      expect(calculateTotalVolume(volumes)).toBe(60)
    })

    it('should handle null values', () => {
      const volumes = [10, null, 20, null, 30]
      expect(calculateTotalVolume(volumes)).toBe(60)
    })

    it('should return 0 for empty array', () => {
      expect(calculateTotalVolume([])).toBe(0)
    })

    it('should return 0 for array with only nulls', () => {
      const volumes = [null, null, null]
      expect(calculateTotalVolume(volumes)).toBe(0)
    })

    it('should handle NaN values', () => {
      const volumes = [10, NaN, 20]
      expect(calculateTotalVolume(volumes)).toBe(30)
    })

    it('should handle decimal volumes', () => {
      const volumes = [10.5, 20.7, 30.8]
      expect(calculateTotalVolume(volumes)).toBe(62)
    })

    it('should handle zero values', () => {
      const volumes = [0, 10, 0, 20]
      expect(calculateTotalVolume(volumes)).toBe(30)
    })

    it('should handle negative volumes', () => {
      const volumes = [10, -5, 20]
      expect(calculateTotalVolume(volumes)).toBe(25)
    })
  })

  describe('findLatestDate', () => {
    it('should find the most recent date', () => {
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        new Date('2024-01-10')
      ]
      expect(findLatestDate(dates)).toEqual(new Date('2024-01-15'))
    })

    it('should return null for empty array', () => {
      expect(findLatestDate([])).toBeNull()
    })

    it('should handle single date', () => {
      const date = new Date('2024-01-01')
      expect(findLatestDate([date])).toEqual(date)
    })

    it('should handle dates with time components', () => {
      const dates = [
        new Date('2024-01-01T10:00:00'),
        new Date('2024-01-01T15:30:00'),
        new Date('2024-01-01T12:00:00')
      ]
      expect(findLatestDate(dates)).toEqual(new Date('2024-01-01T15:30:00'))
    })

    it('should handle identical dates', () => {
      const date = new Date('2024-01-01')
      const dates = [date, date, date]
      expect(findLatestDate(dates)).toEqual(date)
    })
  })

  describe('roundToDecimalPlaces', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundToDecimalPlaces(123.456)).toBe(123.46)
    })

    it('should round to specified decimal places', () => {
      expect(roundToDecimalPlaces(123.456, 1)).toBe(123.5)
      expect(roundToDecimalPlaces(123.456, 3)).toBe(123.456)
    })

    it('should handle zero decimal places', () => {
      expect(roundToDecimalPlaces(123.456, 0)).toBe(123)
    })

    it('should handle negative numbers', () => {
      expect(roundToDecimalPlaces(-123.456)).toBe(-123.46)
    })

    it('should handle whole numbers', () => {
      expect(roundToDecimalPlaces(123)).toBe(123)
    })

    it('should handle very small numbers', () => {
      expect(roundToDecimalPlaces(0.001, 2)).toBe(0)
      expect(roundToDecimalPlaces(0.001, 3)).toBe(0.001)
    })
  })

  describe('aggregateMarketSnapshotStats', () => {
    const createMockRecord = (overrides: Partial<MarketSnapshotRecord> = {}): MarketSnapshotRecord => ({
      dam_price: 100,
      rtm_price: 90,
      gdam_price: 95,
      scheduled_mw: 50,
      modelresult_mw: 55,
      purchase_bid_mw: 45,
      sell_bid_mw: 40,
      created_at: new Date('2024-01-01T12:00:00'),
      ...overrides
    })

    it('should return zeros for empty array', () => {
      const result = aggregateMarketSnapshotStats([])
      expect(result.totalRecords).toBe(0)
      expect(result.avgDamPrice).toBe(0)
      expect(result.totalScheduledVolume).toBe(0)
      expect(result.lastUpdated).toBeNull()
    })

    it('should aggregate single record correctly', () => {
      const record = createMockRecord()
      const result = aggregateMarketSnapshotStats([record])
      
      expect(result.totalRecords).toBe(1)
      expect(result.avgDamPrice).toBe(100)
      expect(result.avgRtmPrice).toBe(90)
      expect(result.avgGdamPrice).toBe(95)
      expect(result.totalScheduledVolume).toBe(50)
      expect(result.totalModelResultVolume).toBe(55)
      expect(result.totalPurchaseBidVolume).toBe(45)
      expect(result.totalSellBidVolume).toBe(40)
      expect(result.lastUpdated).toBe(record.created_at.toISOString())
    })

    it('should aggregate multiple records correctly', () => {
      const records = [
        createMockRecord({ dam_price: 100, scheduled_mw: 50 }),
        createMockRecord({ dam_price: 200, scheduled_mw: 100 }),
        createMockRecord({ dam_price: 300, scheduled_mw: 150 })
      ]
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.totalRecords).toBe(3)
      expect(result.avgDamPrice).toBe(200)
      expect(result.totalScheduledVolume).toBe(300)
    })

    it('should handle null values in calculations', () => {
      const records = [
        createMockRecord({ dam_price: 100, scheduled_mw: 50 }),
        createMockRecord({ dam_price: null, scheduled_mw: null }),
        createMockRecord({ dam_price: 200, scheduled_mw: 100 })
      ]
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.totalRecords).toBe(3)
      expect(result.avgDamPrice).toBe(150) // Average of 100 and 200
      expect(result.totalScheduledVolume).toBe(150) // Sum of 50 and 100
    })

    it('should round results to 2 decimal places', () => {
      const records = [
        createMockRecord({ dam_price: 100.123, scheduled_mw: 50.666 }),
        createMockRecord({ dam_price: 200.789, scheduled_mw: 100.777 })
      ]
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.avgDamPrice).toBe(150.46)
      expect(result.totalScheduledVolume).toBe(151.44)
    })

    it('should find the most recent created_at date', () => {
      const date1 = new Date('2024-01-01T10:00:00Z')
      const date2 = new Date('2024-01-01T15:00:00Z')
      const date3 = new Date('2024-01-01T12:00:00Z')
      const records = [
        createMockRecord({ created_at: date1 }),
        createMockRecord({ created_at: date2 }),
        createMockRecord({ created_at: date3 })
      ]
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.lastUpdated).toBe(date2.toISOString())
    })

    it('should handle all null prices', () => {
      const records = [
        createMockRecord({ dam_price: null, rtm_price: null, gdam_price: null })
      ]
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.avgDamPrice).toBe(0)
      expect(result.avgRtmPrice).toBe(0)
      expect(result.avgGdamPrice).toBe(0)
    })

    it('should handle all null volumes', () => {
      const records = [
        createMockRecord({ 
          scheduled_mw: null, 
          modelresult_mw: null, 
          purchase_bid_mw: null, 
          sell_bid_mw: null 
        })
      ]
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.totalScheduledVolume).toBe(0)
      expect(result.totalModelResultVolume).toBe(0)
      expect(result.totalPurchaseBidVolume).toBe(0)
      expect(result.totalSellBidVolume).toBe(0)
    })

    it('should handle large dataset efficiently', () => {
      const records = Array.from({ length: 1000 }, (_, i) => 
        createMockRecord({ 
          dam_price: 100 + i,
          scheduled_mw: 50 + i,
          created_at: new Date(`2024-01-01T${String(i % 24).padStart(2, '0')}:00:00`)
        })
      )
      const result = aggregateMarketSnapshotStats(records)
      
      expect(result.totalRecords).toBe(1000)
      expect(result.avgDamPrice).toBeCloseTo(599.5, 1)
      expect(result.totalScheduledVolume).toBeCloseTo(549500, 0)
    })
  })

  describe('aggregateByHour', () => {
    const createMockRecord = (hour: number, overrides: Partial<MarketSnapshotRecord> = {}): MarketSnapshotRecord => ({
      dam_price: 100,
      rtm_price: 90,
      gdam_price: 95,
      scheduled_mw: 50,
      modelresult_mw: 55,
      purchase_bid_mw: 45,
      sell_bid_mw: 40,
      created_at: new Date(`2024-01-01T${String(hour).padStart(2, '0')}:30:00`),
      ...overrides
    })

    it('should group records by hour', () => {
      const records = [
        createMockRecord(10),
        createMockRecord(10),
        createMockRecord(11),
        createMockRecord(11),
        createMockRecord(12)
      ]
      const result = aggregateByHour(records)
      
      expect(result.size).toBe(3)
    })

    it('should aggregate each hour correctly', () => {
      const records = [
        createMockRecord(10, { dam_price: 100 }),
        createMockRecord(10, { dam_price: 200 }),
        createMockRecord(11, { dam_price: 300 })
      ]
      const result = aggregateByHour(records)
      
      // Find the hour keys (they will be in UTC)
      const keys = Array.from(result.keys()).sort()
      expect(keys.length).toBe(2)
      
      // Get first hour aggregation
      const hour1 = result.get(keys[0])
      expect(hour1?.totalRecords).toBe(2)
      expect(hour1?.avgDamPrice).toBe(150)
      
      // Get second hour aggregation
      const hour2 = result.get(keys[1])
      expect(hour2?.totalRecords).toBe(1)
      expect(hour2?.avgDamPrice).toBe(300)
    })

    it('should handle empty array', () => {
      const result = aggregateByHour([])
      expect(result.size).toBe(0)
    })

    it('should normalize minutes to :00', () => {
      // Create two dates in same hour but different minutes
      const date1 = new Date('2024-01-01T12:00:00Z')
      date1.setMinutes(15)
      date1.setSeconds(30)
      
      const date2 = new Date('2024-01-01T12:00:00Z')
      date2.setMinutes(45)
      date2.setSeconds(20)
      
      const records = [
        createMockRecord(10, { created_at: date1 }),
        createMockRecord(10, { created_at: date2 })
      ]
      const result = aggregateByHour(records)
      
      // Both records should be grouped in the same hour
      expect(result.size).toBe(1)
      const keys = Array.from(result.keys())
      expect(keys.length).toBe(1)
      
      // The hour bucket should have both records
      const values = Array.from(result.values())
      expect(values[0].totalRecords).toBe(2)
    })
  })

  describe('aggregateBy15Minutes', () => {
    const createMockRecord = (hour: number, minute: number, overrides: Partial<MarketSnapshotRecord> = {}): MarketSnapshotRecord => ({
      dam_price: 100,
      rtm_price: 90,
      gdam_price: 95,
      scheduled_mw: 50,
      modelresult_mw: 55,
      purchase_bid_mw: 45,
      sell_bid_mw: 40,
      created_at: new Date(`2024-01-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`),
      ...overrides
    })

    it('should group records by 15-minute intervals', () => {
      const records = [
        createMockRecord(10, 5),   // 10:00
        createMockRecord(10, 10),  // 10:00
        createMockRecord(10, 16),  // 10:15
        createMockRecord(10, 25),  // 10:15
        createMockRecord(10, 35),  // 10:30
        createMockRecord(10, 50)   // 10:45
      ]
      const result = aggregateBy15Minutes(records)
      
      expect(result.size).toBe(4) // 10:00, 10:15, 10:30, 10:45
    })

    it('should aggregate each interval correctly', () => {
      const records = [
        createMockRecord(10, 5, { dam_price: 100 }),
        createMockRecord(10, 10, { dam_price: 200 }),
        createMockRecord(10, 20, { dam_price: 300 })
      ]
      const result = aggregateBy15Minutes(records)
      
      // Find the interval keys (they will be in UTC)
      const keys = Array.from(result.keys()).sort()
      expect(keys.length).toBe(2)
      
      // First interval should have 2 records (10:05 and 10:10 both round to 10:00)
      const interval1 = result.get(keys[0])
      expect(interval1?.totalRecords).toBe(2)
      expect(interval1?.avgDamPrice).toBe(150)
      
      // Second interval should have 1 record (10:20 rounds to 10:15)
      const interval2 = result.get(keys[1])
      expect(interval2?.totalRecords).toBe(1)
      expect(interval2?.avgDamPrice).toBe(300)
    })

    it('should handle boundary cases', () => {
      const records = [
        createMockRecord(10, 0),   // 10:00
        createMockRecord(10, 14),  // 10:00
        createMockRecord(10, 15),  // 10:15
        createMockRecord(10, 29),  // 10:15
        createMockRecord(10, 30),  // 10:30
        createMockRecord(10, 44),  // 10:30
        createMockRecord(10, 45),  // 10:45
        createMockRecord(10, 59)   // 10:45
      ]
      const result = aggregateBy15Minutes(records)
      
      expect(result.size).toBe(4)
      // Each interval should have exactly 2 records
      const values = Array.from(result.values())
      values.forEach(val => {
        expect(val.totalRecords).toBe(2)
      })
    })

    it('should handle empty array', () => {
      const result = aggregateBy15Minutes([])
      expect(result.size).toBe(0)
    })

    it('should handle single record', () => {
      const records = [createMockRecord(10, 7, { dam_price: 150 })]
      const result = aggregateBy15Minutes(records)
      
      expect(result.size).toBe(1)
      // Get the single interval
      const intervals = Array.from(result.values())
      expect(intervals[0].totalRecords).toBe(1)
      expect(intervals[0].avgDamPrice).toBe(150)
    })
  })
})

/**
 * Excel Data Helper
 * 
 * Utility functions to help API endpoints discover and fetch data from
 * uploaded Excel files stored in dynamic tables.
 */

import { db } from '@/lib/db'

export interface ExcelDataSourceMatch {
  dataSource: any
  tableName: string
  columns: string[]
}

/**
 * Find Excel data sources that match specific column patterns
 * 
 * @param requiredColumns - Array of column name patterns (case-insensitive, partial matches)
 * @returns Array of matching data sources with table names
 */
export async function findExcelDataSources(
  requiredColumns: string[]
): Promise<ExcelDataSourceMatch[]> {
  try {
    const dataSources = await db.dataSource.findMany({
      where: {
        type: 'excel',
        status: 'active',
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const matches: ExcelDataSourceMatch[] = []

    for (const source of dataSources) {
      const columns = await db.dataSourceColumn.findMany({
        where: { data_source_id: source.id },
      })

      const columnNames = columns.map(c => c.column_name.toLowerCase())
      
      // Check if all required columns exist (partial match)
      const hasAllColumns = requiredColumns.every(required =>
        columnNames.some(name => name.includes(required.toLowerCase()))
      )

      if (hasAllColumns) {
        const config = source.config as any
        const tableName = config?.tableName

        if (tableName && /^ds_[a-zA-Z0-9_]+$/.test(tableName)) {
          matches.push({
            dataSource: source,
            tableName,
            columns: columns.map(c => c.column_name)
          })
        }
      }
    }

    return matches
  } catch (error) {
    console.error('Error finding Excel data sources:', error)
    return []
  }
}

/**
 * Fetch data from a specific Excel data source table
 * 
 * @param tableName - The dynamic table name (e.g., 'ds_xxxxx')
 * @param limit - Maximum number of rows to fetch
 * @returns Array of rows
 */
export async function fetchFromExcelTable(
  tableName: string,
  limit: number = 1000
): Promise<any[]> {
  try {
    // Validate table name to prevent SQL injection
    if (!/^ds_[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name')
    }

    const query = `SELECT * FROM "${tableName}" LIMIT ${limit}`
    const rows = await db.$queryRawUnsafe(query) as any[]
    
    return rows
  } catch (error) {
    console.error(`Error fetching from table ${tableName}:`, error)
    return []
  }
}

/**
 * Find and fetch RMO/Optimization data from uploaded Excel files
 * Looks for files with price and scheduling columns
 */
export async function fetchRMOData(limit: number = 1000): Promise<any[]> {
  const matches = await findExcelDataSources([
    'damprice', 'scheduledmw', 'timeperiod'
  ])

  if (matches.length === 0) {
    return []
  }

  const rows = await fetchFromExcelTable(matches[0].tableName, limit)
  
  return rows.map((row: any) => ({
    TechnologyType: row.technologytype || row.TechnologyType || '',
    Region: row.region || row.Region || '',
    State: row.state || row.State || '',
    ContractType: row.contracttype || row.ContractType || '',
    PlantName: row.plantname || row.PlantName || '',
    ContractName: row.contractname || row.ContractName || '',
    TimePeriod: row.timeperiod || row.TimePeriod || '',
    TimeBlock: parseInt(row.timeblock || row.TimeBlock || '0'),
    DAMPrice: parseFloat(row.damprice || row.DAMPrice || '0'),
    GDAMPrice: parseFloat(row.gdamprice || row.GDAMPrice || '0'),
    RTMPrice: parseFloat(row.rtmprice || row.RTMPrice || '0'),
    ScheduledMW: parseFloat(row.scheduledmw || row.ScheduledMW || '0'),
    ModelResultsMW: parseFloat(row.modelresultsmw || row.ModelResultsMW || '0'),
    ModelID: row.modelid || row.ModelID || '',
    ModelTriggerTime: row.modeltriggertime || row.ModelTriggerTime || '',
  }))
}

/**
 * Find and fetch DMO Generator Scheduling data from uploaded Excel files
 */
export async function fetchDMOGeneratorData(limit: number = 1000): Promise<any[]> {
  // First try to get data from dynamic data source tables
  // Try multiple column pattern combinations to match different file formats
  let matches = await findExcelDataSources([
    'scheduledmw', 'technologytype', 'timeperiod'
  ])
  
  // If not found, try alternative patterns for energy data files
  if (matches.length === 0) {
    matches = await findExcelDataSources([
      'modelresultsmw', 'technologytype', 'timeperiod'
    ])
  }
  
  // If still not found, try more generic patterns
  if (matches.length === 0) {
    matches = await findExcelDataSources([
      'technologytype', 'timeperiod'
    ])
  }

  let dynamicData: any[] = []
  if (matches.length > 0) {
    const rows = await fetchFromExcelTable(matches[0].tableName, limit)
    dynamicData = rows.map((row: any) => ({
      id: row.id || `dmo-gen-${Math.random().toString(36).substr(2, 9)}`,
      // Use ModelResultsMW if ScheduledMW is not available (common in optimization results)
      scheduled_mw: parseFloat(row.scheduledmw || row.ScheduledMW || row.modelresultsmw || row.ModelResultsMW || '0'),
      actual_mw: parseFloat(row.modelresultsmw || row.ModelResultsMW || row.actualmw || row.ActualMW || row.scheduledmw || row.ScheduledMW || '0'),
      technology_type: row.technologytype || row.TechnologyType || 'Unknown',
      time_period: row.timeperiod || row.TimePeriod || new Date().toISOString(),
      region: row.region || row.Region || 'Unknown',
      state: row.state || row.State || 'Unknown',
      plant_id: row.plantid || row.PlantID || row.plant_id || 'Unknown',
      plant_name: row.plantname || row.PlantName || 'Unknown',
      contract_name: row.contractname || row.ContractName || null,
    }))
  }

  // Also try to get data from the direct DMO database table
  try {
    const directData = await db.dMOGeneratorScheduling.findMany({
      take: limit,
      orderBy: { time_period: 'desc' },
    })
    
    // Convert Prisma data to consistent format
    const formattedDirectData = directData.map((row: any) => ({
      id: row.id,
      scheduled_mw: row.scheduled_mw,
      actual_mw: row.actual_mw,
      technology_type: row.technology_type,
      time_period: row.time_period.toISOString(),
      region: row.region,
      state: row.state,
      plant_id: row.plant_id,
      plant_name: row.plant_name,
      contract_name: row.contract_name,
    }))
    
    // Merge and deduplicate data (prefer newer/direct data)
    const combined = [...formattedDirectData, ...dynamicData]
    const uniqueData = combined.reduce((acc: any[], current) => {
      const existing = acc.find(item => 
        item.plant_id === current.plant_id && 
        item.time_period === current.time_period
      )
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [])
    
    return uniqueData.slice(0, limit)
  } catch (error) {
    console.warn('Error fetching direct DMO generator data:', error)
    return dynamicData
  }
}

/**
 * Find and fetch DMO Contract Scheduling data from uploaded Excel files
 */
export async function fetchDMOContractData(limit: number = 1000): Promise<any[]> {
  // First try to get data from dynamic data source tables
  const matches = await findExcelDataSources([
    'scheduledmw', 'contracttype', 'timeperiod'
  ])

  let dynamicData: any[] = []
  if (matches.length > 0) {
    const rows = await fetchFromExcelTable(matches[0].tableName, limit)
    dynamicData = rows.map((row: any) => ({
      id: row.id || `dmo-contract-${Math.random().toString(36).substr(2, 9)}`,
      scheduled_mw: parseFloat(row.scheduledmw || row.ScheduledMW || '0'),
      actual_mw: parseFloat(row.modelresultsmw || row.ModelResultsMW || row.actualmw || row.ActualMW || '0'),
      contract_type: row.contracttype || row.ContractType || 'Unknown',
      contract_name: row.contractname || row.ContractName || 'Unknown',
      time_period: row.timeperiod || row.TimePeriod || new Date().toISOString(),
      region: row.region || row.Region || 'Unknown',
      state: row.state || row.State || 'Unknown',
      cumulative_mw: parseFloat(row.cumulativemw || row.CumulativeMW || '0'),
    }))
  }

  // Also try to get data from the direct DMO database table
  try {
    const directData = await db.dMOContractScheduling.findMany({
      take: limit,
      orderBy: { time_period: 'desc' },
    })
    
    // Convert Prisma data to consistent format
    const formattedDirectData = directData.map((row: any) => ({
      id: row.id,
      scheduled_mw: row.scheduled_mw,
      actual_mw: row.actual_mw,
      contract_type: row.contract_type,
      contract_name: row.contract_name,
      time_period: row.time_period.toISOString(),
      region: row.region,
      state: row.state,
      cumulative_mw: row.cumulative_mw,
    }))
    
    // Merge and deduplicate data (prefer newer/direct data)
    const combined = [...formattedDirectData, ...dynamicData]
    const uniqueData = combined.reduce((acc: any[], current) => {
      const existing = acc.find(item => 
        item.contract_name === current.contract_name && 
        item.time_period === current.time_period
      )
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [])
    
    return uniqueData.slice(0, limit)
  } catch (error) {
    console.warn('Error fetching direct DMO contract data:', error)
    return dynamicData
  }
}

/**
 * Find and fetch Market Bidding data from uploaded Excel files
 */
export async function fetchMarketBiddingData(limit: number = 1000): Promise<any[]> {
  // First try to get data from dynamic data source tables
  const matches = await findExcelDataSources([
    'damprice', 'scheduledmw', 'timeperiod'
  ])

  let dynamicData: any[] = []
  if (matches.length > 0) {
    const rows = await fetchFromExcelTable(matches[0].tableName, limit)
    dynamicData = rows.map((row: any) => ({
      id: row.id || `dmo-market-${Math.random().toString(36).substr(2, 9)}`,
      bid_price_rs_per_mwh: parseFloat(row.damprice || row.DAMPrice || '0'),
      bid_volume_mw: parseFloat(row.scheduledmw || row.ScheduledMW || '0'),
      clearing_price_rs_per_mwh: parseFloat(row.gdamprice || row.GDAMPrice || '0'),
      cleared_volume_mw: parseFloat(row.modelresultsmw || row.ModelResultsMW || '0'),
      time_period: row.timeperiod || row.TimePeriod || new Date().toISOString(),
      market_type: row.markettype || row.MarketType || 'Day-Ahead',
      region: row.region || row.Region || 'Unknown',
      state: row.state || row.State || 'Unknown',
      plant_id: row.plantid || row.PlantID || row.plant_id || 'Unknown',
      plant_name: row.plantname || row.PlantName || 'Unknown',
    }))
  }

  // Also try to get data from the direct DMO database table
  try {
    const directData = await db.dMOMarketBidding.findMany({
      take: limit,
      orderBy: { time_period: 'desc' },
    })
    
    // Convert Prisma data to consistent format
    const formattedDirectData = directData.map((row: any) => ({
      id: row.id,
      bid_price_rs_per_mwh: row.bid_price_rs_per_mwh,
      bid_volume_mw: row.bid_volume_mw,
      clearing_price_rs_per_mwh: row.clearing_price_rs_per_mwh,
      cleared_volume_mw: row.cleared_volume_mw,
      time_period: row.time_period.toISOString(),
      market_type: row.market_type,
      region: row.region,
      state: row.state,
      plant_id: row.plant_id,
      plant_name: row.plant_name,
    }))
    
    // Merge and deduplicate data (prefer newer/direct data)
    const combined = [...formattedDirectData, ...dynamicData]
    const uniqueData = combined.reduce((acc: any[], current) => {
      const existing = acc.find(item => 
        item.plant_id === current.plant_id && 
        item.time_period === current.time_period &&
        item.market_type === current.market_type
      )
      if (!existing) {
        acc.push(current)
      }
      return acc
    }, [])
    
    return uniqueData.slice(0, limit)
  } catch (error) {
    console.warn('Error fetching direct DMO market bidding data:', error)
    return dynamicData
  }
}

/**
 * Find and fetch Storage Operations data from uploaded Excel files
 * Looks for files with storage-related columns (capacity, charge, discharge, etc.)
 */
export async function fetchStorageData(limit: number = 1000): Promise<any[]> {
  // First try to find dedicated storage data with specific columns
  let matches = await findExcelDataSources([
    'capacity', 'charge', 'discharge'
  ])

  // If not found, try alternative column patterns
  if (matches.length === 0) {
    matches = await findExcelDataSources([
      'storage', 'capacity'
    ])
  }

  // If still not found, try to find any file with storage type or battery columns
  if (matches.length === 0) {
    matches = await findExcelDataSources([
      'storagetype', 'battery'
    ])
  }

  if (matches.length === 0) {
    return []
  }

  const rows = await fetchFromExcelTable(matches[0].tableName, limit)
  
  return rows.map((row: any) => ({
    id: row.id || `storage-${Math.random().toString(36).substr(2, 9)}`,
    time_period: row.timeperiod || row.TimePeriod || row.time_period || row.timestamp || new Date().toISOString(),
    region: row.region || row.Region || 'Unknown',
    state: row.state || row.State || 'Unknown',
    storage_type: row.storagetype || row.StorageType || row.storage_type || row.technologytype || row.TechnologyType || 'Battery',
    capacity_mw: parseFloat(row.capacitymw || row.CapacityMW || row.capacity_mw || row.capacity || '0'),
    charge_mw: parseFloat(row.chargemw || row.ChargeMW || row.charge_mw || row.charge || '0'),
    discharge_mw: parseFloat(row.dischargemw || row.DischargeMW || row.discharge_mw || row.discharge || '0'),
    state_of_charge_percent: parseFloat(row.stateofcharge || row.StateOfCharge || row.state_of_charge || row.soc || '0'),
    efficiency_percent: parseFloat(row.efficiency || row.Efficiency || row.efficiency_percent || '90'),
    cycles: parseInt(row.cycles || row.Cycles || row.cycle_count || '0'),
  }))
}

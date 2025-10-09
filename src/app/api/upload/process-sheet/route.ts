import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

// Intelligent column name mapping
const COLUMN_MAPPING: Record<string, string[]> = {
  // Technology/Type fields
  'technology_type': ['technologytype', 'technology', 'tech_type', 'type', 'fuel_type'],
  
  // Location fields
  'region': ['region', 'zone', 'area'],
  'state': ['state', 'state_name'],
  
  // Contract fields
  'contract_type': ['contracttype', 'contract', 'contract_name'],
  'contract_name': ['contractname', 'contract_name'],
  
  // Plant/Unit fields
  'plant_name': ['plantname', 'plant', 'unit_name', 'unitname', 'plant_id'],
  'plant_id': ['plantid', 'plant_id', 'unit_id', 'unitid'],
  
  // Time fields
  'time_period': ['timeperiod', 'time', 'timestamp', 'datetime', 'date'],
  'time_block': ['timeblock', 'block', 'block_no', 'blockno'],
  
  // Price fields (₹/MWh)
  'dam_price': ['damprice', 'dam', 'dayahead_price', 'day_ahead_price'],
  'gdam_price': ['gdamprice', 'gdam', 'green_dam_price'],
  'rtm_price': ['rtmprice', 'rtm', 'realtime_price', 'real_time_price'],
  'price_rs_per_mwh': ['price', 'price_rs_per_mwh', 'price_rs', 'price_inr'],
  
  // Power/MW fields
  'scheduled_mw': ['scheduledmw', 'scheduled', 'schedule_mw'],
  'actual_mw': ['actualmw', 'actual', 'actual_generation', 'generation_mw'],
  'generation_mw': ['generationmw', 'generation', 'gen_mw'],
  'capacity_mw': ['capacitymw', 'capacity', 'installed_capacity'],
  'demand_mw': ['demandmw', 'demand', 'load_mw'],
  
  // Model/Optimization fields
  'model_results_mw': ['modelresultsmw', 'model_results', 'optimal_mw', 'optimization_result'],
  'model_id': ['modelid', 'model', 'run_id'],
  'model_trigger_time': ['modeltriggertime', 'trigger_time', 'run_time', 'execution_time'],
}

// Data type inference
function inferDataType(values: any[]): string {
  const sample = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 100)
  
  if (sample.length === 0) return 'string'
  
  // Check if all values are numbers
  const allNumbers = sample.every(v => !isNaN(Number(v)))
  if (allNumbers) {
    const hasDecimals = sample.some(v => String(v).includes('.'))
    return hasDecimals ? 'float' : 'integer'
  }
  
  // Check if values are dates
  const allDates = sample.every(v => {
    const date = new Date(v)
    return date instanceof Date && !isNaN(date.getTime())
  })
  if (allDates) return 'datetime'
  
  // Check if categorical (low cardinality)
  const uniqueValues = new Set(sample)
  if (uniqueValues.size < 50) return 'category'
  
  return 'string'
}

// Normalize column name for matching
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// Find best match for a column name
function findBestMatch(columnName: string): string {
  const normalized = normalizeColumnName(columnName)
  
  for (const [dbColumn, variants] of Object.entries(COLUMN_MAPPING)) {
    if (variants.some(v => normalized.includes(v) || v.includes(normalized))) {
      return dbColumn
    }
  }
  
  return normalized
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data_source_id, sheet_name } = body

    if (!data_source_id) {
      return NextResponse.json(
        { success: false, error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    // Get the data source
    const dataSource = await db.dataSource.findUnique({
      where: { id: data_source_id },
    })

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      )
    }

    const config = dataSource.config as any
    const filePath = config.filePath
    
    console.log('📁 Attempting to read file:', filePath)

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'File path not found in data source config' },
        { status: 400 }
      )
    }

    // Read the Excel file
    let workbook
    try {
      workbook = XLSX.readFile(filePath)
    } catch (fileError) {
      console.error('❌ Error reading Excel file:', fileError)
      return NextResponse.json(
        { success: false, error: `Failed to read Excel file: ${fileError instanceof Error ? fileError.message : 'File not found'}` },
        { status: 500 }
      )
    }
    
    const sheetToRead = sheet_name || workbook.SheetNames[0]
    
    if (!workbook.Sheets[sheetToRead]) {
      return NextResponse.json(
        { success: false, error: `Sheet "${sheetToRead}" not found in workbook. Available sheets: ${workbook.SheetNames.join(', ')}` },
        { status: 400 }
      )
    }
    
    const worksheet = workbook.Sheets[sheetToRead]
    const rawData = XLSX.utils.sheet_to_json(worksheet)

    if (rawData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sheet is empty' },
        { status: 400 }
      )
    }

    // Extract headers and analyze data
    const headers = Object.keys(rawData[0] as any)
    console.log('📊 Excel headers detected:', headers)
    
    const columnMappings: any[] = []
    const dataToInsert: any[] = []

    // Process each column
    for (const header of headers) {
      const normalizedName = findBestMatch(header)
      const values = rawData.map((row: any) => row[header])
      const dataType = inferDataType(values)
      const sampleValues = [...new Set(values.filter(v => v !== null && v !== undefined))].slice(0, 10)
      
      // Check if this column should be a filter
      const exposeAsFilter = ['region', 'state', 'technology_type', 'contract_type', 'plant_name'].includes(normalizedName)
      
      columnMappings.push({
        column_name: header,
        normalized_name: normalizedName,
        data_type: dataType,
        sample_values: JSON.stringify(sampleValues),
        expose_as_filter: exposeAsFilter,
        ui_filter_type: dataType === 'datetime' ? 'date_range' : 
                        dataType === 'category' ? 'multi_select' : 
                        (dataType === 'integer' || dataType === 'float') ? 'numeric_range' : 'text',
        label: header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      })
    }

    console.log('🔄 Column mappings:', columnMappings.map(c => `${c.column_name} -> ${c.normalized_name} (${c.data_type})`))

    // Save column mappings to database
    for (const mapping of columnMappings) {
      await db.dataSourceColumn.create({
        data: {
          data_source_id,
          ...mapping,
        },
      })
    }

    // Process and insert data into ElectricityData table
    let insertCount = 0
    for (const row of rawData) {
      const mappedRow: any = {}
      
      // Map each field from Excel to database schema
      headers.forEach(header => {
        const mapping = columnMappings.find(m => m.column_name === header)
        if (mapping) {
          const value = (row as any)[header]
          
          // Convert data types
          if (mapping.data_type === 'integer') {
            mappedRow[mapping.normalized_name] = value ? parseInt(value) : null
          } else if (mapping.data_type === 'float') {
            mappedRow[mapping.normalized_name] = value ? parseFloat(value) : null
          } else if (mapping.data_type === 'datetime') {
            mappedRow[mapping.normalized_name] = value ? new Date(value) : null
          } else {
            mappedRow[mapping.normalized_name] = value?.toString() || null
          }
        }
      })

      // Insert into ElectricityData table
      try {
        await db.electricityData.create({
          data: {
            time_period: mappedRow.time_period || new Date(),
            region: mappedRow.region || 'Unknown',
            state: mappedRow.state || 'Unknown',
            technology_type: mappedRow.technology_type || null,
            plant_name: mappedRow.plant_name || null,
            plant_id: mappedRow.plant_id || null,
            contract_name: mappedRow.contract_name || null,
            contract_type: mappedRow.contract_type || null,
            generation_mw: mappedRow.generation_mw || mappedRow.scheduled_mw || mappedRow.actual_mw || null,
            capacity_mw: mappedRow.capacity_mw || null,
            demand_mw: mappedRow.demand_mw || null,
            price_rs_per_mwh: mappedRow.dam_price || mappedRow.rtm_price || mappedRow.gdam_price || mappedRow.price_rs_per_mwh || null,
          },
        })
        insertCount++
      } catch (insertError) {
        console.error('❌ Error inserting row:', insertError)
        // Continue processing other rows even if one fails
      }
    }

    // Update data source status
    await db.dataSource.update({
      where: { id: data_source_id },
      data: {
        status: 'active',
        record_count: insertCount,
        last_sync: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        columns: columnMappings,
        records_inserted: insertCount,
        message: `Successfully processed ${insertCount} records from sheet "${sheetToRead}"`,
      },
    })

    console.log(`✅ Processing complete: ${insertCount} records inserted successfully`)
    
    return NextResponse.json({
      success: true,
      data: {
        columns: columnMappings,
        records_inserted: insertCount,
        message: `Successfully processed ${insertCount} records from sheet "${sheetToRead}"`,
      },
    })

  } catch (error) {
    console.error('❌ Error processing sheet:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process sheet',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}

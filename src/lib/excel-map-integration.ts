import * as XLSX from 'xlsx'

export interface StateCapacityData {
  state: string
  capacity_mw: number
  solar_mw?: number
  wind_mw?: number
  hydro_mw?: number
  thermal_mw?: number
  utilization_percent?: number
  growth_rate?: number
}

export interface ExcelParseResult {
  success: boolean
  data: StateCapacityData[]
  errors: string[]
  stats: {
    total_states: number
    total_capacity: number
    avg_capacity: number
    max_capacity: number
    min_capacity: number
  }
}

/**
 * Parse Excel file and extract state-wise capacity data
 */
export async function parseExcelForMap(file: File): Promise<ExcelParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
    
    if (jsonData.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['No data found in Excel file'],
        stats: {
          total_states: 0,
          total_capacity: 0,
          avg_capacity: 0,
          max_capacity: 0,
          min_capacity: 0
        }
      }
    }

    // Parse and validate data
    const { data, errors } = parseStateData(jsonData)
    
    // Calculate statistics
    const stats = calculateStats(data)
    
    return {
      success: errors.length === 0,
      data,
      errors,
      stats
    }
  } catch (error: any) {
    return {
      success: false,
      data: [],
      errors: [`Failed to parse Excel file: ${error.message}`],
      stats: {
        total_states: 0,
        total_capacity: 0,
        avg_capacity: 0,
        max_capacity: 0,
        min_capacity: 0
      }
    }
  }
}

/**
 * Detect column mappings automatically based on common header patterns
 */
function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  
  const patterns: Record<string, RegExp[]> = {
    state: [/state/i, /region/i, /location/i, /name/i],
    capacity_mw: [/capacity/i, /total.*mw/i, /power/i, /mw/i],
    solar_mw: [/solar/i, /pv/i, /photovoltaic/i],
    wind_mw: [/wind/i],
    hydro_mw: [/hydro/i, /water/i],
    thermal_mw: [/thermal/i, /coal/i, /gas/i],
    utilization_percent: [/utilization/i, /usage/i, /efficiency/i],
    growth_rate: [/growth/i, /increase/i, /rate/i]
  }
  
  for (const header of headers) {
    for (const [field, regexes] of Object.entries(patterns)) {
      if (regexes.some(regex => regex.test(header))) {
        mapping[field] = header
        break
      }
    }
  }
  
  return mapping
}

/**
 * Parse and normalize state data
 */
function parseStateData(jsonData: any[]): { data: StateCapacityData[], errors: string[] } {
  const data: StateCapacityData[] = []
  const errors: string[] = []
  
  if (jsonData.length === 0) {
    return { data, errors: ['No data rows found'] }
  }
  
  // Detect column mapping
  const headers = Object.keys(jsonData[0])
  const mapping = detectColumnMapping(headers)
  
  if (!mapping.state || !mapping.capacity_mw) {
    errors.push('Could not detect required columns: state and capacity_mw')
    // Try fallback to first two columns
    if (headers.length >= 2) {
      mapping.state = headers[0]
      mapping.capacity_mw = headers[1]
      errors.push(`Using fallback: ${headers[0]} as state, ${headers[1]} as capacity`)
    } else {
      return { data, errors }
    }
  }
  
  // Normalize state names
  const stateNameMap = getStateNameNormalization()
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i]
    
    try {
      const stateName = String(row[mapping.state] || '').trim()
      if (!stateName) {
        errors.push(`Row ${i + 2}: Missing state name`)
        continue
      }
      
      // Normalize state name
      const normalizedState = normalizeStateName(stateName, stateNameMap)
      if (!normalizedState) {
        errors.push(`Row ${i + 2}: Unrecognized state name "${stateName}"`)
        continue
      }
      
      // Parse capacity
      const capacity = parseNumber(row[mapping.capacity_mw])
      if (capacity === null || capacity < 0) {
        errors.push(`Row ${i + 2}: Invalid capacity value`)
        continue
      }
      
      const stateData: StateCapacityData = {
        state: normalizedState,
        capacity_mw: capacity,
        solar_mw: mapping.solar_mw ? parseNumber(row[mapping.solar_mw]) || undefined : undefined,
        wind_mw: mapping.wind_mw ? parseNumber(row[mapping.wind_mw]) || undefined : undefined,
        hydro_mw: mapping.hydro_mw ? parseNumber(row[mapping.hydro_mw]) || undefined : undefined,
        thermal_mw: mapping.thermal_mw ? parseNumber(row[mapping.thermal_mw]) || undefined : undefined,
        utilization_percent: mapping.utilization_percent ? parseNumber(row[mapping.utilization_percent]) || undefined : undefined,
        growth_rate: mapping.growth_rate ? parseNumber(row[mapping.growth_rate]) || undefined : undefined
      }
      
      data.push(stateData)
    } catch (error: any) {
      errors.push(`Row ${i + 2}: ${error.message}`)
    }
  }
  
  return { data, errors }
}

/**
 * Parse number from various formats
 */
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }
  
  if (typeof value === 'number') {
    return value
  }
  
  // Remove commas, spaces, and other common formatting
  const cleaned = String(value).replace(/[,\s]/g, '')
  const parsed = parseFloat(cleaned)
  
  return isNaN(parsed) ? null : parsed
}

/**
 * Normalize state names to match map data
 */
function normalizeStateName(name: string, nameMap: Record<string, string>): string | null {
  const cleaned = name.trim().toLowerCase()
  return nameMap[cleaned] || null
}

/**
 * Get state name normalization mapping
 */
function getStateNameNormalization(): Record<string, string> {
  return {
    // Full names
    'andhra pradesh': 'Andhra Pradesh',
    'arunachal pradesh': 'Arunachal Pradesh',
    'assam': 'Assam',
    'bihar': 'Bihar',
    'chhattisgarh': 'Chhattisgarh',
    'goa': 'Goa',
    'gujarat': 'Gujarat',
    'haryana': 'Haryana',
    'himachal pradesh': 'Himachal Pradesh',
    'jharkhand': 'Jharkhand',
    'karnataka': 'Karnataka',
    'kerala': 'Kerala',
    'madhya pradesh': 'Madhya Pradesh',
    'maharashtra': 'Maharashtra',
    'manipur': 'Manipur',
    'meghalaya': 'Meghalaya',
    'mizoram': 'Mizoram',
    'nagaland': 'Nagaland',
    'odisha': 'Odisha',
    'punjab': 'Punjab',
    'rajasthan': 'Rajasthan',
    'sikkim': 'Sikkim',
    'tamil nadu': 'Tamil Nadu',
    'telangana': 'Telangana',
    'tripura': 'Tripura',
    'uttar pradesh': 'Uttar Pradesh',
    'uttarakhand': 'Uttarakhand',
    'west bengal': 'West Bengal',
    
    // Union territories
    'andaman and nicobar islands': 'Andaman and Nicobar',
    'chandigarh': 'Chandigarh',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli',
    'daman and diu': 'Daman and Diu',
    'delhi': 'Delhi',
    'jammu and kashmir': 'Jammu and Kashmir',
    'ladakh': 'Ladakh',
    'lakshadweep': 'Lakshadweep',
    'puducherry': 'Puducherry',
    
    // Abbreviations
    'ap': 'Andhra Pradesh',
    'ar': 'Arunachal Pradesh',
    'as': 'Assam',
    'br': 'Bihar',
    'cg': 'Chhattisgarh',
    'ga': 'Goa',
    'gj': 'Gujarat',
    'hr': 'Haryana',
    'hp': 'Himachal Pradesh',
    'jh': 'Jharkhand',
    'ka': 'Karnataka',
    'kl': 'Kerala',
    'mp': 'Madhya Pradesh',
    'mh': 'Maharashtra',
    'mn': 'Manipur',
    'ml': 'Meghalaya',
    'mz': 'Mizoram',
    'nl': 'Nagaland',
    'or': 'Odisha',
    'pb': 'Punjab',
    'rj': 'Rajasthan',
    'sk': 'Sikkim',
    'tn': 'Tamil Nadu',
    'tg': 'Telangana',
    'tr': 'Tripura',
    'up': 'Uttar Pradesh',
    'uk': 'Uttarakhand',
    'wb': 'West Bengal'
  }
}

/**
 * Calculate statistics from parsed data
 */
function calculateStats(data: StateCapacityData[]) {
  if (data.length === 0) {
    return {
      total_states: 0,
      total_capacity: 0,
      avg_capacity: 0,
      max_capacity: 0,
      min_capacity: 0
    }
  }
  
  const capacities = data.map(d => d.capacity_mw)
  const total_capacity = capacities.reduce((sum, val) => sum + val, 0)
  
  return {
    total_states: data.length,
    total_capacity,
    avg_capacity: total_capacity / data.length,
    max_capacity: Math.max(...capacities),
    min_capacity: Math.min(...capacities)
  }
}

/**
 * Export sample Excel template for users
 */
export function generateSampleExcel(): Blob {
  const sampleData = [
    {
      'State': 'Maharashtra',
      'Total Capacity (MW)': 5500,
      'Solar (MW)': 2000,
      'Wind (MW)': 2500,
      'Hydro (MW)': 800,
      'Thermal (MW)': 200,
      'Utilization (%)': 78,
      'Growth Rate (%)': 12
    },
    {
      'State': 'Gujarat',
      'Total Capacity (MW)': 4800,
      'Solar (MW)': 2200,
      'Wind (MW)': 2000,
      'Hydro (MW)': 400,
      'Thermal (MW)': 200,
      'Utilization (%)': 82,
      'Growth Rate (%)': 15
    },
    {
      'State': 'Tamil Nadu',
      'Total Capacity (MW)': 4200,
      'Solar (MW)': 1500,
      'Wind (MW)': 2000,
      'Hydro (MW)': 500,
      'Thermal (MW)': 200,
      'Utilization (%)': 75,
      'Growth Rate (%)': 10
    },
    {
      'State': 'Karnataka',
      'Total Capacity (MW)': 3900,
      'Solar (MW)': 1800,
      'Wind (MW)': 1500,
      'Hydro (MW)': 400,
      'Thermal (MW)': 200,
      'Utilization (%)': 80,
      'Growth Rate (%)': 14
    },
    {
      'State': 'Rajasthan',
      'Total Capacity (MW)': 3500,
      'Solar (MW)': 2500,
      'Wind (MW)': 800,
      'Hydro (MW)': 100,
      'Thermal (MW)': 100,
      'Utilization (%)': 70,
      'Growth Rate (%)': 18
    }
  ]
  
  const worksheet = XLSX.utils.json_to_sheet(sampleData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'State Capacity Data')
  
  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

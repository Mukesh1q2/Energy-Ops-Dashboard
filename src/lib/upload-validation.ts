/**
 * Upload Validation Library
 * Comprehensive validation for file uploads with security checks
 */

import { z } from 'zod'
import * as XLSX from 'xlsx'

// File type validation
export const ALLOWED_FILE_TYPES = {
  excel: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv'],
  python: ['text/plain', 'application/x-python-code'],
  all: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'text/plain', 'application/x-python-code']
}

export const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.py', '.txt']

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  excel: 100 * 1024 * 1024, // 100MB
  csv: 100 * 1024 * 1024,   // 100MB
  python: 100 * 1024 * 1024,  // 100MB
  default: 100 * 1024 * 1024 // 100MB
}

// Base file validation schema
export const FileValidationSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().positive(),
  type: z.string(),
  lastModified: z.number().optional()
})

// Excel file validation schema
export const ExcelValidationSchema = FileValidationSchema.extend({
  name: z.string().regex(/\.(xlsx?|csv)$/i, 'File must be .xlsx, .xls, or .csv'),
  size: z.number().max(FILE_SIZE_LIMITS.excel, `File size must be less than ${FILE_SIZE_LIMITS.excel / 1024 / 1024}MB`),
  type: z.enum([...ALLOWED_FILE_TYPES.excel, ...ALLOWED_FILE_TYPES.csv] as [string, ...string[]])
})

// Python file validation schema
export const PythonValidationSchema = FileValidationSchema.extend({
  name: z.string().regex(/\.py$/i, 'File must be a .py Python file'),
  size: z.number().max(FILE_SIZE_LIMITS.python, `File size must be less than ${FILE_SIZE_LIMITS.python / 1024 / 1024}MB`),
  type: z.enum(ALLOWED_FILE_TYPES.python as [string, ...string[]])
})

// General file validation with 50MB limit
export const GeneralFileValidationSchema = FileValidationSchema.extend({
  name: z.string().regex(/\.(xlsx?|csv|py|txt)$/i, 'Invalid file type'),
  size: z.number().max(FILE_SIZE_LIMITS.default, `File size must be less than ${FILE_SIZE_LIMITS.default / 1024 / 1024}MB`),
  type: z.enum(ALLOWED_FILE_TYPES.all as [string, ...string[]])
})

// Data validation schemas for different modules
export const DMODataSchema = z.object({
  TimePeriod: z.string().or(z.date()),
  Timeblock: z.number().int().min(1).max(96),
  DAMprice: z.number().optional(),
  RTMprice: z.number().optional(),
  GDAMprice: z.number().optional(),
  ScheduleMW: z.number().optional(),
  ModelresultMW: z.number().optional(),
  State: z.string().optional(),
  PlantName: z.string().optional(),
  Region: z.string().optional(),
  ContractName: z.string().optional()
})

export const RMODataSchema = z.object({
  TimePeriod: z.string().or(z.date()),
  Timeblock: z.number().int().min(1).max(48), // RMO uses 48 blocks
  RTMprice: z.number().optional(),
  ScheduleMW: z.number().optional(),
  ModelresultMW: z.number().optional(),
  State: z.string().optional(),
  PlantName: z.string().optional(),
  Region: z.string().optional(),
  ContractName: z.string().optional(),
  TechnologyType: z.string().optional()
})

export const SODataSchema = z.object({
  TimePeriod: z.string().or(z.date()),
  Timeblock: z.number().int().min(1).max(96),
  BatterySOC: z.number().min(0).max(100), // State of charge percentage
  ChargingMW: z.number().min(0),
  DischargingMW: z.number().min(0),
  EnergyPrice: z.number().optional(),
  State: z.string().optional(),
  PlantName: z.string().optional(),
  BatteryType: z.string().optional(),
  CapacityMWh: z.number().positive().optional(),
  Efficiency: z.number().min(0).max(1).optional() // Efficiency as decimal (0.85 = 85%)
})

// Upload request validation
export const UploadRequestSchema = z.object({
  moduleType: z.enum(['dmo', 'rmo', 'so']),
  sheetName: z.string().optional(),
  preserveExisting: z.boolean().optional().default(false)
})

// Dangerous patterns in Python files
export const DANGEROUS_PYTHON_PATTERNS = [
  // System commands
  /import\s+os/i,
  /import\s+subprocess/i,
  /import\s+sys/i,
  /from\s+os\s+import/i,
  /from\s+subprocess\s+import/i,
  /from\s+sys\s+import/i,
  
  // Network operations
  /import\s+socket/i,
  /import\s+urllib/i,
  /import\s+requests/i,
  /import\s+http/i,
  
  // File system access
  /open\s*\(/i,
  /file\s*\(/i,
  /with\s+open/i,
  
  // Dynamic execution
  /eval\s*\(/i,
  /exec\s*\(/i,
  /compile\s*\(/i,
  /__import__\s*\(/i,
  
  // Shell commands
  /os\.system/i,
  /subprocess\./i,
  /shell\s*=\s*True/i
]

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  metadata?: {
    detectedType?: string
    estimatedRows?: number
    sheetNames?: string[]
    encoding?: string
  }
}

export interface ContentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  validRecords: any[]
  invalidRecords: any[]
  totalRecords: number
}

/**
 * Validate file properties (size, type, name)
 */
export function validateFileProperties(file: File, fileType: 'excel' | 'python' | 'general' = 'general'): FileValidationResult {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    metadata: {}
  }

  try {
    // Choose appropriate schema
    let schema: z.ZodSchema
    switch (fileType) {
      case 'excel':
        schema = ExcelValidationSchema
        break
      case 'python':
        schema = PythonValidationSchema
        break
      default:
        schema = FileValidationSchema
    }

    // Validate with Zod schema
    const validation = schema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    })

    if (!validation.success) {
      result.isValid = false
      result.errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return result
    }

    // Additional file extension validation
    const extension = file.name.toLowerCase().split('.').pop()
    if (!extension || !ALLOWED_EXTENSIONS.includes(`.${extension}`)) {
      result.isValid = false
      result.errors.push(`File extension '.${extension}' is not allowed`)
      return result
    }

    // Detect file type
    result.metadata!.detectedType = extension

    // File-specific validations
    if (fileType === 'python' && extension !== 'py') {
      result.isValid = false
      result.errors.push('Python files must have .py extension')
    }

    if (fileType === 'excel' && !['xlsx', 'xls', 'csv'].includes(extension)) {
      result.isValid = false
      result.errors.push('Excel files must have .xlsx, .xls, or .csv extension')
    }

    // Size warnings
    if (file.size > FILE_SIZE_LIMITS.default / 2) {
      result.warnings.push('Large file detected - processing may take longer')
    }

    return result

  } catch (error) {
    result.isValid = false
    result.errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Validate Python file content for security
 */
export function validatePythonContent(content: string): FileValidationResult {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  }

  try {
    // Check if file is empty
    if (!content.trim()) {
      result.isValid = false
      result.errors.push('Python file is empty')
      return result
    }

    // Check for dangerous patterns
    const lines = content.split('\n')
    lines.forEach((line, index) => {
      const lineNum = index + 1
      
      DANGEROUS_PYTHON_PATTERNS.forEach(pattern => {
        if (pattern.test(line)) {
          result.warnings.push(`Line ${lineNum}: Potentially dangerous code detected - ${pattern.source}`)
        }
      })
    })

    // Basic syntax check (very basic)
    if (content.includes('syntax error') || content.includes('SyntaxError')) {
      result.warnings.push('File may contain syntax errors')
    }

    // Check for very long lines
    const longLines = lines.filter(line => line.length > 1000)
    if (longLines.length > 0) {
      result.warnings.push(`${longLines.length} very long lines detected (>1000 chars)`)
    }

    // If we have warnings about dangerous patterns, mark as potentially unsafe
    if (result.warnings.length > 0) {
      result.warnings.unshift('This Python file contains patterns that may be restricted in sandbox execution')
    }

    return result

  } catch (error) {
    result.isValid = false
    result.errors.push(`Python content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Validate Excel/CSV data content
 */
export async function validateDataContent(file: File, moduleType: 'dmo' | 'rmo' | 'so', sheetName?: string): Promise<ContentValidationResult> {
  const result: ContentValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    validRecords: [],
    invalidRecords: [],
    totalRecords: 0
  }

  try {
    // Read file content
    const buffer = await file.arrayBuffer()
    
    let rawData: any[]
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      // Handle CSV files
      const text = new TextDecoder('utf-8').decode(buffer)
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length === 0) {
        result.errors.push('CSV file is empty')
        result.isValid = false
        return result
      }
      
      // Simple CSV parsing (for basic validation)
      const headers = lines[0].split(',')
      rawData = lines.slice(1).map((line, index) => {
        const values = line.split(',')
        const record: any = {}
        headers.forEach((header, i) => {
          record[header.trim()] = values[i]?.trim() || ''
        })
        return record
      })
    } else {
      // Handle Excel files
      const workbook = XLSX.read(buffer)
      const targetSheet = sheetName || workbook.SheetNames[0]
      
      if (!workbook.Sheets[targetSheet]) {
        result.errors.push(`Sheet '${targetSheet}' not found in workbook`)
        result.isValid = false
        return result
      }
      
      const worksheet = workbook.Sheets[targetSheet]
      rawData = XLSX.utils.sheet_to_json(worksheet)
    }

    if (rawData.length === 0) {
      result.errors.push('No data rows found in file')
      result.isValid = false
      return result
    }

    result.totalRecords = rawData.length

    // Choose appropriate schema based on module type
    let dataSchema: z.ZodSchema
    switch (moduleType) {
      case 'dmo':
        dataSchema = DMODataSchema
        break
      case 'rmo':
        dataSchema = RMODataSchema
        break
      case 'so':
        dataSchema = SODataSchema
        break
      default:
        dataSchema = DMODataSchema // Default fallback
    }

    // Validate each record
    rawData.forEach((record, index) => {
      try {
        // Preprocess record to handle common field mapping
        const processedRecord = preprocessRecord(record, moduleType)
        
        const validation = dataSchema.safeParse(processedRecord)
        
        if (validation.success) {
          result.validRecords.push(validation.data)
        } else {
          result.invalidRecords.push({
            row: index + 1,
            data: record,
            errors: validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
          })
        }
      } catch (error) {
        result.invalidRecords.push({
          row: index + 1,
          data: record,
          errors: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        })
      }
    })

    // Generate summary
    const validCount = result.validRecords.length
    const invalidCount = result.invalidRecords.length
    const validPercentage = (validCount / result.totalRecords) * 100

    if (validPercentage < 50) {
      result.isValid = false
      result.errors.push(`Only ${validPercentage.toFixed(1)}% of records are valid. At least 50% must be valid.`)
    } else if (validPercentage < 80) {
      result.warnings.push(`${validPercentage.toFixed(1)}% of records are valid. ${invalidCount} records will be skipped.`)
    }

    if (invalidCount > 0) {
      result.warnings.push(`${invalidCount} records have validation errors and will be skipped`)
    }

    return result

  } catch (error) {
    result.isValid = false
    result.errors.push(`Data content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Preprocess record to handle common field name variations
 */
function preprocessRecord(record: any, moduleType: 'dmo' | 'rmo' | 'so'): any {
  const processed = { ...record }

  // Common field mappings
  const fieldMappings = {
    // Time period variations
    'TimePeriod': ['time_period', 'Time_Period', 'TimeStamp', 'DateTime'],
    'Timeblock': ['timeblock', 'Time_Block', 'Block', 'TimeBlock'],
    
    // Price variations
    'DAMprice': ['dam_price', 'DAM_Price', 'DamPrice', 'DAM Price'],
    'RTMprice': ['rtm_price', 'RTM_Price', 'RtmPrice', 'RTM Price'],
    'GDAMprice': ['gdam_price', 'GDAM_Price', 'GdamPrice', 'GDAM Price'],
    
    // Volume variations
    'ScheduleMW': ['scheduled_mw', 'Scheduled_MW', 'ScheduledMW', 'Scheduled MW'],
    'ModelresultMW': ['modelresult_mw', 'ModelResult_MW', 'ModelResultMW', 'Model Result MW'],
    
    // SO specific
    'BatterySOC': ['battery_soc', 'Battery_SOC', 'SOC', 'StateOfCharge'],
    'ChargingMW': ['charging_mw', 'Charging_MW', 'Charging MW', 'ChargePower'],
    'DischargingMW': ['discharging_mw', 'Discharging_MW', 'Discharging MW', 'DischargePower'],
    'EnergyPrice': ['energy_price', 'Energy_Price', 'Price', 'MarketPrice'],
    
    // Common fields
    'State': ['state', 'StateName'],
    'PlantName': ['plant_name', 'Plant_Name', 'Plant Name', 'PlantID'],
    'Region': ['region', 'RegionName'],
    'ContractName': ['contract_name', 'Contract_Name', 'Contract Name']
  }

  // Apply mappings
  Object.entries(fieldMappings).forEach(([standardName, variations]) => {
    if (!processed[standardName]) {
      for (const variation of variations) {
        if (processed[variation] !== undefined) {
          processed[standardName] = processed[variation]
          break
        }
      }
    }
  })

  // Type conversions
  if (processed.Timeblock && typeof processed.Timeblock === 'string') {
    processed.Timeblock = parseInt(processed.Timeblock, 10)
  }

  // Convert numeric strings to numbers for price/volume fields
  const numericFields = ['DAMprice', 'RTMprice', 'GDAMprice', 'ScheduleMW', 'ModelresultMW', 'BatterySOC', 'ChargingMW', 'DischargingMW', 'EnergyPrice']
  numericFields.forEach(field => {
    if (processed[field] && typeof processed[field] === 'string') {
      const num = parseFloat(processed[field])
      if (!isNaN(num)) {
        processed[field] = num
      }
    }
  })

  return processed
}

/**
 * Main upload validation function
 */
export async function validateUpload(file: File, moduleType: 'dmo' | 'rmo' | 'so', sheetName?: string): Promise<{
  fileValidation: FileValidationResult
  contentValidation?: ContentValidationResult
  overallValid: boolean
}> {
  // Validate file properties
  const fileType = file.name.toLowerCase().endsWith('.py') ? 'python' : 'excel'
  const fileValidation = validateFileProperties(file, fileType)

  if (!fileValidation.isValid) {
    return {
      fileValidation,
      overallValid: false
    }
  }

  // For data files, validate content
  let contentValidation: ContentValidationResult | undefined
  if (fileType === 'excel') {
    contentValidation = await validateDataContent(file, moduleType, sheetName)
  }

  // For Python files, validate content for security
  if (fileType === 'python') {
    const content = await file.text()
    const pythonValidation = validatePythonContent(content)
    
    // Convert to ContentValidationResult format
    contentValidation = {
      isValid: pythonValidation.isValid,
      errors: pythonValidation.errors,
      warnings: pythonValidation.warnings,
      validRecords: [],
      invalidRecords: [],
      totalRecords: 1
    }
  }

  const overallValid = fileValidation.isValid && (contentValidation?.isValid !== false)

  return {
    fileValidation,
    contentValidation,
    overallValid
  }
}

export default validateUpload
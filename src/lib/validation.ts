// Validation utilities and error handling

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateNumber(value: any, fieldName: string): number {
  const num = Number(value)
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName)
  }
  return num
}

export function validatePositive(value: number, fieldName: string): void {
  if (value < 0) {
    throw new ValidationError(`${fieldName} must be positive`, fieldName)
  }
}

export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new ValidationError(`${fieldName} must be between ${min} and ${max}`, fieldName)
  }
}

export function validateFileSize(size: number, maxSize: number = 50 * 1024 * 1024): void {
  if (size > maxSize) {
    throw new ValidationError(`File size must not exceed ${maxSize / (1024 * 1024)}MB`)
  }
}

export function validateFileType(filename: string, allowedTypes: string[]): void {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext || !allowedTypes.includes(ext)) {
    throw new ValidationError(`File type must be one of: ${allowedTypes.join(', ')}`)
  }
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>]/g, '')
}

export function handleError(error: any): { error: string; details?: string; field?: string } {
  console.error('Error occurred:', error)
  
  if (error instanceof ValidationError) {
    return {
      error: error.message,
      field: error.field
    }
  }
  
  if (error.code === 'ECONNREFUSED') {
    return {
      error: 'Connection refused',
      details: 'Could not connect to the service. Please check if it is running.'
    }
  }
  
  if (error.code === 'ETIMEDOUT') {
    return {
      error: 'Connection timeout',
      details: 'The request took too long to complete. Please try again.'
    }
  }
  
  return {
    error: 'An unexpected error occurred',
    details: error.message || 'Unknown error'
  }
}

// API Response helpers
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message
  }
}

export function errorResponse(error: any, statusCode: number = 500) {
  const errorInfo = handleError(error)
  return {
    success: false,
    ...errorInfo,
    statusCode
  }
}

// Data Quality Assessment
export interface DataQualityReport {
  totalRows: number
  validRows: number
  invalidRows: number
  nullValues: Record<string, number>
  duplicates: number
  dataTypes: Record<string, string>
}

export function detectDataTypes(data: any[]): Record<string, string> {
  if (!data || data.length === 0) return {}

  const headers = Object.keys(data[0])
  const types: Record<string, string> = {}

  headers.forEach(header => {
    const samples = data.slice(0, Math.min(100, data.length)).map(row => row[header])
    types[header] = inferDataType(samples)
  })

  return types
}

function inferDataType(samples: any[]): string {
  const validSamples = samples.filter(s => s !== null && s !== undefined && s !== '')
  
  if (validSamples.length === 0) return 'unknown'

  const allNumbers = validSamples.every(s => !isNaN(Number(s)))
  if (allNumbers) {
    const allIntegers = validSamples.every(s => Number.isInteger(Number(s)))
    return allIntegers ? 'integer' : 'float'
  }

  const allDates = validSamples.every(s => !isNaN(Date.parse(s)))
  if (allDates) return 'date'

  const allBooleans = validSamples.every(s => 
    s === true || s === false || 
    s === 'true' || s === 'false' || 
    s === 1 || s === 0
  )
  if (allBooleans) return 'boolean'

  return 'string'
}

export function generateDataQualityReport(data: any[]): DataQualityReport {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      nullValues: {},
      duplicates: 0,
      dataTypes: {}
    }
  }

  const headers = Object.keys(data[0])
  const nullValues: Record<string, number> = {}
  const dataTypes = detectDataTypes(data)
  
  headers.forEach(header => {
    nullValues[header] = data.filter(row => 
      row[header] === null || row[header] === undefined || row[header] === ''
    ).length
  })

  const uniqueRows = new Set(data.map(row => JSON.stringify(row)))
  const duplicates = data.length - uniqueRows.size

  const validRows = data.filter(row => {
    return headers.every(header => 
      row[header] !== null && row[header] !== undefined && row[header] !== ''
    )
  }).length

  return {
    totalRows: data.length,
    validRows,
    invalidRows: data.length - validRows,
    nullValues,
    duplicates,
    dataTypes
  }
}

export function cleanData(data: any[], options: {
  removeDuplicates?: boolean
  fillNulls?: boolean
  trimStrings?: boolean
} = {}): any[] {
  if (!data || data.length === 0) return data

  let cleaned = [...data]

  if (options.removeDuplicates) {
    const seen = new Set<string>()
    cleaned = cleaned.filter(row => {
      const key = JSON.stringify(row)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  cleaned = cleaned.map(row => {
    const processed: any = {}
    Object.keys(row).forEach(key => {
      let value = row[key]
      
      if (options.trimStrings && typeof value === 'string') {
        value = value.trim()
      }
      
      if (options.fillNulls && (value === null || value === undefined || value === '')) {
        const dataType = inferDataType([value])
        if (dataType === 'integer' || dataType === 'float') {
          value = 0
        } else if (dataType === 'string') {
          value = ''
        } else if (dataType === 'boolean') {
          value = false
        }
      }
      
      processed[key] = value
    })
    return processed
  })

  return cleaned
}

// Error recovery with retry
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

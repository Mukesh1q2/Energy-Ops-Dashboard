/**
 * Export Utilities
 * Provides functions to export data to CSV and Excel formats
 */

export interface ExportColumn {
  key: string
  label: string
  format?: (value: any) => string
}

/**
 * Convert data array to CSV string
 */
export function convertToCSV(data: any[], columns?: ExportColumn[]): string {
  if (data.length === 0) return ''

  // If no columns specified, use all keys from first object
  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }))

  // Create header row
  const headers = cols.map(col => `"${col.label}"`).join(',')

  // Create data rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key]
      const formatted = col.format ? col.format(value) : value
      // Escape quotes and wrap in quotes
      const escaped = String(formatted).replace(/"/g, '""')
      return `"${escaped}"`
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string, columns?: ExportColumn[]): void {
  const csv = convertToCSV(data, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Convert data to Excel-compatible format (TSV)
 * Can be opened directly in Excel
 */
export function convertToExcel(data: any[], columns?: ExportColumn[]): string {
  if (data.length === 0) return ''

  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }))

  // Create header row
  const headers = cols.map(col => col.label).join('\t')

  // Create data rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key]
      return col.format ? col.format(value) : String(value)
    }).join('\t')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Download Excel file (TSV format)
 */
export function downloadExcel(data: any[], filename: string, columns?: ExportColumn[]): void {
  const tsv = convertToExcel(data, columns)
  const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Download JSON file
 */
export function downloadJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Copy data to clipboard as CSV
 */
export async function copyToClipboard(data: any[], columns?: ExportColumn[]): Promise<boolean> {
  try {
    const csv = convertToCSV(data, columns)
    await navigator.clipboard.writeText(csv)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format date to string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format datetime to string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

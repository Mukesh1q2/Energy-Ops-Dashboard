/**
 * Batch Export Utilities
 * 
 * Provides functionality to export multiple datasets as CSV/Excel files
 * bundled together in a ZIP archive for easy download.
 */

import JSZip from 'jszip'
import { formatNumber, formatDateTime } from './export-utils'

export interface ExportColumn {
  key: string
  label: string
  format?: (value: any) => string | number
}

export interface ExportDataset {
  name: string
  data: any[]
  columns: ExportColumn[]
  format: 'csv' | 'excel'
}

export interface BatchExportOptions {
  datasets: ExportDataset[]
  zipFileName: string
  includeMetadata?: boolean
}

/**
 * Generate CSV content from data and columns
 */
function generateCSV(data: any[], columns: ExportColumn[]): string {
  // Header row
  const header = columns.map(col => col.label).join(',')
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key]
      
      // Apply formatting if provided
      if (col.format && value != null) {
        value = col.format(value)
      }
      
      // Handle null/undefined
      if (value == null) {
        return ''
      }
      
      // Escape quotes and wrap in quotes if contains comma or quotes
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    }).join(',')
  }).join('\n')
  
  return `${header}\n${rows}`
}

/**
 * Generate Excel content (CSV format for simplicity)
 * For true Excel files, would need a library like exceljs or xlsx
 */
function generateExcel(data: any[], columns: ExportColumn[]): string {
  // For now, use CSV format with .xlsx extension
  // In production, consider using exceljs for proper Excel files
  return generateCSV(data, columns)
}

/**
 * Generate metadata file with export information
 */
function generateMetadata(datasets: ExportDataset[]): string {
  const metadata = {
    exportDate: new Date().toISOString(),
    exportTimestamp: Date.now(),
    totalDatasets: datasets.length,
    datasets: datasets.map(ds => ({
      name: ds.name,
      format: ds.format,
      recordCount: ds.data.length,
      columnCount: ds.columns.length,
      columns: ds.columns.map(col => col.label)
    })),
    generatedBy: 'Energy-Ops Dashboard',
    version: '1.0.0'
  }
  
  return JSON.stringify(metadata, null, 2)
}

/**
 * Export multiple datasets as a single ZIP file
 */
export async function batchExportAsZip(options: BatchExportOptions): Promise<void> {
  const { datasets, zipFileName, includeMetadata = true } = options
  
  if (datasets.length === 0) {
    throw new Error('No datasets provided for export')
  }
  
  try {
    // Create new ZIP instance
    const zip = new JSZip()
    
    // Add each dataset to the ZIP
    for (const dataset of datasets) {
      const { name, data, columns, format } = dataset
      
      if (data.length === 0) {
        console.warn(`Dataset "${name}" is empty, skipping`)
        continue
      }
      
      // Generate file content based on format
      let content: string
      let extension: string
      
      if (format === 'excel') {
        content = generateExcel(data, columns)
        extension = 'xlsx'
      } else {
        content = generateCSV(data, columns)
        extension = 'csv'
      }
      
      // Sanitize filename
      const sanitizedName = name.replace(/[^a-z0-9_-]/gi, '_')
      const fileName = `${sanitizedName}.${extension}`
      
      // Add file to ZIP
      zip.file(fileName, content)
    }
    
    // Add metadata file if requested
    if (includeMetadata) {
      const metadata = generateMetadata(datasets)
      zip.file('export_metadata.json', metadata)
    }
    
    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6 // Balance between speed and compression
      }
    })
    
    // Trigger download
    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${zipFileName}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error creating ZIP file:', error)
    throw new Error(
      error instanceof Error 
        ? `Failed to create ZIP: ${error.message}` 
        : 'Failed to create ZIP file'
    )
  }
}

/**
 * Quick batch export helper for common dashboard data
 */
export async function exportDashboardData(options: {
  includeCapacity?: boolean
  includeDMO?: boolean
  includeMarket?: boolean
  includeNotifications?: boolean
}): Promise<void> {
  const datasets: ExportDataset[] = []
  const timestamp = new Date().toISOString().split('T')[0]
  
  // This is a helper that would be called with actual data
  // For now, it's a template showing the structure
  
  if (options.includeCapacity) {
    // Would fetch capacity data here
    // datasets.push({ name: 'capacity_data', data: [], columns: [], format: 'csv' })
  }
  
  if (options.includeDMO) {
    // Would fetch DMO data here
    // datasets.push({ name: 'dmo_data', data: [], columns: [], format: 'csv' })
  }
  
  if (options.includeMarket) {
    // Would fetch market data here
    // datasets.push({ name: 'market_data', data: [], columns: [], format: 'csv' })
  }
  
  if (options.includeNotifications) {
    // Would fetch notifications here
    // datasets.push({ name: 'notifications', data: [], columns: [], format: 'csv' })
  }
  
  await batchExportAsZip({
    datasets,
    zipFileName: `dashboard_export_${timestamp}`
  })
}

/**
 * Calculate estimated ZIP size (approximate)
 */
export function estimateZipSize(datasets: ExportDataset[]): number {
  let totalSize = 0
  
  for (const dataset of datasets) {
    const { data, columns } = dataset
    
    // Rough estimate: each row is ~100 bytes per column
    const estimatedRowSize = columns.length * 100
    const datasetSize = data.length * estimatedRowSize
    
    totalSize += datasetSize
  }
  
  // ZIP compression typically achieves 60-80% reduction for text
  return Math.round(totalSize * 0.3)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

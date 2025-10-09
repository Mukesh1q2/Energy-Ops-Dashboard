/**
 * Data Source Manager
 * Manages DataSource creation, updates, and column metadata extraction from Excel uploads
 */

import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export interface ColumnMetadata {
  columnName: string
  normalizedName: string
  dataType: string
  sampleValues: any[]
  exposeAsFilter: boolean
  uiFilterType: string
  label: string
}

export interface DataSourceConfig {
  moduleName: string // 'dmo-generator', 'dmo-contract', 'dmo-market', 'rmo', 'so'
  displayName: string // 'DMO Generator Scheduling', etc.
  tableName: string // Prisma model name
  fileName: string
  fileSize: number
  recordCount: number
}

/**
 * Extract column metadata from Excel file
 */
export async function extractColumnMetadata(
  filePath: string,
  sheetIndex: number = 0
): Promise<ColumnMetadata[]> {
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[sheetIndex]
  const worksheet = workbook.Sheets[sheetName]
  const rawData = XLSX.utils.sheet_to_json(worksheet)

  if (rawData.length === 0) {
    return []
  }

  const firstRow = rawData[0] as Record<string, any>
  const columns: ColumnMetadata[] = []

  for (const [key, value] of Object.entries(firstRow)) {
    // Get sample values (up to 10 unique values)
    const sampleValues = Array.from(
      new Set(
        rawData
          .slice(0, 100)
          .map((row: any) => row[key])
          .filter((v) => v != null && v !== '')
      )
    ).slice(0, 10)

    // Infer data type
    const dataType = inferDataType(value, sampleValues)

    // Determine if should be exposed as filter
    const uniqueCount = sampleValues.length
    const exposeAsFilter = dataType !== 'number' && uniqueCount > 0 && uniqueCount <= 50

    // Determine UI filter type
    const uiFilterType = getUIFilterType(dataType, uniqueCount)

    columns.push({
      columnName: key,
      normalizedName: normalizeColumnName(key),
      dataType,
      sampleValues,
      exposeAsFilter,
      uiFilterType,
      label: formatLabel(key),
    })
  }

  return columns
}

/**
 * Infer data type from sample values
 */
function inferDataType(value: any, samples: any[]): string {
  if (value instanceof Date || samples.some((s) => s instanceof Date)) {
    return 'datetime'
  }

  if (typeof value === 'number' || samples.every((s) => !isNaN(parseFloat(s)))) {
    return 'number'
  }

  if (typeof value === 'boolean') {
    return 'boolean'
  }

  // Check if it looks like a date string
  if (typeof value === 'string' && !isNaN(Date.parse(value))) {
    return 'date'
  }

  return 'string'
}

/**
 * Normalize column name to database-friendly format
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Format label for UI display
 */
function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Determine UI filter type based on data characteristics
 */
function getUIFilterType(dataType: string, uniqueCount: number): string {
  if (dataType === 'datetime' || dataType === 'date') {
    return 'date-range'
  }

  if (dataType === 'number') {
    return 'number-range'
  }

  if (dataType === 'boolean') {
    return 'checkbox'
  }

  // For strings, use dropdown if few unique values, otherwise text input
  if (uniqueCount <= 20) {
    return 'dropdown'
  }

  return 'text-search'
}

/**
 * Create or update DataSource with columns
 */
export async function createOrUpdateDataSource(
  config: DataSourceConfig,
  columns: ColumnMetadata[]
) {
  const dataSourceName = `${config.moduleName}-${Date.now()}`

  // Check if data source exists
  const existing = await prisma.dataSource.findFirst({
    where: {
      name: config.moduleName,
    },
  })

  let dataSource

  if (existing) {
    // Update existing data source
    dataSource = await prisma.dataSource.update({
      where: { id: existing.id },
      data: {
        last_sync: new Date(),
        record_count: config.recordCount,
        config: {
          fileName: config.fileName,
          fileSize: config.fileSize,
          tableName: config.tableName,
          lastUpdated: new Date().toISOString(),
        },
        updated_at: new Date(),
      },
    })

    // Delete old columns
    await prisma.dataSourceColumn.deleteMany({
      where: { data_source_id: existing.id },
    })
  } else {
    // Create new data source
    dataSource = await prisma.dataSource.create({
      data: {
        name: config.moduleName,
        type: 'file',
        status: 'connected',
        config: {
          fileName: config.fileName,
          fileSize: config.fileSize,
          tableName: config.tableName,
          displayName: config.displayName,
          createdAt: new Date().toISOString(),
        },
        last_sync: new Date(),
        record_count: config.recordCount,
      },
    })
  }

  // Create columns
  await prisma.dataSourceColumn.createMany({
    data: columns.map((col) => ({
      data_source_id: dataSource.id,
      column_name: col.columnName,
      normalized_name: col.normalizedName,
      data_type: col.dataType,
      sample_values: col.sampleValues,
      expose_as_filter: col.exposeAsFilter,
      ui_filter_type: col.uiFilterType,
      label: col.label,
    })),
  })

  return dataSource
}

/**
 * Get timeblock configuration for different modules
 */
export function getTimeblockConfig(moduleType: 'dmo' | 'rmo' | 'so') {
  switch (moduleType) {
    case 'dmo':
      return {
        totalBlocks: 96,
        intervalMinutes: 15,
        label: '15-min blocks',
      }
    case 'rmo':
      return {
        totalBlocks: 48,
        intervalMinutes: 30,
        label: '30-min blocks',
      }
    case 'so':
      return {
        totalBlocks: 96,
        intervalMinutes: 15,
        label: '15-min blocks',
      }
    default:
      return {
        totalBlocks: 96,
        intervalMinutes: 15,
        label: '15-min blocks',
      }
  }
}

/**
 * Generate timeblock labels for charts
 */
export function generateTimeblockLabels(
  moduleType: 'dmo' | 'rmo' | 'so'
): { blockIndex: number; timeLabel: string }[] {
  const config = getTimeblockConfig(moduleType)
  const labels: { blockIndex: number; timeLabel: string }[] = []

  for (let i = 0; i < config.totalBlocks; i++) {
    const totalMinutes = i * config.intervalMinutes
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    labels.push({
      blockIndex: i + 1,
      timeLabel,
    })
  }

  return labels
}

/**
 * Create default charts for a data source
 */
export async function createDefaultCharts(
  dataSourceId: string,
  dashboardId: string,
  moduleType: 'dmo' | 'rmo' | 'so',
  createdBy: string = 'system'
) {
  const timeblockConfig = getTimeblockConfig(moduleType)
  const timeblockLabels = generateTimeblockLabels(moduleType)

  const charts = []

  // Chart 1: Timeblock Price Chart
  charts.push({
    dashboard_id: dashboardId,
    data_source_id: dataSourceId,
    name: `${moduleType.toUpperCase()} Price by Timeblock`,
    chart_config: {
      type: 'line',
      xAxis: {
        type: 'category',
        data: timeblockLabels.map((l) => `B${l.blockIndex} (${l.timeLabel})`),
        label: `Time Block (${timeblockConfig.label})`,
      },
      yAxis: {
        type: 'value',
        label: 'Price (Rs/MWh)',
      },
      series: [
        {
          name: 'DAM Price',
          dataKey: 'dam_price',
          type: 'line',
        },
        {
          name: 'RTM Price',
          dataKey: 'rtm_price',
          type: 'line',
        },
      ],
      legend: {
        show: true,
        position: 'top',
      },
    },
    created_by: createdBy,
  })

  // Chart 2: Timeblock Volume Chart
  charts.push({
    dashboard_id: dashboardId,
    data_source_id: dataSourceId,
    name: `${moduleType.toUpperCase()} Volume by Timeblock`,
    chart_config: {
      type: 'bar',
      xAxis: {
        type: 'category',
        data: timeblockLabels.map((l) => `B${l.blockIndex}`),
        label: 'Time Block',
      },
      yAxis: {
        type: 'value',
        label: 'Volume (MW)',
      },
      series: [
        {
          name: 'Scheduled MW',
          dataKey: 'scheduled_mw',
          type: 'bar',
        },
        {
          name: 'Actual MW',
          dataKey: 'actual_mw',
          type: 'bar',
        },
      ],
      legend: {
        show: true,
        position: 'top',
      },
    },
    created_by: createdBy,
  })

  // Create charts in database
  await prisma.dashboardChart.createMany({
    data: charts,
  })

  return charts
}

/**
 * Get filter options for a data source column
 */
export async function getColumnFilterOptions(
  dataSourceId: string,
  columnName: string
) {
  const column = await prisma.dataSourceColumn.findFirst({
    where: {
      data_source_id: dataSourceId,
      column_name: columnName,
    },
  })

  if (!column) {
    return []
  }

  return column.sample_values as any[]
}

/**
 * Get all filterable columns for a data source
 */
export async function getFilterableColumns(dataSourceId: string) {
  return await prisma.dataSourceColumn.findMany({
    where: {
      data_source_id: dataSourceId,
      expose_as_filter: true,
    },
    select: {
      id: true,
      column_name: true,
      normalized_name: true,
      data_type: true,
      sample_values: true,
      ui_filter_type: true,
      label: true,
    },
  })
}

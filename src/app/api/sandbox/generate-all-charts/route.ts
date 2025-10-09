import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/sandbox/generate-all-charts
 * Generate charts for DMO, RMO, and SO dashboards from uploaded Excel file
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data_source_id } = body;

    if (!data_source_id) {
      return NextResponse.json(
        { success: false, error: 'Data source ID is required' },
        { status: 400 }
      );
    }

    // Get the data source and its columns
    const dataSource = await db.dataSource.findUnique({
      where: { id: data_source_id },
      include: {
        columns: true
      }
    });

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      );
    }

    const columnNames = dataSource.columns.map(c => c.column_name.toLowerCase());
    const normalizedNames = dataSource.columns.map(c => c.normalized_name.toLowerCase());
    const allColumnNames = [...columnNames, ...normalizedNames];

    // Helper function to check if columns exist
    const hasColumn = (patterns: string[]) => {
      return patterns.some(pattern => 
        allColumnNames.some(col => col.includes(pattern.toLowerCase()))
      );
    };

    const createdCharts: any[] = [];
    const tableName = (dataSource.config as any)?.tableName;

    // DMO Dashboard Charts
    if (hasColumn(['scheduledmw', 'modelresultsmw']) && hasColumn(['technologytype', 'technology'])) {
      // Chart 1: Generation by Technology Type (Bar)
      createdCharts.push(await createChart({
        dashboard_id: 'dmo',
        data_source_id,
        name: 'Generation by Technology',
        chart_type: 'bar',
        config: {
          dataSource: tableName,
          xAxis: findColumn(['technologytype', 'technology'], dataSource.columns),
          yAxis: findColumn(['scheduledmw', 'modelresultsmw'], dataSource.columns),
          aggregation: 'sum',
          title: 'Total Generation by Technology Type (MW)'
        }
      }));

      // Chart 2: Time Series of Generation (Line)
      if (hasColumn(['timeperiod', 'time', 'date'])) {
        createdCharts.push(await createChart({
          dashboard_id: 'dmo',
          data_source_id,
          name: 'Generation Over Time',
          chart_type: 'line',
          config: {
            dataSource: tableName,
            xAxis: findColumn(['timeperiod', 'time', 'date'], dataSource.columns),
            yAxis: findColumn(['scheduledmw', 'modelresultsmw'], dataSource.columns),
            groupBy: findColumn(['technologytype', 'technology'], dataSource.columns),
            title: 'Generation Over Time by Technology (MW)'
          }
        }));
      }
    }

    // RMO Dashboard Charts
    if (hasColumn(['damprice', 'gdamprice', 'rtmprice', 'price'])) {
      // Chart 1: Price Comparison (Line)
      if (hasColumn(['timeperiod', 'time', 'date'])) {
        createdCharts.push(await createChart({
          dashboard_id: 'rmo',
          data_source_id,
          name: 'Market Prices',
          chart_type: 'line',
          config: {
            dataSource: tableName,
            xAxis: findColumn(['timeperiod', 'time', 'date'], dataSource.columns),
            yAxis: findColumn(['damprice', 'gdamprice', 'price'], dataSource.columns),
            title: 'Market Price Trends (₹/MWh)'
          }
        }));
      }

      // Chart 2: Revenue by Plant (Bar)
      if (hasColumn(['plantname', 'plant'])) {
        createdCharts.push(await createChart({
          dashboard_id: 'rmo',
          data_source_id,
          name: 'Revenue by Plant',
          chart_type: 'bar',
          config: {
            dataSource: tableName,
            xAxis: findColumn(['plantname', 'plant'], dataSource.columns),
            yAxis: findColumn(['damprice', 'price'], dataSource.columns),
            aggregation: 'avg',
            title: 'Average Price by Plant (₹/MWh)'
          }
        }));
      }
    }

    // SO Dashboard Charts
    if (hasColumn(['region', 'state']) && hasColumn(['scheduledmw', 'modelresultsmw'])) {
      // Chart 1: Generation by Region (Pie)
      createdCharts.push(await createChart({
        dashboard_id: 'so',
        data_source_id,
        name: 'Generation by Region',
        chart_type: 'pie',
        config: {
          dataSource: tableName,
          dimension: findColumn(['region', 'state'], dataSource.columns),
          value: findColumn(['scheduledmw', 'modelresultsmw'], dataSource.columns),
          aggregation: 'sum',
          title: 'Total Generation by Region (MW)'
        }
      }));

      // Chart 2: Regional Comparison (Bar)
      createdCharts.push(await createChart({
        dashboard_id: 'so',
        data_source_id,
        name: 'Regional Comparison',
        chart_type: 'bar',
        config: {
          dataSource: tableName,
          xAxis: findColumn(['region', 'state'], dataSource.columns),
          yAxis: findColumn(['scheduledmw', 'modelresultsmw'], dataSource.columns),
          aggregation: 'sum',
          title: 'Generation by Region (MW)'
        }
      }));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCharts.length} charts across DMO/RMO/SO dashboards`,
      charts: createdCharts,
      count: createdCharts.length
    });

  } catch (error) {
    console.error('Error generating charts for all dashboards:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate charts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to find a column by patterns
function findColumn(patterns: string[], columns: any[]): string {
  for (const pattern of patterns) {
    const found = columns.find(col => 
      col.column_name.toLowerCase().includes(pattern.toLowerCase()) ||
      col.normalized_name.toLowerCase().includes(pattern.toLowerCase())
    );
    if (found) return found.normalized_name;
  }
  return patterns[0]; // Fallback to first pattern
}

// Helper function to create a chart
async function createChart(params: {
  dashboard_id: string;
  data_source_id: string;
  name: string;
  chart_type: string;
  config: any;
}) {
  try {
    const chart = await db.dashboardChart.create({
      data: {
        dashboard_id: params.dashboard_id,
        data_source_id: params.data_source_id,
        name: params.name,
        chart_config: {
          type: params.chart_type,
          ...params.config
        },
        created_by: 'sandbox-autoplot'
      }
    });
    return chart;
  } catch (error) {
    console.error(`Error creating chart "${params.name}":`, error);
    return null;
  }
}

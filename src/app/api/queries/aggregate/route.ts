import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataSourceId = searchParams.get('data_source_id')
    const filters = searchParams.get('filters') ? JSON.parse(searchParams.get('filters')!) : {}
    const x = searchParams.get('x')
    const y = searchParams.get('y')
    const agg = searchParams.get('agg') || 'sum'
    const groupBy = searchParams.get('group_by')

    if (!dataSourceId || !x || !y) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const dataSource = await db.dataSource.findUnique({
      where: { id: dataSourceId },
      include: { columns: true },
    });

    if (!dataSource || !dataSource.config || typeof dataSource.config !== 'object' || !('tableName' in dataSource.config)) {
      return NextResponse.json(
        { success: false, error: 'Data source not found or not properly configured' },
        { status: 404 }
      )
    }

    const config = dataSource.config as { tableName: string };
    const tableName = config.tableName;

    const xColumn = dataSource.columns.find(c => c.normalized_name === x)?.normalized_name;
    const yColumn = dataSource.columns.find(c => c.normalized_name === y)?.normalized_name;
    const groupByColumn = dataSource.columns.find(c => c.normalized_name === groupBy)?.normalized_name;

    if (!xColumn || !yColumn) {
        return NextResponse.json({ success: false, error: 'Invalid x or y column' }, { status: 400 });
    }

    let selectClause = `"${xColumn}"`;
    let groupByClause = `GROUP BY "${xColumn}"`;

    if (groupByColumn) {
        selectClause += `, "${groupByColumn}"`;
        groupByClause += `, "${groupByColumn}"`;
    }

    const aggFunction = agg === 'avg' ? 'AVG' : agg === 'count' ? 'COUNT' : 'SUM';
    selectClause += `, ${aggFunction}("${yColumn}") as "${yColumn}"`;

    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            const col = dataSource.columns.find(c => c.normalized_name === key);
            if (col) {
                if (Array.isArray(value) && value.length > 0) {
                    whereConditions.push(`"${col.normalized_name}" IN (${value.map(() => '?').join(', ')})`);
                    queryParams.push(...value);
                } else if (!Array.isArray(value)) {
                    whereConditions.push(`"${col.normalized_name}" = ?`);
                    queryParams.push(value);
                }
            }
        }
    });

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    const query = `SELECT ${selectClause} FROM "${tableName}" ${whereClause} ${groupByClause} LIMIT 1000;`;

    const result = await db.$queryRawUnsafe(query, ...queryParams);

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error fetching aggregated data:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch aggregated data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data_source_id } = body

    if (!data_source_id) {
      return NextResponse.json(
        { success: false, error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    const columns = await db.dataSourceColumn.findMany({
      where: { data_source_id: data_source_id },
    })

    if (columns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No columns found for this data source' },
        { status: 404 }
      )
    }

    const suggestions = generateChartSuggestions(columns);

    return NextResponse.json({
      success: true,
      data: suggestions,
    })
  } catch (error) {
    console.error('Error generating autoplot suggestions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate autoplot suggestions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateChartSuggestions(columns: any[]) {
    const suggestions = new Map<string, any>();
    const numericColumns = columns.filter(c => ['numeric', 'integer', 'float'].includes(c.data_type));
    const stringColumns = columns.filter(c => ['string', 'category'].includes(c.data_type));
    const dateColumns = columns.filter(c => ['date', 'datetime'].includes(c.data_type));

    const addSuggestion = (key: string, suggestion: any) => {
        if (!suggestions.has(key)) {
            suggestions.set(key, suggestion);
        }
    };

    // Heuristic 1: Time Series (Line/Area Chart)
    if (dateColumns.length > 0 && numericColumns.length > 0) {
        const dateCol = dateColumns[0];
        numericColumns.forEach(numCol => {
            const key = `line-${dateCol.normalized_name}-${numCol.normalized_name}`;
            addSuggestion(key, {
                chart_type: 'line',
                label: `Time Series of ${numCol.label || numCol.column_name}`,
                confidence: 0.85,
                chart_config: {
                    x: dateCol.normalized_name,
                    y: numCol.normalized_name,
                    agg: 'sum',
                    chart_type: 'line',
                    title: `${numCol.label || numCol.column_name} over Time`
                }
            });
        });
    }

    // Heuristic 2: Categorical vs. Numeric (Bar Chart)
    if (stringColumns.length > 0 && numericColumns.length > 0) {
        stringColumns.forEach(strCol => {
            // Assume low cardinality for now, in a real scenario we'd check unique values
            numericColumns.forEach(numCol => {
                const key = `bar-${strCol.normalized_name}-${numCol.normalized_name}`;
                addSuggestion(key, {
                    chart_type: 'bar',
                    label: `Sum of ${numCol.label || numCol.column_name} by ${strCol.label || strCol.column_name}`,
                    confidence: 0.8,
                    chart_config: {
                        x: strCol.normalized_name,
                        y: numCol.normalized_name,
                        agg: 'sum',
                        chart_type: 'bar',
                        title: `Sum of ${numCol.label || numCol.column_name} by ${strCol.label || strCol.column_name}`
                    }
                });
            });
        });
    }

    // Heuristic 3: Two Numeric Columns (Scatter Plot)
    if (numericColumns.length >= 2) {
        const key = `scatter-${numericColumns[0].normalized_name}-${numericColumns[1].normalized_name}`;
        addSuggestion(key, {
            chart_type: 'scatter',
            label: `Relationship between ${numericColumns[0].label || numericColumns[0].column_name} and ${numericColumns[1].label || numericColumns[1].column_name}`,
            confidence: 0.75,
            chart_config: {
                x: numericColumns[0].normalized_name,
                y: numericColumns[1].normalized_name,
                chart_type: 'scatter',
                title: `Scatter Plot of ${numericColumns[0].label || numericColumns[0].column_name} vs. ${numericColumns[1].label || numericColumns[1].column_name}`
            }
        });
    }

    // Heuristic 4: Categorical Distribution (Pie Chart) - only for low cardinality
    if (stringColumns.length > 0 && numericColumns.length > 0) {
        stringColumns.forEach(strCol => {
            // This is a mock cardinality check. A real implementation would query distinct values.
            const isLowCardinality = true;
            if (isLowCardinality) {
                const key = `pie-${strCol.normalized_name}-${numericColumns[0].normalized_name}`;
                addSuggestion(key, {
                    chart_type: 'pie',
                    label: `Distribution of ${numericColumns[0].label || numericColumns[0].column_name} by ${strCol.label || strCol.column_name}`,
                    confidence: 0.7,
                    chart_config: {
                        group_by: strCol.normalized_name,
                        y: numericColumns[0].normalized_name,
                        agg: 'sum',
                        chart_type: 'pie',
                        title: `Distribution by ${strCol.label || strCol.column_name}`
                    }
                });
            }
        });
    }

    // Heuristic 5: Histogram for a single numeric column
    numericColumns.forEach(numCol => {
        const key = `histogram-${numCol.normalized_name}`;
        addSuggestion(key, {
            chart_type: 'bar', // Representing histogram as a bar chart
            label: `Distribution of ${numCol.label || numCol.column_name}`,
            confidence: 0.65,
            chart_config: {
                x: numCol.normalized_name,
                agg: 'count',
                chart_type: 'bar',
                title: `Histogram of ${numCol.label || numCol.column_name}`
            }
        });
    });

    return Array.from(suggestions.values());
}
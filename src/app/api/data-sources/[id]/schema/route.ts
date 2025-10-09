import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dataSourceId } = await params;
    const schema = await db.dataSourceColumn.findMany({
      where: { data_source_id: dataSourceId },
      orderBy: { column_name: 'asc' },
    });

    if (!schema) {
      return NextResponse.json(
        { success: false, error: 'Schema not found for this data source' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schema,
    });
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dataSourceId } = await params;
    const body = await request.json();
    const { mappings } = body;

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json(
        { success: false, error: 'Invalid mappings data provided' },
        { status: 400 }
      );
    }

    for (const mapping of mappings) {
      await db.dataSourceColumn.update({
        where: { id: mapping.id },
        data: {
          expose_as_filter: mapping.expose_as_filter,
          ui_filter_type: mapping.ui_filter_type,
          label: mapping.label,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Schema mapping updated successfully.',
    });
  } catch (error) {
    console.error('Error updating schema mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update schema mapping',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
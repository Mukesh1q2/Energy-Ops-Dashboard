import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dataSourceId } = await params
    const body = await request.json()
    const { sheetName } = body

    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: 'Sheet name is required' },
        { status: 400 }
      )
    }

    const dataSource = await db.dataSource.findUnique({
      where: { id: dataSourceId },
    })

    if (!dataSource) {
      return NextResponse.json(
        { success: false, error: 'Data source not found' },
        { status: 404 }
      )
    }

    const config = dataSource.config as { filePath: string };
    const filePath = config.filePath;

    const buffer = await readFile(filePath)
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    if (!workbook.SheetNames.includes(sheetName)) {
        return NextResponse.json(
            { success: false, error: 'Sheet not found in the workbook' },
            { status: 404 }
        );
    }

    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
        return NextResponse.json(
            { success: false, error: 'The selected sheet is empty' },
            { status: 400 }
        );
    }

    const headers = Object.keys(data[0]);

    // Clear any existing columns for this data source
    await db.dataSourceColumn.deleteMany({
        where: { data_source_id: dataSourceId },
    });

    const createdColumns = [];
    const sample = data.slice(0, 100); // Sample first 100 rows for inference

    for (const header of headers) {
        const normalized_name = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
        let dataType = 'string';

        const isNumeric = sample.every(row => row[header] === null || row[header] === '' || !isNaN(parseFloat(row[header])));
        if (isNumeric) {
            dataType = 'numeric';
        } else {
            const isDate = sample.every(row => row[header] === null || row[header] === '' || !isNaN(Date.parse(row[header])));
            if (isDate) {
                dataType = 'date';
            }
        }

        const columnData = {
            data_source_id: dataSourceId,
            column_name: header,
            normalized_name: normalized_name,
            data_type: dataType,
            expose_as_filter: false,
        };

        const createdColumn = await db.dataSourceColumn.create({
            data: columnData,
        });
        createdColumns.push(createdColumn);
    }

    const tableName = `ds_${dataSourceId.replace(/-/g, '_')}`;

    // Drop the table if it already exists
    try {
        await db.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}";`);
    } catch (e) {
        // Ignore error if table doesn't exist
    }

    // Create a new table for the data source
    const createTableQuery = `
      CREATE TABLE "${tableName}" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        ${createdColumns.map(c => `"${c.normalized_name}" TEXT`).join(',\n')}
      );
    `;
    await db.$executeRawUnsafe(createTableQuery);

    // Prepare data for bulk insert
    const dataToInsert = data.map(row => {
        const newRow: Record<string, any> = {};
        for (const col of createdColumns) {
            newRow[col.normalized_name] = row[col.column_name]?.toString() || null;
        }
        return newRow;
    });

    // Insert data in chunks to avoid overwhelming the database
    const chunkSize = 500;
    for (let i = 0; i < dataToInsert.length; i += chunkSize) {
        const chunk = dataToInsert.slice(i, i + chunkSize);
        const columns = createdColumns.map(c => `"${c.normalized_name}"`).join(', ');
        const placeholders = chunk.map(() => `(${createdColumns.map(() => '?').join(', ')})`).join(', ');
        const values = chunk.flatMap(row => createdColumns.map(c => row[c.normalized_name]));

        const insertQuery = `INSERT INTO "${tableName}" (${columns}) VALUES ${placeholders};`;
        await db.$executeRawUnsafe(insertQuery, ...values);
    }

    await db.dataSource.update({
        where: { id: dataSourceId },
        data: {
            status: 'ready',
            config: {
                ...dataSource.config as object,
                tableName: tableName,
            }
        },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Sheet "${sheetName}" has been ingested and is ready for querying.`,
        tableName: tableName,
        schema: createdColumns,
      },
    })
  } catch (error) {
    console.error('Error selecting sheet:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to select sheet',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
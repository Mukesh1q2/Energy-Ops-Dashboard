import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import { uploadLimiter, withRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  return withRateLimit(request, uploadLimiter, async () => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (100MB limit)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 100MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/json',
      'text/plain' // For .json files that might be detected as text/plain
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only Excel, CSV, and JSON files are supported.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    let sheets: { name: string; row_count: number }[] = []
    let fileType = 'excel'; // default
    
    if (fileExtension === 'csv') {
        fileType = 'csv';
    } else if (fileExtension === 'json') {
        fileType = 'json';
    }

    if (fileType === 'json') {
        // Handle JSON files
        const text = new TextDecoder().decode(buffer);
        try {
            const jsonData = JSON.parse(text);
            const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
            sheets = [{ name: 'data', row_count: dataArray.length }];
        } catch (jsonError) {
            return NextResponse.json(
                { success: false, error: 'Invalid JSON format in uploaded file.' },
                { status: 400 }
            )
        }
    } else if (fileType === 'csv') {
        const text = new TextDecoder().decode(buffer);
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        sheets = [{ name: sheetName, row_count: data.length }];
    } else { // excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        sheets = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            const data = XLSX.utils.sheet_to_json(worksheet);
            return { name, row_count: data.length };
        });
    }

    // Create a DataSource record
    const dataSource = await db.dataSource.create({
      data: {
        name: file.name,
        type: fileType,
        status: 'uploaded',
        config: {
          filePath,
          fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      },
    });

    // Auto-process the first sheet
    const firstSheet = sheets[0];
    if (firstSheet) {
      try {
        // Small delay to ensure file is fully written on Windows
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Process columns and create dynamic table
        let data: any[] = [];
        
        if (fileType === 'json') {
            // Handle JSON data
            const text = new TextDecoder().decode(buffer);
            const jsonData = JSON.parse(text);
            data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } else {
            // Re-use the existing workbook from earlier parsing for Excel/CSV
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const worksheet = workbook.Sheets[firstSheet.name];
            data = XLSX.utils.sheet_to_json(worksheet);
        }

        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          const createdColumns = [];
          const sample = data.slice(0, 100);

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
              data_source_id: dataSource.id,
              column_name: header,
              normalized_name: normalized_name,
              data_type: dataType,
              expose_as_filter: false,
              label: header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            };

            const createdColumn = await db.dataSourceColumn.create({
              data: columnData,
            });
            createdColumns.push(createdColumn);
          }

          const tableName = `ds_${dataSource.id.replace(/-/g, '_')}`;
          
          // Validate table name to prevent SQL injection
          if (!/^ds_[a-zA-Z0-9_]+$/.test(tableName)) {
            throw new Error('Invalid table name generated');
          }

          // Create a new table for the data source
          const createTableQuery = `
            CREATE TABLE IF NOT EXISTS "${tableName}" (
              "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
              ${createdColumns.map(c => `"${c.normalized_name}" TEXT`).join(',\n              ')}
            );
          `;
          await db.$executeRawUnsafe(createTableQuery);

          // Insert data in chunks
          const dataToInsert = data.map(row => {
            const newRow: Record<string, any> = {};
            for (const col of createdColumns) {
              newRow[col.normalized_name] = row[col.column_name]?.toString() || null;
            }
            return newRow;
          });

          // SQLite has a default limit of 999 bind variables
          // Calculate safe chunk size: floor(999 / number of columns)
          const SQLITE_MAX_VARIABLES = 999;
          const columnsCount = createdColumns.length;
          const maxRowsPerChunk = Math.floor(SQLITE_MAX_VARIABLES / columnsCount);
          const chunkSize = Math.max(1, maxRowsPerChunk); // At least 1 row per chunk
          
          console.log(`📊 Inserting ${dataToInsert.length} rows in chunks of ${chunkSize} (${columnsCount} columns per row)`);
          
          let insertedCount = 0;
          for (let i = 0; i < dataToInsert.length; i += chunkSize) {
            const chunk = dataToInsert.slice(i, i + chunkSize);
            const columns = createdColumns.map(c => `"${c.normalized_name}"`).join(', ');
            const placeholders = chunk.map(() => `(${createdColumns.map(() => '?').join(', ')})`).join(', ');
            const values = chunk.flatMap(row => createdColumns.map(c => row[c.normalized_name]));

            try {
              const insertQuery = `INSERT INTO "${tableName}" (${columns}) VALUES ${placeholders};`;
              await db.$executeRawUnsafe(insertQuery, ...values);
              insertedCount += chunk.length;
              console.log(`  ✓ Inserted ${insertedCount}/${dataToInsert.length} rows`);
            } catch (insertError) {
              console.error(`❌ Error inserting chunk at offset ${i}:`, insertError);
              throw insertError; // Re-throw to trigger outer catch
            }
          }

          // Update data source status
          await db.dataSource.update({
            where: { id: dataSource.id },
            data: {
              status: 'active',
              record_count: data.length,
              config: {
                filePath,
                fileName,
                originalName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                tableName: tableName,
                processedSheet: firstSheet.name,
              },
            },
          });

          console.log(`✅ Auto-processed sheet "${firstSheet.name}" with ${data.length} rows and ${createdColumns.length} columns`);
        }
      } catch (processError) {
        console.error('❌ Error auto-processing sheet:', processError);
        // Don't fail the upload, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: dataSource.id,
        sheets,
        message: 'File uploaded and processed successfully!',
      },
    });

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
  }) // Close withRateLimit
}

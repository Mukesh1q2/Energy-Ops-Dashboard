import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  extractColumnMetadata, 
  createOrUpdateDataSource,
  type DataSourceConfig 
} from '@/lib/data-source-manager';
import { getIo } from '@/lib/socket';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'dmo-generator');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * POST /api/dmo/generator-scheduling/upload
 * Upload and parse Excel/CSV file with generator scheduling data
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only Excel and CSV files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Save file temporarily
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBuffer));

    // Parse the file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      await fs.unlink(filePath);
      return NextResponse.json(
        { success: false, error: 'No data found in the file' },
        { status: 400 }
      );
    }

    // Transform and validate data
    const transformedData: any[] = [];
    const errors: string[] = [];

    rawData.forEach((row: any, index: number) => {
      try {
        const timePeriod = row.TimePeriod || row.time_period || row.Time_Period || row['Time Period'];
        const region = row.Region || row.region;
        const state = row.State || row.state;
        const plantId = row.PlantID || row.plant_id || row.Plant_ID || row['Plant ID'];
        const plantName = row.PlantName || row.plant_name || row.Plant_Name || row['Plant Name'];
        const techType = row.TechnologyType || row.technology_type || row.Technology_Type || row['Technology Type'];
        
        if (!timePeriod || !region || !state || !plantId || !plantName || !techType) {
          errors.push(`Row ${index + 2}: Missing required fields`);
          return;
        }

        transformedData.push({
          time_period: new Date(timePeriod),
          region: region.toString(),
          state: state.toString(),
          plant_id: plantId.toString(),
          plant_name: plantName.toString(),
          technology_type: techType.toString(),
          contract_name: (row.ContractName || row.contract_name || null)?.toString() || null,
          scheduled_mw: parseFloat(row.ScheduledMW || row.scheduled_mw || row.Scheduled_MW || 0),
          actual_mw: parseFloat(row.ActualMW || row.actual_mw || row.Actual_MW || 0) || null
        });
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parsing error'}`);
      }
    });

    if (transformedData.length === 0) {
      await fs.unlink(filePath);
      return NextResponse.json(
        { 
          success: false, 
          error: 'No valid data could be extracted', 
          details: errors 
        },
        { status: 400 }
      );
    }

    // Insert data into database
    const result = await prisma.dMOGeneratorScheduling.createMany({
      data: transformedData,
      skipDuplicates: true
    });

    // Extract column metadata and create/update DataSource
    try {
      const columnMetadata = await extractColumnMetadata(filePath);
      
      const dataSourceConfig: DataSourceConfig = {
        moduleName: 'dmo-generator-scheduling',
        displayName: 'DMO Generator Scheduling',
        tableName: 'DMOGeneratorScheduling',
        fileName: file.name,
        fileSize: file.size,
        recordCount: result.count,
      };

      const dataSource = await createOrUpdateDataSource(dataSourceConfig, columnMetadata);
      
      console.log('DataSource created/updated:', dataSource.id, 'with', columnMetadata.length, 'columns');
    } catch (dsError) {
      console.error('Failed to create/update DataSource:', dsError);
      // Continue even if DataSource creation fails
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'data_upload',
        action: 'created',
        title: 'DMO Generator Scheduling Data Uploaded',
        description: `Excel file "${file.name}" uploaded with ${result.count} records`,
        entity_type: 'DMOGeneratorScheduling',
        status: 'success',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          recordsInserted: result.count,
          totalRows: rawData.length,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });

    // Emit Socket.IO event for cross-tab refresh
    const io = getIo();
    if (io) {
      io.to('dashboard').emit('dmo:data-uploaded', {
        module: 'generator-scheduling',
        recordCount: result.count,
        timestamp: new Date().toISOString(),
      });
    }

    // Clean up temp file
    try {
      await fs.unlink(filePath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temp file:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      message: 'Generator scheduling data uploaded successfully',
      data: {
        fileName: file.name,
        recordsInserted: result.count,
        totalRows: rawData.length,
        skipped: rawData.length - transformedData.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : []
      }
    });

  } catch (error) {
    console.error('Error uploading generator scheduling data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload generator scheduling data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

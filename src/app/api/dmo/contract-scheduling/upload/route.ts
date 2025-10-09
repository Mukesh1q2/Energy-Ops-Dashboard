import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { emitToRoom, getIo } from '@/lib/socket';
import { 
  extractColumnMetadata, 
  createOrUpdateDataSource,
  type DataSourceConfig 
} from '@/lib/data-source-manager';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'dmo-contract');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * POST /api/dmo/contract-scheduling/upload
 * Upload and parse Excel/CSV file with DMO contract scheduling data
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
      await fs.unlink(filePath); // Clean up
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
        // Map column names (case-insensitive, flexible naming)
        const timePeriod = row.TimePeriod || row.time_period || row.Time_Period || row['Time Period'] || row.Date || row.date;
        const contractName = row.ContractName || row.contract_name || row.Contract_Name || row['Contract Name'];
        const contractType = row.ContractType || row.contract_type || row.Contract_Type || row['Contract Type'];
        
        if (!timePeriod || !contractName || !contractType) {
          errors.push(`Row ${index + 2}: Missing required fields (TimePeriod, ContractName, or ContractType)`);
          return;
        }

        transformedData.push({
          time_period: new Date(timePeriod),
          region: row.Region || row.region || 'Unknown',
          state: row.State || row.state || 'Unknown',
          contract_name: contractName,
          contract_type: contractType,
          scheduled_mw: parseFloat(row.ScheduledMW || row.scheduled_mw || row.Scheduled_MW || row['Scheduled MW'] || 0),
          actual_mw: parseFloat(row.ActualMW || row.actual_mw || row.Actual_MW || row['Actual MW'] || 0) || null,
          cumulative_mw: parseFloat(row.CumulativeMW || row.cumulative_mw || row.Cumulative_MW || row['Cumulative MW'] || 0) || null
        });
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parsing error'}`);
      }
    });

    if (transformedData.length === 0) {
      await fs.unlink(filePath); // Clean up
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
    const result = await prisma.dMOContractScheduling.createMany({
      data: transformedData,
      skipDuplicates: true
    });

    // Extract column metadata and create/update DataSource
    try {
      const columnMetadata = await extractColumnMetadata(filePath);
      
      const dataSourceConfig: DataSourceConfig = {
        moduleName: 'dmo-contract-scheduling',
        displayName: 'DMO Contract Scheduling',
        tableName: 'DMOContractScheduling',
        fileName: file.name,
        fileSize: file.size,
        recordCount: result.count,
      };

      await createOrUpdateDataSource(dataSourceConfig, columnMetadata);
      console.log('DataSource created/updated for contract scheduling');
    } catch (dsError) {
      console.error('Failed to create/update DataSource:', dsError);
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'data_upload',
        action: 'created',
        title: 'DMO Contract Scheduling Data Uploaded',
        description: `Excel file "${file.name}" uploaded with ${result.count} records`,
        entity_type: 'DMOContractScheduling',
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

    // Emit Socket.IO events for real-time updates
    emitToRoom('dashboard', 'data:uploaded', {
      type: 'dmo-contract-scheduling',
      fileName: file.name,
      recordsInserted: result.count,
      timestamp: new Date().toISOString()
    });

    // Emit DMO-specific event for cross-tab refresh
    const io = getIo();
    if (io) {
      io.to('dashboard').emit('dmo:data-uploaded', {
        module: 'contract-scheduling',
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
      message: 'DMO contract scheduling data uploaded successfully',
      data: {
        fileName: file.name,
        recordsInserted: result.count,
        totalRows: rawData.length,
        skipped: rawData.length - transformedData.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : [] // Show first 10 errors
      }
    });

  } catch (error) {
    console.error('Error uploading DMO contract scheduling data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload DMO contract scheduling data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

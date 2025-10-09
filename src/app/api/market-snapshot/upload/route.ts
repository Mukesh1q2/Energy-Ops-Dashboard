import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import { emitToRoom } from '@/lib/socket';
import { saveUploadedFile, cleanupTempFile } from '@/lib/storage';

/**
 * POST /api/market-snapshot/upload
 * Upload and parse Excel/CSV file with market snapshot data
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

    // Save file using storage abstraction
    let storageFile;
    try {
      storageFile = await saveUploadedFile(file, 'market-snapshot');
    } catch (storageError: any) {
      return NextResponse.json(
        { success: false, error: storageError.message },
        { status: 400 }
      );
    }

    // Parse the file
    const workbook = XLSX.readFile(storageFile.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (rawData.length === 0) {
      await cleanupTempFile(storageFile.path); // Clean up
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
        const timePeriod = row.TimePeriod || row.time_period || row.Time_Period || row['Time Period'];
        const timeblock = row.Timeblock || row.timeblock || row.Time_Block || row['Time Block'];
        
        if (!timePeriod || !timeblock) {
          errors.push(`Row ${index + 2}: Missing TimePeriod or Timeblock`);
          return;
        }

        transformedData.push({
          time_period: new Date(timePeriod),
          timeblock: parseInt(timeblock.toString()),
          dam_price: parseFloat(row.DAMprice || row.dam_price || row.DAM_Price || row['DAM Price'] || 0) || null,
          gdam_price: parseFloat(row.GDAMprice || row.gdam_price || row.GDAM_Price || row['GDAM Price'] || 0) || null,
          rtm_price: parseFloat(row.RTMprice || row.rtm_price || row.RTM_Price || row['RTM Price'] || 0) || null,
          scheduled_mw: parseFloat(row.ScheduleMW || row.scheduled_mw || row.Scheduled_MW || row['Scheduled MW'] || 0) || null,
          modelresult_mw: parseFloat(row.ModelresultMW || row.modelresult_mw || row.ModelResult_MW || row['Model Result MW'] || 0) || null,
          purchase_bid_mw: parseFloat(row.PurchaseBidMW || row.purchase_bid_mw || row.Purchase_Bid_MW || 0) || null,
          sell_bid_mw: parseFloat(row.SellBidMW || row.sell_bid_mw || row.Sell_Bid_MW || 0) || null,
          state: row.State || row.state || null,
          plant_name: row.PlantName || row.plant_name || row.Plant_Name || null,
          region: row.Region || row.region || null,
          contract_name: row.ContractName || row.contract_name || row.Contract_Name || null,
          metadata: {
            source: 'excel_upload',
            filename: file.name,
            storageFileId: storageFile.id,
            uploadedAt: new Date().toISOString()
          }
        });
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parsing error'}`);
      }
    });

    if (transformedData.length === 0) {
      await cleanupTempFile(storageFile.path); // Clean up
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
    const result = await prisma.marketSnapshotData.createMany({
      data: transformedData,
      skipDuplicates: true
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'data_upload',
        action: 'created',
        title: 'Market Snapshot Data Uploaded',
        description: `Excel file "${file.name}" uploaded with ${result.count} records`,
        entity_type: 'MarketSnapshotData',
        status: 'success',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          storageFileId: storageFile.id,
          recordsInserted: result.count,
          totalRows: rawData.length,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    });

    // Emit Socket.IO events for real-time updates
    emitToRoom('dashboard', 'data:uploaded', {
      type: 'market-snapshot',
      fileName: file.name,
      recordsInserted: result.count,
      timestamp: new Date().toISOString()
    });

    emitToRoom('dashboard', 'market-snapshot:updated', {
      recordsInserted: result.count,
      timestamp: new Date().toISOString()
    });

    // Clean up temp file (keep file for now, add cleanup job later)
    // Note: File is kept in storage for audit purposes
    // Future: Add scheduled cleanup job for old files

    return NextResponse.json({
      success: true,
      message: 'Market snapshot data uploaded successfully',
      data: {
        fileName: file.name,
        recordsInserted: result.count,
        totalRows: rawData.length,
        skipped: rawData.length - transformedData.length,
        errors: errors.length > 0 ? errors.slice(0, 10) : [] // Show first 10 errors
      }
    });

  } catch (error) {
    console.error('Error uploading market snapshot data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload market snapshot data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

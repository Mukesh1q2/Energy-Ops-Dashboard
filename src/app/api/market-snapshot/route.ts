import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/market-snapshot
 * Fetch aggregated market snapshot data for charts
 * 
 * Query Parameters:
 * - source: table name or data source ID
 * - date: YYYY-MM-DD format
 * - interval: 15 | 30 | 60 (minutes)
 * - state: filter by state (optional)
 * - plant_name: filter by plant (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const source = searchParams.get('source') || 'latest';
    const dateParam = searchParams.get('date');
    const intervalParam = searchParams.get('interval') || '15';
    const stateFilter = searchParams.get('state');
    const plantFilter = searchParams.get('plant_name');

    // Parse interval (15, 30, or 60 minutes)
    const interval = parseInt(intervalParam);
    if (![15, 30, 60].includes(interval)) {
      return NextResponse.json(
        { success: false, error: 'Invalid interval. Must be 15, 30, or 60' },
        { status: 400 }
      );
    }

    // Parse date or use today
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause
    const whereClause: any = {
      time_period: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    if (stateFilter) {
      whereClause.state = stateFilter;
    }

    if (plantFilter) {
      whereClause.plant_name = plantFilter;
    }

    // Fetch raw data
    const rawData = await prisma.marketSnapshotData.findMany({
      where: whereClause,
      orderBy: {
        timeblock: 'asc'
      }
    });

    if (rawData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          timeblocks: [],
          dam_price: [],
          rtm_price: [],
          gdam_price: [],
          scheduled_mw: [],
          modelresult_mw: [],
          purchase_bid_mw: [],
          sell_bid_mw: []
        },
        metadata: {
          date: targetDate.toISOString().split('T')[0],
          interval,
          recordCount: 0
        }
      });
    }

    // Aggregate data based on interval
    const aggregatedData = aggregateByInterval(rawData, interval);

    return NextResponse.json({
      success: true,
      data: aggregatedData,
      metadata: {
        date: targetDate.toISOString().split('T')[0],
        interval,
        recordCount: rawData.length,
        aggregatedBlocks: aggregatedData.timeblocks.length
      }
    });

  } catch (error) {
    console.error('Error fetching market snapshot data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market snapshot data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Aggregate data by interval (15, 30, or 60 minutes)
 */
function aggregateByInterval(rawData: any[], interval: number) {
  // Calculate blocks per interval
  // 15 min = 1 block, 30 min = 2 blocks, 60 min = 4 blocks
  const blocksPerInterval = interval / 15;
  
  // Group data by interval
  const groupedData = new Map<number, any[]>();
  
  rawData.forEach(record => {
    const intervalBlock = Math.floor((record.timeblock - 1) / blocksPerInterval);
    if (!groupedData.has(intervalBlock)) {
      groupedData.set(intervalBlock, []);
    }
    groupedData.get(intervalBlock)!.push(record);
  });

  // Aggregate each group
  const timeblocks: number[] = [];
  const dam_price: number[] = [];
  const rtm_price: number[] = [];
  const gdam_price: number[] = [];
  const scheduled_mw: number[] = [];
  const modelresult_mw: number[] = [];
  const purchase_bid_mw: number[] = [];
  const sell_bid_mw: number[] = [];

  // Sort by interval block
  const sortedBlocks = Array.from(groupedData.keys()).sort((a, b) => a - b);

  sortedBlocks.forEach(intervalBlock => {
    const records = groupedData.get(intervalBlock)!;
    
    // Calculate timeblock (starting block of interval)
    const startBlock = intervalBlock * blocksPerInterval + 1;
    timeblocks.push(startBlock);

    // Average prices
    dam_price.push(calculateAverage(records, 'dam_price'));
    rtm_price.push(calculateAverage(records, 'rtm_price'));
    gdam_price.push(calculateAverage(records, 'gdam_price'));

    // Sum volumes
    scheduled_mw.push(calculateSum(records, 'scheduled_mw'));
    modelresult_mw.push(calculateSum(records, 'modelresult_mw'));
    purchase_bid_mw.push(calculateSum(records, 'purchase_bid_mw'));
    sell_bid_mw.push(calculateSum(records, 'sell_bid_mw'));
  });

  return {
    timeblocks,
    dam_price,
    rtm_price,
    gdam_price,
    scheduled_mw,
    modelresult_mw,
    purchase_bid_mw,
    sell_bid_mw
  };
}

/**
 * Calculate average of a field, ignoring null/undefined values
 */
function calculateAverage(records: any[], field: string): number {
  const values = records
    .map(r => r[field])
    .filter(v => v !== null && v !== undefined && !isNaN(v));
  
  if (values.length === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate sum of a field, ignoring null/undefined values
 */
function calculateSum(records: any[], field: string): number {
  return records
    .map(r => r[field])
    .filter(v => v !== null && v !== undefined && !isNaN(v))
    .reduce((acc, val) => acc + val, 0);
}

/**
 * POST /api/market-snapshot
 * Bulk insert market snapshot data (for Excel uploads)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, data_source_id } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Data must be an array' },
        { status: 400 }
      );
    }

    // Transform and insert data
    const insertData = data.map((record: any) => ({
      data_source_id: data_source_id || null,
      time_period: new Date(record.TimePeriod || record.time_period),
      timeblock: parseInt(record.Timeblock || record.timeblock),
      dam_price: parseFloat(record.DAMprice || record.dam_price) || null,
      gdam_price: parseFloat(record.GDAMprice || record.gdam_price) || null,
      rtm_price: parseFloat(record.RTMprice || record.rtm_price) || null,
      scheduled_mw: parseFloat(record.ScheduleMW || record.scheduled_mw) || null,
      modelresult_mw: parseFloat(record.ModelresultMW || record.modelresult_mw) || null,
      purchase_bid_mw: parseFloat(record.PurchaseBidMW || record.purchase_bid_mw) || null,
      sell_bid_mw: parseFloat(record.SellBidMW || record.sell_bid_mw) || null,
      state: record.State || record.state || null,
      plant_name: record.PlantName || record.plant_name || null,
      region: record.Region || record.region || null,
      contract_name: record.ContractName || record.contract_name || null,
      metadata: record.metadata || {}
    }));

    // Bulk insert
    const result = await prisma.marketSnapshotData.createMany({
      data: insertData,
      skipDuplicates: true
    });

    return NextResponse.json({
      success: true,
      message: 'Market snapshot data inserted successfully',
      recordsInserted: result.count
    });

  } catch (error) {
    console.error('Error inserting market snapshot data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to insert market snapshot data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/market-snapshot
 * Delete market snapshot data by date or all
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    let whereClause: any = {};

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause = {
        time_period: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    }

    const result = await prisma.marketSnapshotData.deleteMany({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      message: dateParam 
        ? `Deleted data for ${dateParam}` 
        : 'Deleted all market snapshot data',
      recordsDeleted: result.count
    });

  } catch (error) {
    console.error('Error deleting market snapshot data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete market snapshot data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

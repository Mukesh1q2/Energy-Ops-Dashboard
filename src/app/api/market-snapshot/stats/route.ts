import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/market-snapshot/stats
 * Get aggregated statistics for market snapshot data for a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateParam);
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    // Fetch all records for the given date
    const records = await prisma.marketSnapshotData.findMany({
      where: {
        time_period: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        dam_price: true,
        rtm_price: true,
        gdam_price: true,
        scheduled_mw: true,
        modelresult_mw: true,
        purchase_bid_mw: true,
        sell_bid_mw: true,
        created_at: true
      }
    });

    const totalRecords = records.length;

    if (totalRecords === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalRecords: 0,
          avgDamPrice: 0,
          avgRtmPrice: 0,
          avgGdamPrice: 0,
          totalScheduledVolume: 0,
          totalModelResultVolume: 0,
          totalPurchaseBidVolume: 0,
          totalSellBidVolume: 0,
          lastUpdated: null
        }
      });
    }

    // Calculate statistics
    const damPrices = records.map(r => r.dam_price).filter((p): p is number => p !== null);
    const rtmPrices = records.map(r => r.rtm_price).filter((p): p is number => p !== null);
    const gdamPrices = records.map(r => r.gdam_price).filter((p): p is number => p !== null);
    
    const avgDamPrice = damPrices.length > 0
      ? damPrices.reduce((sum, p) => sum + p, 0) / damPrices.length
      : 0;

    const avgRtmPrice = rtmPrices.length > 0
      ? rtmPrices.reduce((sum, p) => sum + p, 0) / rtmPrices.length
      : 0;

    const avgGdamPrice = gdamPrices.length > 0
      ? gdamPrices.reduce((sum, p) => sum + p, 0) / gdamPrices.length
      : 0;

    const totalScheduledVolume = records
      .map(r => r.scheduled_mw)
      .filter((v): v is number => v !== null)
      .reduce((sum, v) => sum + v, 0);

    const totalModelResultVolume = records
      .map(r => r.modelresult_mw)
      .filter((v): v is number => v !== null)
      .reduce((sum, v) => sum + v, 0);

    const totalPurchaseBidVolume = records
      .map(r => r.purchase_bid_mw)
      .filter((v): v is number => v !== null)
      .reduce((sum, v) => sum + v, 0);

    const totalSellBidVolume = records
      .map(r => r.sell_bid_mw)
      .filter((v): v is number => v !== null)
      .reduce((sum, v) => sum + v, 0);

    // Find the most recent record
    const lastUpdated = records.reduce((latest, record) => {
      return !latest || record.created_at > latest 
        ? record.created_at 
        : latest;
    }, null as Date | null);

    return NextResponse.json({
      success: true,
      data: {
        totalRecords,
        avgDamPrice: Math.round(avgDamPrice * 100) / 100,
        avgRtmPrice: Math.round(avgRtmPrice * 100) / 100,
        avgGdamPrice: Math.round(avgGdamPrice * 100) / 100,
        totalScheduledVolume: Math.round(totalScheduledVolume * 100) / 100,
        totalModelResultVolume: Math.round(totalModelResultVolume * 100) / 100,
        totalPurchaseBidVolume: Math.round(totalPurchaseBidVolume * 100) / 100,
        totalSellBidVolume: Math.round(totalSellBidVolume * 100) / 100,
        lastUpdated: lastUpdated?.toISOString() || null
      }
    });

  } catch (error) {
    console.error('Error fetching market snapshot stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market snapshot statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

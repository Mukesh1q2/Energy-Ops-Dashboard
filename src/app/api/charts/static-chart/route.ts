import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technology = searchParams.get('technology') || 'Thermal';

    // Read the static JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'thermal_chart_data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'Chart data file not found' },
        { status: 404 }
      );
    }

    const chartData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    return NextResponse.json(chartData);

  } catch (error) {
    console.error('Error reading chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

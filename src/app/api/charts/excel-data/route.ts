import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technology = searchParams.get('technology');
    const plant = searchParams.get('plant');

    // Read the generated chart data JSON file
    const jsonPath = path.join(process.cwd(), 'public', 'chart_data.json');
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'Chart data not found. Run the model to generate results.' },
        { status: 404 }
      );
    }

    const allChartData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // If no technology specified, return available technologies
    if (!technology) {
      return NextResponse.json({
        availableTechnologies: allChartData.metadata.availableTechnologies,
        metadata: allChartData.metadata
      });
    }

    // Get technology data
    if (!allChartData.chartData[technology]) {
      return NextResponse.json(
        { 
          error: 'Technology not found', 
          availableTechnologies: allChartData.metadata.availableTechnologies,
          requested: technology 
        },
        { status: 404 }
      );
    }

    const techData = allChartData.chartData[technology];

    let chartData;
    let metadata;

    if (plant && plant !== '' && plant !== 'total') {
      // Plant-specific chart
      if (!techData.plants[plant]) {
        return NextResponse.json(
          { 
            error: 'Plant not found', 
            availablePlants: techData.metadata.availablePlants,
            requested: plant 
          },
          { status: 404 }
        );
      }

      chartData = {
        timeBlocks: techData.timeBlocks,
        series: [techData.plants[plant]]
      };

      metadata = {
        type: 'plant',
        technology,
        plant,
        totalMW: Math.max(...techData.plants[plant].data),
        recordCount: techData.plants[plant].data.length,
        availablePlants: techData.metadata.availablePlants,
        availableTechnologies: allChartData.metadata.availableTechnologies
      };

    } else {
      // Technology-wise chart
      chartData = {
        timeBlocks: techData.timeBlocks,
        series: [techData.technologyTotal]
      };

      metadata = {
        type: 'technology',
        technology,
        totalMW: techData.metadata.totalMW,
        recordCount: techData.metadata.recordCount,
        availablePlants: techData.metadata.availablePlants,
        availableTechnologies: allChartData.metadata.availableTechnologies
      };
    }

    return NextResponse.json({
      chartData,
      metadata
    });

  } catch (error) {
    console.error('Error reading chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

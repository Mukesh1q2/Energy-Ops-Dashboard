import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technology = searchParams.get('technology');
    const plant = searchParams.get('plant');
    const outputDir = searchParams.get('outputDir') || '202504031402';

    if (!technology) {
      return NextResponse.json(
        { error: 'Technology parameter is required' },
        { status: 400 }
      );
    }

    // Construct Excel file path - using the actual output directory
    const excelPath = path.join(
      process.cwd(),
      outputDir,
      'DDART_output',
      'results_long_df.xlsx'
    );

    console.log('Looking for Excel file at:', excelPath);

    // Check if Excel file exists
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json(
        { 
          error: 'Excel output file not found', 
          path: excelPath,
          message: 'Run model_PP (1).py to generate results_long_df.xlsx'
        },
        { status: 404 }
      );
    }

    console.log('Excel file found, reading all_generator_all_demand sheet...');

    // Read Excel file and specifically the all_generator_all_demand sheet
    const workbook = XLSX.readFile(excelPath);
    const sheetName = 'all_generator_all_demand';
    
    if (!workbook.Sheets[sheetName]) {
      return NextResponse.json(
        { error: `Sheet '${sheetName}' not found in Excel file` },
        { status: 404 }
      );
    }

    // Convert sheet to JSON
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Loaded ${jsonData.length} records from all_generator_all_demand sheet`);

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in all_generator_all_demand sheet' },
        { status: 404 }
      );
    }

    // STEP 1: Filter data for TOTAL GENERATION/STORAGE only
    const filteredData = jsonData.filter((row: any) => 
      row.ContractType === 'TOTAL GENERATION/STORAGE'
    );

    console.log(`Filtered to ${filteredData.length} records with ContractType = 'TOTAL GENERATION/STORAGE'`);

    if (filteredData.length === 0) {
      return NextResponse.json(
        { error: 'No data found with ContractType = TOTAL GENERATION/STORAGE' },
        { status: 404 }
      );
    }

    // Get available technologies
    const availableTechnologies = [...new Set(
      filteredData.map((row: any) => row.TechnologyType)
    )].filter(Boolean);

    console.log('Available technologies:', availableTechnologies);

    if (!availableTechnologies.includes(technology)) {
      return NextResponse.json(
        { 
          error: 'Technology not found', 
          availableTechnologies,
          requested: technology 
        },
        { status: 404 }
      );
    }

    // Filter by technology
    let techData = filteredData.filter((row: any) => 
      row.TechnologyType === technology
    );

    console.log(`Found ${techData.length} records for technology: ${technology}`);

    // Get available plants for this technology
    const availablePlants = [...new Set(
      techData.map((row: any) => row.PlantName)
    )].filter(Boolean);

    console.log(`Available plants for ${technology}:`, availablePlants);

    let chartData;
    let metadata;

    if (plant && plant !== '') {
      // STEP 3: Plant-wise chart - show only specific plant
      if (!availablePlants.includes(plant)) {
        return NextResponse.json(
          { 
            error: 'Plant not found', 
            availablePlants,
            requested: plant 
          },
          { status: 404 }
        );
      }

      // Filter by specific plant
      const plantData = techData.filter((row: any) => row.PlantName === plant);
      
      console.log(`Found ${plantData.length} records for plant: ${plant}`);

      // Process data for chart - 96 time blocks
      const timeLabels = [];
      const generationData = [];
      
      for (let i = 1; i <= 96; i++) {
        // Convert time block to HH:MM format (15-minute intervals)
        const hour = Math.floor((i - 1) / 4);
        const minute = ((i - 1) % 4) * 15;
        timeLabels.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        
        // Get ModelResultsMW for this time block and plant
        const timeBlockData = plantData.filter((row: any) => row.TimeBlock === i);
        const totalMW = timeBlockData.reduce((sum: number, row: any) => 
          sum + (parseFloat(row.ModelResultsMW) || 0), 0
        );
        generationData.push(totalMW);
      }

      chartData = {
        timeBlocks: timeLabels,
        series: [{
          name: plant,
          data: generationData,
          color: '#ff7f0e'
        }]
      };

      metadata = {
        type: 'plant',
        technology,
        plant,
        totalMW: Math.max(...generationData),
        recordCount: generationData.length,
        availablePlants,
        availableTechnologies
      };

      console.log(`Generated plant chart data for ${plant}, max MW: ${metadata.totalMW}`);

    } else {
      // STEP 2: Technology-wise chart - sum all plants of this technology
      
      // Group by TimeBlock and sum ModelResultsMW for all plants of this technology
      const timeBlockTotals: { [key: number]: number } = {};
      
      techData.forEach((row: any) => {
        const timeBlock = row.TimeBlock;
        const mw = parseFloat(row.ModelResultsMW) || 0;
        timeBlockTotals[timeBlock] = (timeBlockTotals[timeBlock] || 0) + mw;
      });

      const timeLabels = [];
      const generationData = [];
      
      for (let i = 1; i <= 96; i++) {
        // Convert time block to HH:MM format (15-minute intervals)
        const hour = Math.floor((i - 1) / 4);
        const minute = ((i - 1) % 4) * 15;
        timeLabels.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        generationData.push(timeBlockTotals[i] || 0);
      }

      chartData = {
        timeBlocks: timeLabels,
        series: [{
          name: `${technology} Total`,
          data: generationData,
          color: '#1f77b4'
        }]
      };

      metadata = {
        type: 'technology',
        technology,
        totalMW: Math.max(...generationData),
        recordCount: generationData.length,
        availablePlants,
        availableTechnologies
      };

      console.log(`Generated technology chart data for ${technology}, max MW: ${metadata.totalMW}`);
    }

    return NextResponse.json({
      chartData,
      metadata,
      debug: {
        excelPath,
        totalRecords: jsonData.length,
        filteredRecords: filteredData.length,
        techRecords: techData.length,
        sheetName: 'all_generator_all_demand'
      }
    });

  } catch (error) {
    console.error('Error generating chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

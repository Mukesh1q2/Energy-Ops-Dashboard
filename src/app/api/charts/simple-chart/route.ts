import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const technology = searchParams.get('technology') || 'Thermal';

    // Use the file from public directory
    const excelPath = path.join(process.cwd(), 'public', 'test_results.xlsx');

    // Check if Excel file exists
    if (!fs.existsSync(excelPath)) {
      return NextResponse.json(
        { error: 'Excel output file not found', path: excelPath },
        { status: 404 }
      );
    }

    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = 'all_generator_all_demand';
    
    if (!workbook.Sheets[sheetName]) {
      return NextResponse.json(
        { error: 'Sheet all_generator_all_demand not found' },
        { status: 404 }
      );
    }

    // Convert sheet to JSON
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      return NextResponse.json(
        { error: 'No data found in Excel sheet' },
        { status: 404 }
      );
    }

    // Filter data for TOTAL GENERATION/STORAGE
    const filteredData = jsonData.filter((row: any) => 
      row.ContractType === 'TOTAL GENERATION/STORAGE'
    );

    if (filteredData.length === 0) {
      return NextResponse.json(
        { error: 'No data found with ContractType TOTAL GENERATION/STORAGE' },
        { status: 404 }
      );
    }

    // Get available technologies
    const availableTechnologies = [...new Set(
      filteredData.map((row: any) => row.TechnologyType)
    )].filter(Boolean);

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

    // Get available plants for this technology
    const availablePlants = [...new Set(
      techData.map((row: any) => row.PlantName)
    )].filter(Boolean);

    // Group by TimeBlock and sum ModelResultsMW
    const timeBlockTotals: { [key: number]: number } = {};
    
    techData.forEach((row: any) => {
      const timeBlock = row.TimeBlock;
      const mw = parseFloat(row.ModelResultsMW) || 0;
      timeBlockTotals[timeBlock] = (timeBlockTotals[timeBlock] || 0) + mw;
    });

    const timeLabels = [];
    const generationData = [];
    
    for (let i = 1; i <= 96; i++) {
      const hour = Math.floor((i - 1) / 4);
      const minute = ((i - 1) % 4) * 15;
      timeLabels.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      generationData.push(timeBlockTotals[i] || 0);
    }

    const chartData = {
      timeBlocks: timeLabels,
      series: [{
        name: `${technology} Total`,
        data: generationData,
        color: '#1f77b4'
      }]
    };

    const metadata = {
      type: 'technology',
      technology,
      totalMW: Math.max(...generationData),
      recordCount: generationData.length,
      availablePlants,
      availableTechnologies
    };

    return NextResponse.json({
      chartData,
      metadata
    });

  } catch (error) {
    console.error('Error generating chart data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

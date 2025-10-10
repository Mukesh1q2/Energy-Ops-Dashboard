import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const outputDir = searchParams.get('outputDir') || '202504031402';

    // Construct output directory path
    const outputPath = path.join(
      process.cwd(),
      outputDir,
      'DDART_output'
    );

    // Check if output directory exists
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json({
        files: [],
        message: 'Output directory not found',
        path: outputPath
      });
    }

    // Read directory contents
    const files = fs.readdirSync(outputPath);
    const fileDetails: any[] = [];

    files.forEach((file) => {
      const filePath = path.join(outputPath, file);
      const stats = fs.statSync(filePath);

      // Determine file type
      let fileType: 'excel' | 'other' = 'other';
      if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
        fileType = 'excel';
      }

      fileDetails.push({
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        type: fileType,
        extension: path.extname(file)
      });
    });

    // Sort by modification time (newest first)
    fileDetails.sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return NextResponse.json({
      files: fileDetails,
      outputPath,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking output files:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check output files', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

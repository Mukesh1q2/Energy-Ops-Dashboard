// src/app/api/sandbox/test-scripts/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

const SCRIPTS_DIR = path.join(process.cwd(), 'sandbox', 'uploads', 'test_scripts');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/sandbox/test-scripts/upload
 * Upload a test Python script
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file extension
    if (!file.name.endsWith('.py')) {
      return NextResponse.json(
        { success: false, error: 'Only Python (.py) files are allowed' },
        { status: 400 }
      );
    }

    // Check file name pattern - must contain test_ or experiment_ anywhere in name
    const validPattern = /(test_|experiment_).*\.py$/i;
    if (!validPattern.test(file.name)) {
      return NextResponse.json(
        { success: false, error: 'File must contain "test_" or "experiment_" in the name' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(fileBuffer).toString('utf-8');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(SCRIPTS_DIR, fileName);

    // Ensure directory exists
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });

    // Save file
    await fs.writeFile(filePath, fileContent);

    // Create database record
    const script = await db.testScript.create({
      data: {
        script_name: fileName,
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        description: description || null,
        metadata: {
          uploadedFrom: 'sandbox',
          originalName: file.name
        }
      }
    });

    // Create activity log
    await db.activity.create({
      data: {
        type: 'data_upload',
        action: 'created',
        title: 'Test Script Uploaded',
        description: `Python test script "${file.name}" uploaded to sandbox`,
        entity_type: 'TestScript',
        entity_id: script.id,
        status: 'success',
        metadata: {
          fileName: file.name,
          fileSize: file.size
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test script uploaded successfully',
      script: {
        id: script.id,
        script_name: script.script_name,
        original_filename: script.original_filename,
        file_size: script.file_size,
        uploaded_at: script.uploaded_at
      }
    });

  } catch (error) {
    console.error('Error uploading test script:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload test script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

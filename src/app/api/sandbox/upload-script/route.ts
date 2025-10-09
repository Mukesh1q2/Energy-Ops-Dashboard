import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'sandbox', 'uploads', 'test_scripts');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/sandbox/upload-script
 * Upload Python test scripts (.py files)
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

    // Validate file type
    const fileExtension = path.extname(file.name).toLowerCase();
    
    if (fileExtension !== '.py') {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only .py files are allowed' },
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

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file
    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBuffer));

    // Verify Python file content (basic check)
    const content = await fs.readFile(filePath, 'utf-8');
    if (!content.trim()) {
      await fs.unlink(filePath);
      return NextResponse.json(
        { success: false, error: 'File is empty' },
        { status: 400 }
      );
    }

    // Create database record
    const script = await db.testScript.create({
      data: {
        script_name: sanitizedFileName.replace(/\.py$/, ''),
        original_filename: file.name,
        file_path: filePath,
        file_size: file.size,
        uploaded_by: 'admin', // TODO: Replace with actual user when auth is implemented
        description: description || null,
        status: 'active'
      }
    });

    // Create activity log
    await db.activity.create({
      data: {
        type: 'sandbox',
        action: 'created',
        title: 'Python Script Uploaded',
        description: `Script "${file.name}" uploaded successfully`,
        entity_type: 'TestScript',
        entity_id: script.id,
        status: 'success',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          scriptId: script.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Script uploaded successfully',
      data: {
        id: script.id,
        scriptName: script.script_name,
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: script.uploaded_at
      }
    });

  } catch (error) {
    console.error('Error uploading script:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload script',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

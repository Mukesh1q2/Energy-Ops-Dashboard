// src/app/api/optimization/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const MODELS_DIR = path.join(process.cwd(), 'server', 'models', 'optimization');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/optimization/upload
 * Upload a Python optimization model file
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const modelType = formData.get('modelType') as string;
    const description = formData.get('description') as string | null;
    const uploadedBy = formData.get('uploadedBy') as string || 'admin';

    // Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!modelType || !['DMO', 'RMO', 'SO'].includes(modelType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model type. Must be DMO, RMO, or SO.' },
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
    const fileName = `${modelType}_${timestamp}_${sanitizedFileName}`;
    const filePath = path.join(MODELS_DIR, fileName);

    // Ensure directory exists
    await fs.mkdir(MODELS_DIR, { recursive: true });

    // Save file
    await fs.writeFile(filePath, fileContent);

    // Validate Python syntax
    const validation = await validatePythonSyntax(filePath);

    if (!validation.valid) {
      // Delete invalid file
      await fs.unlink(filePath);
      return NextResponse.json(
        {
          success: false,
          error: 'Python syntax validation failed',
          details: validation.error
        },
        { status: 400 }
      );
    }

    // Check for required function (optional but recommended)
    const hasRunFunction = fileContent.includes('def run_model') || 
                          fileContent.includes('def main') ||
                          fileContent.includes('if __name__');

    // Create database record
    const model = await prisma.optimizationModel.create({
      data: {
        model_name: fileName,
        original_filename: file.name,
        file_path: filePath,
        model_type: modelType,
        uploaded_by: uploadedBy,
        status: 'active',
        syntax_valid: true,
        validation_message: validation.message || 'Syntax validation passed',
        file_size: file.size,
        description: description || null,
        metadata: {
          hasRunFunction,
          uploadedFrom: 'sandbox',
          originalName: file.name
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'optimization',
        action: 'created',
        title: 'Optimization Model Uploaded',
        description: `${modelType} model "${file.name}" uploaded successfully`,
        entity_type: 'OptimizationModel',
        entity_id: model.id,
        user_id: uploadedBy,
        status: 'success',
        metadata: {
          modelType,
          fileName: file.name,
          fileSize: file.size
        }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        type: 'update',
        category: 'optimization',
        title: 'New Optimization Model',
        message: `${modelType} model "${file.name}" has been uploaded and is ready to use`,
        severity: 'low',
        action_url: '/sandbox',
        action_label: 'View in Sandbox',
        metadata: {
          modelId: model.id,
          modelType
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Model uploaded successfully',
      model: {
        id: model.id,
        model_name: model.model_name,
        model_type: model.model_type,
        file_size: model.file_size,
        uploaded_at: model.uploaded_at,
        status: model.status,
        hasRunFunction
      }
    });

  } catch (error) {
    console.error('Error uploading model:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload model',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Validate Python syntax using py_compile
 */
async function validatePythonSyntax(filePath: string): Promise<{
  valid: boolean;
  error?: string;
  message?: string;
}> {
  return new Promise((resolve) => {
    // Use Python's compile module to check syntax
    const pythonProcess = spawn('python', ['-m', 'py_compile', filePath]);

    let errorOutput = '';

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          valid: true,
          message: 'Python syntax validation passed'
        });
      } else {
        // Extract meaningful error from Python output
        const errorLines = errorOutput.split('\n').filter(line => 
          line.trim() && !line.includes('Traceback')
        );
        
        resolve({
          valid: false,
          error: errorLines.join(' ') || 'Syntax error detected',
          message: 'Python syntax validation failed'
        });
      }
    });

    pythonProcess.on('error', (error) => {
      resolve({
        valid: false,
        error: `Failed to run Python compiler: ${error.message}`,
        message: 'Could not validate Python syntax'
      });
    });
  });
}

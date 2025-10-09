import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { promises as fs } from 'fs'
import path from 'path'

const MODELS_DIR = path.join(process.cwd(), 'sandbox', 'uploads', 'optimization_models')

export async function GET() {
  try {
    const models = await db.optimizationModel.findMany({ orderBy: { uploaded_at: 'desc' } })
    return NextResponse.json({ success: true, data: models })
  } catch (error) {
    console.error('List models error:', error)
    return NextResponse.json({ success: false, error: 'Failed to list models' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null
    const model_type = (form.get('model_type') as string) || 'DMO'
    const description = (form.get('description') as string) || null

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required' }, { status: 400 })
    }

    if (!file.name.endsWith('.py')) {
      return NextResponse.json({ success: false, error: 'Only .py files allowed' }, { status: 400 })
    }

    await fs.mkdir(MODELS_DIR, { recursive: true })
    const ts = Date.now()
    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = path.join(MODELS_DIR, `${ts}_${sanitized}`)
    const buf = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(filePath, buf)

    const model = await db.optimizationModel.create({
      data: {
        model_name: sanitized.replace(/\.py$/, ''),
        original_filename: file.name,
        file_path: filePath,
        model_type,
        description,
        file_size: file.size,
        syntax_valid: true,
        status: 'active'
      }
    })

    return NextResponse.json({ success: true, data: model })
  } catch (error) {
    console.error('Upload model error:', error)
    return NextResponse.json({ success: false, error: 'Failed to upload model' }, { status: 500 })
  }
}

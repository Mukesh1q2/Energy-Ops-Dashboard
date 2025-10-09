import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const dataSources = await db.dataSource.findMany({
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: dataSources
    })
  } catch (error) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch data sources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, config } = body

    if (!name || !type || !config) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const dataSource = await db.dataSource.create({
      data: {
        name,
        type,
        config,
        status: 'disconnected'
      }
    })

    return NextResponse.json({
      success: true,
      data: dataSource
    })
  } catch (error) {
    console.error('Error creating data source:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create data source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const endpoints = await db.apiEndpoint.findMany({
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: endpoints
    })
  } catch (error) {
    console.error('Error fetching API endpoints:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch API endpoints',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, url, method, headers } = body

    if (!name || !url || !method) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const endpoint = await db.apiEndpoint.create({
      data: {
        name,
        url,
        method,
        headers: headers || {},
        status: 'inactive'
      }
    })

    return NextResponse.json({
      success: true,
      data: endpoint
    })
  } catch (error) {
    console.error('Error creating API endpoint:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create API endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
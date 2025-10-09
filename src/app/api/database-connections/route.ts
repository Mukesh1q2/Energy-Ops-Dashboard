import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const connections = await db.databaseConnection.findMany({
      orderBy: { created_at: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: connections
    })
  } catch (error) {
    console.error('Error fetching database connections:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch database connections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, host, port, database, username, password } = body

    if (!name || !type || !host || !port || !database) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const connection = await db.databaseConnection.create({
      data: {
        name,
        type,
        host,
        port,
        database,
        username,
        password,
        status: 'disconnected'
      }
    })

    return NextResponse.json({
      success: true,
      data: connection
    })
  } catch (error) {
    console.error('Error creating database connection:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create database connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
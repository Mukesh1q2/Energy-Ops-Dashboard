import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const connection = await db.databaseConnection.findUnique({
      where: { id }
    });

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error fetching database connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch database connection' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const connection = await db.databaseConnection.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        host: body.host,
        port: body.port,
        database: body.database,
        username: body.username,
        password: body.password,
        status: body.status || 'disconnected'
      }
    });

    return NextResponse.json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error('Error updating database connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update database connection' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    await db.databaseConnection.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting database connection:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete database connection' },
      { status: 500 }
    );
  }
}

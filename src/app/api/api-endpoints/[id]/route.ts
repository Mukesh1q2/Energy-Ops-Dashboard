import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const endpoint = await db.apiEndpoint.findUnique({
      where: { id }
    });

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'API endpoint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Error fetching API endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API endpoint' },
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

    const endpoint = await db.apiEndpoint.update({
      where: { id },
      data: {
        name: body.name,
        url: body.url,
        method: body.method,
        headers: body.headers,
        status: body.status || 'inactive'
      }
    });

    return NextResponse.json({
      success: true,
      data: endpoint
    });
  } catch (error) {
    console.error('Error updating API endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update API endpoint' },
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

    await db.apiEndpoint.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'API endpoint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting API endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete API endpoint' },
      { status: 500 }
    );
  }
}

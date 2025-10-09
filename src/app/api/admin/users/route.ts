import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all users
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    
    // For now, return mock data
    // In production, fetch from database:
    // const users = await prisma.user.findMany();
    
    const mockUsers = [
      {
        id: '1',
        email: 'admin@optibid.com',
        name: 'Admin User',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      {
        id: '2',
        email: 'user@optibid.com',
        name: 'Regular User',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        email: 'viewer@optibid.com',
        name: 'Viewer User',
        role: 'VIEWER',
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return NextResponse.json({ users: mockUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, password } = body;

    // TODO: Implement user creation with proper password hashing
    // const hashedPassword = await bcrypt.hash(password, 10);
    // const newUser = await prisma.user.create({
    //   data: { email, name, role, password: hashedPassword }
    // });

    return NextResponse.json({
      message: 'User created successfully',
      user: { id: Date.now().toString(), email, name, role, status: 'ACTIVE' },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

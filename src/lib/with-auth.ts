/**
 * Authentication Middleware for API Routes
 * Provides role-based access control for sensitive endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

export interface AuthConfig {
  requireAuth?: boolean
  allowedRoles?: string[]
  requireAdmin?: boolean
}

/**
 * Higher-order function that wraps API route handlers with authentication
 */
export function withAuth(
  handler: (req: AuthenticatedRequest, res?: NextResponse) => Promise<NextResponse>,
  config: AuthConfig = { requireAuth: true }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get the session from NextAuth
      const session = await getServerSession(authOptions)

      // Check if authentication is required
      if (config.requireAuth && !session?.user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Authentication required'
          },
          { status: 401 }
        )
      }

      // Check admin role requirement
      if (config.requireAdmin && (session?.user as any)?.role !== 'admin') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Admin role required'
          },
          { status: 403 }
        )
      }

      // Check specific role requirements
      if (config.allowedRoles && config.allowedRoles.length > 0) {
        const userRole = (session?.user as any)?.role
        if (!userRole || !config.allowedRoles.includes(userRole)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Forbidden',
              message: `Role not authorized. Required: ${config.allowedRoles.join(', ')}`
            },
            { status: 403 }
          )
        }
      }

      // Add user to request object
      const authenticatedReq = req as AuthenticatedRequest
      if (session?.user) {
        authenticatedReq.user = {
          id: (session.user as any).id,
          email: session.user.email!,
          name: session.user.name!,
          role: (session.user as any).role
        }
      }

      // Call the original handler
      return await handler(authenticatedReq)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Internal Server Error',
          message: 'Authentication check failed'
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware specifically for admin-only routes
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: true, requireAdmin: true })
}

/**
 * Middleware for routes that allow both admin and user roles
 */
export function withUserAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { 
    requireAuth: true, 
    allowedRoles: ['admin', 'user'] 
  })
}

/**
 * Helper function to check if user has specific permission
 */
export function hasPermission(user: any, permission: string): boolean {
  if (!user) return false
  
  // Admin has all permissions
  if (user.role === 'admin') return true
  
  // Define permission mappings
  const permissions: Record<string, string[]> = {
    'upload:data': ['admin', 'user'],
    'delete:data': ['admin'],
    'manage:users': ['admin'],
    'manage:system': ['admin'],
    'view:analytics': ['admin', 'user'],
    'execute:scripts': ['admin', 'user'],
    'manage:optimization': ['admin', 'user']
  }
  
  const allowedRoles = permissions[permission] || []
  return allowedRoles.includes(user.role)
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map()

export function rateLimit(req: NextRequest, maxRequests = 100, windowMs = 60000) {
  const key = req.ip || req.headers.get('x-forwarded-for') || 'anonymous'
  const now = Date.now()
  
  const userRequests = rateLimitMap.get(key) || { count: 0, lastReset: now }
  
  // Reset if window has passed
  if (now - userRequests.lastReset > windowMs) {
    userRequests.count = 0
    userRequests.lastReset = now
  }
  
  userRequests.count++
  rateLimitMap.set(key, userRequests)
  
  if (userRequests.count > maxRequests) {
    throw new Error(`Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs/1000} seconds.`)
  }
  
  return true
}

/**
 * Combined auth + rate limiting wrapper
 */
export function withAuthAndRateLimit(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  authConfig: AuthConfig = { requireAuth: true },
  rateLimitConfig = { maxRequests: 100, windowMs: 60000 }
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    // Apply rate limiting
    try {
      rateLimit(req, rateLimitConfig.maxRequests, rateLimitConfig.windowMs)
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate Limit Exceeded',
          message: error.message
        },
        { status: 429 }
      )
    }
    
    return handler(req)
  }, authConfig)
}

/**
 * Activity logging helper
 */
export async function logActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: any
) {
  try {
    // Import db here to avoid circular dependencies
    const { db } = await import('@/lib/db')
    
    await db.activity.create({
      data: {
        type: 'api_access',
        action,
        title: `API ${action}`,
        description: `User ${userId} performed ${action} on ${entityType}`,
        entity_type: entityType,
        entity_id: entityId,
        user_id: userId,
        status: 'success',
        metadata
      }
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

/**
 * Create protected route variants
 */
export const createProtectedRoute = {
  admin: (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAdminAuth(handler),
    
  user: (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withUserAuth(handler),
    
  public: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    handler,
    
  rateLimited: (
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
    maxRequests = 50
  ) =>
    withAuthAndRateLimit(handler, { requireAuth: true }, { maxRequests, windowMs: 60000 })
}

export default withAuth
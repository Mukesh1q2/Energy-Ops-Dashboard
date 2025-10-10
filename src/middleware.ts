import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can be added here
    // For example, role-based access control
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

// Protect all routes except:
// - /auth/* (authentication pages)
// - /api/auth/* (NextAuth API routes)
// - /api/sandbox/* (sandbox API routes - no auth needed)
// - /api/charts/* (chart API routes - no auth needed)
// - /api/test-chart (test chart API - no auth needed)
// - /api/health (health check)
// - /api/socketio (Socket.IO WebSocket endpoint)
// - /_next/* (Next.js internals)
// - /favicon.ico, etc. (static files)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /auth/* (authentication pages)
     * - /api/auth/* (NextAuth API routes)
     * - /api/sandbox/* (sandbox API routes - no auth needed)
     * - /api/charts/* (chart API routes - no auth needed)
     * - /api/test-chart (test chart API - no auth needed)
     * - /api/health (health check)
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico, /robots.txt, etc. (static files)
     */
    '/((?!auth|api/auth|api/sandbox|api/charts|api/test-chart|api/health|api/socketio|sandbox|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}

import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate Limiter Configuration
 */
export interface RateLimitConfig {
  /** Unique identifier for this rate limiter */
  id: string
  /** Maximum number of requests allowed */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
  /** Custom message when rate limit is exceeded */
  message?: string
  /** Whether to include rate limit headers in response */
  includeHeaders?: boolean
}

/**
 * Rate limit entry for tracking requests
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limiting
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key)
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  set(key: string, entry: RateLimitEntry) {
    this.store.set(key, entry)
  }

  delete(key: string) {
    this.store.delete(key)
  }

  reset() {
    this.store.clear()
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Singleton store instance
const store = new RateLimitStore()

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  
  // Use the first available IP
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown'
  
  return ip
}

/**
 * Rate limit middleware for Next.js API routes
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    id,
    limit,
    windowMs,
    message = 'Too many requests, please try again later.',
    includeHeaders = true,
  } = config

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const clientId = getClientIdentifier(req)
    const key = `${id}:${clientId}`
    
    const now = Date.now()
    const entry = store.get(key)

    let currentCount: number
    let resetTime: number

    if (!entry) {
      // First request in this window
      currentCount = 1
      resetTime = now + windowMs
      store.set(key, { count: currentCount, resetTime })
    } else {
      // Increment count
      currentCount = entry.count + 1
      resetTime = entry.resetTime
      store.set(key, { count: currentCount, resetTime })
    }

    const remaining = Math.max(0, limit - currentCount)
    const isRateLimited = currentCount > limit

    // Build response with rate limit headers
    const headers: Record<string, string> = {}
    
    if (includeHeaders) {
      headers['X-RateLimit-Limit'] = limit.toString()
      headers['X-RateLimit-Remaining'] = remaining.toString()
      headers['X-RateLimit-Reset'] = new Date(resetTime).toISOString()
    }

    if (isRateLimited) {
      const retryAfter = Math.ceil((resetTime - now) / 1000)
      
      return NextResponse.json(
        {
          error: message,
          retryAfter,
          limit,
          remaining: 0,
        },
        {
          status: 429,
          headers: {
            ...headers,
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    // Not rate limited - return null to continue
    return null
  }
}

/**
 * Predefined rate limiters for common use cases
 */

// General API endpoints - 100 requests per minute
export const apiLimiter = rateLimit({
  id: 'api',
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many API requests. Please try again in a minute.',
})

// File upload endpoints - 10 requests per hour
export const uploadLimiter = rateLimit({
  id: 'upload',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many upload requests. Please try again in an hour.',
})

// Authentication endpoints - 5 requests per 15 minutes
export const authLimiter = rateLimit({
  id: 'auth',
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
})

// Data modification endpoints - 30 requests per minute
export const mutationLimiter = rateLimit({
  id: 'mutation',
  limit: 30,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many data modification requests. Please try again in a minute.',
})

// Heavy computation endpoints (optimization, analytics) - 20 requests per hour
export const computeLimiter = rateLimit({
  id: 'compute',
  limit: 20,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many computation requests. Please try again in an hour.',
})

// Database connection test - 10 requests per hour
export const dbTestLimiter = rateLimit({
  id: 'db-test',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many database test requests. Please try again in an hour.',
})

/**
 * Helper to apply rate limiting to API route handlers
 */
export async function withRateLimit(
  req: NextRequest,
  limiter: (req: NextRequest) => Promise<NextResponse | null>,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const rateLimitResponse = await limiter(req)
  
  if (rateLimitResponse) {
    return rateLimitResponse
  }
  
  return handler()
}

/**
 * Reset all rate limits (useful for testing)
 */
export function resetRateLimits() {
  store.reset()
}

/**
 * Destroy rate limit store (cleanup)
 */
export function destroyRateLimits() {
  store.destroy()
}

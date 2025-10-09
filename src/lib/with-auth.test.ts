import { describe, it, expect, beforeEach, vi } from 'vitest'
import { withUserAuth, withAdminAuth, rateLimit } from './with-auth'
import { mockPrisma, createMockUser, resetAllMocks } from '@/test/setup'

// Mock getServerSession
const mockGetServerSession = vi.fn()
vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession
}))

describe('Authentication Middleware', () => {
  beforeEach(() => {
    resetAllMocks()
    mockGetServerSession.mockReset()
  })

  describe('withUserAuth', () => {
    it('should allow authenticated user to access protected route', async () => {
      // Arrange
      const mockUser = createMockUser({ role: 'USER' })
      const mockSession = { user: mockUser }
      
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const protectedHandler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const wrappedHandler = withUserAuth(protectedHandler)

      const mockRequest = {
        url: 'http://localhost:3000/api/test',
        method: 'GET',
        headers: new Map([['user-agent', 'test-agent']])
      } as any

      // Act
      const response = await wrappedHandler(mockRequest)

      // Assert
      expect(protectedHandler).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUser }),
        undefined
      )
      expect(response.status).toBe(200)
    })

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null)

      const protectedHandler = vi.fn()
      const wrappedHandler = withUserAuth(protectedHandler)

      const mockRequest = { url: 'http://localhost:3000/api/test' } as any

      // Act
      const response = await wrappedHandler(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
      expect(protectedHandler).not.toHaveBeenCalled()
    })

    it('should return 401 for invalid user', async () => {
      // Arrange
      const mockSession = { user: { email: 'invalid@test.com' } }
      
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(null)

      const protectedHandler = vi.fn()
      const wrappedHandler = withUserAuth(protectedHandler)

      const mockRequest = { url: 'http://localhost:3000/api/test' } as any

      // Act
      const response = await wrappedHandler(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('User not found')
      expect(protectedHandler).not.toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      const mockSession = { user: { email: 'test@example.com' } }
      
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

      const protectedHandler = vi.fn()
      const wrappedHandler = withUserAuth(protectedHandler)

      const mockRequest = { url: 'http://localhost:3000/api/test' } as any

      // Act
      const response = await wrappedHandler(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.error).toBe('Authentication failed')
      expect(protectedHandler).not.toHaveBeenCalled()
    })

    it('should log user activity for authenticated requests', async () => {
      // Arrange
      const mockUser = createMockUser()
      const mockSession = { user: mockUser }
      
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const protectedHandler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const wrappedHandler = withUserAuth(protectedHandler)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const mockRequest = {
        url: 'http://localhost:3000/api/test?param=value',
        method: 'POST',
        headers: new Map([['user-agent', 'test-agent']])
      } as any

      // Act
      await wrappedHandler(mockRequest)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'User activity:',
        expect.objectContaining({
          userId: mockUser.id,
          email: mockUser.email,
          method: 'POST',
          url: '/api/test',
          userAgent: 'test-agent'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('withAdminAuth', () => {
    it('should allow admin user to access protected route', async () => {
      // Arrange
      const mockAdmin = createMockUser({ role: 'ADMIN' })
      const mockSession = { user: mockAdmin }
      
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockAdmin)

      const protectedHandler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const wrappedHandler = withAdminAuth(protectedHandler)

      const mockRequest = { url: 'http://localhost:3000/api/admin/test' } as any

      // Act
      const response = await wrappedHandler(mockRequest)

      // Assert
      expect(protectedHandler).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockAdmin }),
        undefined
      )
      expect(response.status).toBe(200)
    })

    it('should return 403 for non-admin user', async () => {
      // Arrange
      const mockUser = createMockUser({ role: 'USER' })
      const mockSession = { user: mockUser }
      
      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const protectedHandler = vi.fn()
      const wrappedHandler = withAdminAuth(protectedHandler)

      const mockRequest = { url: 'http://localhost:3000/api/admin/test' } as any

      // Act
      const response = await wrappedHandler(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin access required')
      expect(protectedHandler).not.toHaveBeenCalled()
    })

    it('should return 401 for unauthenticated request', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null)

      const protectedHandler = vi.fn()
      const wrappedHandler = withAdminAuth(protectedHandler)

      const mockRequest = { url: 'http://localhost:3000/api/admin/test' } as any

      // Act
      const response = await wrappedHandler(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
      expect(protectedHandler).not.toHaveBeenCalled()
    })
  })

  describe('rateLimit', () => {
    it('should allow requests within rate limit', async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const limitedHandler = rateLimit(handler, { windowMs: 60000, maxRequests: 10 })

      const mockRequest = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-forwarded-for', '192.168.1.1']])
      } as any

      // Act - Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        const response = await limitedHandler(mockRequest)
        expect(response.status).toBe(200)
      }

      // Assert
      expect(handler).toHaveBeenCalledTimes(5)
    })

    it('should block requests exceeding rate limit', async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const limitedHandler = rateLimit(handler, { windowMs: 60000, maxRequests: 3 })

      const mockRequest = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-forwarded-for', '192.168.1.2']])
      } as any

      // Act - Make requests up to and beyond limit
      const responses = []
      for (let i = 0; i < 5; i++) {
        responses.push(await limitedHandler(mockRequest))
      }

      // Assert
      expect(responses[0].status).toBe(200) // First request allowed
      expect(responses[1].status).toBe(200) // Second request allowed  
      expect(responses[2].status).toBe(200) // Third request allowed
      expect(responses[3].status).toBe(429) // Fourth request blocked
      expect(responses[4].status).toBe(429) // Fifth request blocked

      expect(handler).toHaveBeenCalledTimes(3) // Only 3 calls made it through
    })

    it('should use different limits per IP address', async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const limitedHandler = rateLimit(handler, { windowMs: 60000, maxRequests: 2 })

      const mockRequest1 = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-forwarded-for', '192.168.1.10']])
      } as any

      const mockRequest2 = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-forwarded-for', '192.168.1.20']])
      } as any

      // Act
      const response1a = await limitedHandler(mockRequest1)
      const response1b = await limitedHandler(mockRequest1)
      const response1c = await limitedHandler(mockRequest1) // Should be blocked

      const response2a = await limitedHandler(mockRequest2)
      const response2b = await limitedHandler(mockRequest2)

      // Assert
      expect(response1a.status).toBe(200)
      expect(response1b.status).toBe(200)
      expect(response1c.status).toBe(429) // IP1 blocked

      expect(response2a.status).toBe(200) // IP2 still has capacity
      expect(response2b.status).toBe(200) // IP2 still has capacity
    })

    it('should reset rate limit after window expires', async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const limitedHandler = rateLimit(handler, { windowMs: 100, maxRequests: 1 })

      const mockRequest = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-forwarded-for', '192.168.1.30']])
      } as any

      // Act
      const response1 = await limitedHandler(mockRequest)
      const response2 = await limitedHandler(mockRequest) // Should be blocked

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      const response3 = await limitedHandler(mockRequest) // Should be allowed again

      // Assert
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(429)
      expect(response3.status).toBe(200)
    })

    it('should extract IP from various headers', async () => {
      // Arrange
      const handler = vi.fn().mockResolvedValue({ 
        json: async () => ({ success: true }), 
        status: 200 
      })
      const limitedHandler = rateLimit(handler, { windowMs: 60000, maxRequests: 1 })

      // Test different IP extraction scenarios
      const requestWithForwardedFor = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-forwarded-for', '203.0.113.1, 192.168.1.1']])
      } as any

      const requestWithRealIP = {
        url: 'http://localhost:3000/api/test',
        headers: new Map([['x-real-ip', '203.0.113.2']])
      } as any

      // Act
      const response1 = await limitedHandler(requestWithForwardedFor)
      const response2 = await limitedHandler(requestWithForwardedFor) // Same IP, should be blocked
      const response3 = await limitedHandler(requestWithRealIP) // Different IP, should be allowed

      // Assert
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(429) // Same IP blocked
      expect(response3.status).toBe(200) // Different IP allowed
    })
  })
})
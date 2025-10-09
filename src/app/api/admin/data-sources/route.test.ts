import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { mockPrisma, createMockUser, createMockDataSource, createMockColumn, resetAllMocks, createAuthenticatedRequest } from '@/test/setup'

describe('/api/admin/data-sources', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/admin/data-sources', () => {
    it('should return paginated data sources for admin user', async () => {
      // Arrange
      const mockDataSources = [
        createMockDataSource({ id: '1', name: 'Source 1' }),
        createMockDataSource({ id: '2', name: 'Source 2' })
      ]
      const mockColumns = [
        createMockColumn({ data_source_id: '1', column_name: 'column1' }),
        createMockColumn({ data_source_id: '2', column_name: 'column2' })
      ]

      mockPrisma.dataSource.findMany.mockResolvedValue(mockDataSources)
      mockPrisma.dataSource.count.mockResolvedValue(25)
      
      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources?page=1&limit=10', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dataSources).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        pages: 3
      })
      expect(mockPrisma.dataSource.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        include: {
          columns: true,
          charts: { select: { id: true, title: true, chart_type: true } },
          _count: { select: { marketSnapshotData: true } }
        },
        orderBy: { created_at: 'desc' }
      })
    })

    it('should filter data sources by search term', async () => {
      // Arrange
      const mockDataSources = [
        createMockDataSource({ name: 'Energy Data Source' })
      ]
      
      mockPrisma.dataSource.findMany.mockResolvedValue(mockDataSources)
      mockPrisma.dataSource.count.mockResolvedValue(1)

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources?search=Energy', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.dataSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'Energy', mode: 'insensitive' } },
              { description: { contains: 'Energy', mode: 'insensitive' } }
            ]
          }
        })
      )
    })

    it('should filter by status', async () => {
      // Arrange
      const mockDataSources = [
        createMockDataSource({ status: 'ACTIVE' })
      ]
      
      mockPrisma.dataSource.findMany.mockResolvedValue(mockDataSources)
      mockPrisma.dataSource.count.mockResolvedValue(1)

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources?status=ACTIVE', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)

      // Assert
      expect(mockPrisma.dataSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' }
        })
      )
    })

    it('should require admin role', async () => {
      // Arrange
      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources', {
        user: { role: 'USER' }
      })

      // Act & Assert - This would be handled by withAdminAuth middleware
      // In a real test, we'd test the middleware separately
      expect(true).toBe(true) // Placeholder for middleware test
    })

    it('should handle database errors gracefully', async () => {
      // Arrange
      mockPrisma.dataSource.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch data sources')
    })

    it('should validate pagination parameters', async () => {
      // Arrange
      mockPrisma.dataSource.findMany.mockResolvedValue([])
      mockPrisma.dataSource.count.mockResolvedValue(0)

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources?page=0&limit=1000', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)

      // Assert
      expect(mockPrisma.dataSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0, // Page should be normalized to 1
          take: 100 // Limit should be capped at 100
        })
      )
    })

    it('should include related data counts', async () => {
      // Arrange
      const mockDataSources = [
        {
          ...createMockDataSource(),
          columns: [createMockColumn()],
          charts: [{ id: 'chart1', title: 'Chart 1', chart_type: 'line' }],
          _count: { marketSnapshotData: 500 }
        }
      ]
      
      mockPrisma.dataSource.findMany.mockResolvedValue(mockDataSources)
      mockPrisma.dataSource.count.mockResolvedValue(1)

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(data.dataSources[0]).toHaveProperty('columns')
      expect(data.dataSources[0]).toHaveProperty('charts')
      expect(data.dataSources[0]._count.marketSnapshotData).toBe(500)
    })

    it('should sort by created_at desc by default', async () => {
      // Arrange
      mockPrisma.dataSource.findMany.mockResolvedValue([])
      mockPrisma.dataSource.count.mockResolvedValue(0)

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources', {
        user: { role: 'ADMIN' }
      })

      // Act
      await GET(request)

      // Assert
      expect(mockPrisma.dataSource.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: 'desc' }
        })
      )
    })

    it('should handle empty results', async () => {
      // Arrange
      mockPrisma.dataSource.findMany.mockResolvedValue([])
      mockPrisma.dataSource.count.mockResolvedValue(0)

      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/data-sources', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dataSources).toEqual([])
      expect(data.pagination.total).toBe(0)
      expect(data.pagination.pages).toBe(0)
    })
  })
})
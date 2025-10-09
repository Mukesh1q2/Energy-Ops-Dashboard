import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, DELETE, PATCH } from './route'
import { mockPrisma, createMockUser, createMockDataSource, createMockColumn, createMockMarketData, resetAllMocks, createAuthenticatedRequest } from '@/test/setup'

describe('/api/data-sources/[id]', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/data-sources/[id]', () => {
    it('should return detailed data source information', async () => {
      // Arrange
      const mockDataSource = {
        ...createMockDataSource(),
        columns: [createMockColumn()],
        charts: [{ id: 'chart1', title: 'Test Chart', chart_type: 'line', created_at: new Date() }],
        _count: { marketSnapshotData: 100 }
      }
      
      const mockSampleData = [createMockMarketData()]

      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockSampleData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dataSource.id).toBe(mockDataSource.id)
      expect(data.dataSource.recordCount).toBe(100)
      expect(data.dataSource.sampleData).toHaveLength(1)
      
      expect(mockPrisma.dataSource.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: {
          columns: { orderBy: { column_name: 'asc' } },
          charts: { select: { id: true, title: true, chart_type: true, created_at: true } },
          _count: { select: { marketSnapshotData: true } }
        }
      })
    })

    it('should return 404 for non-existent data source', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(null)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/non-existent', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Data source not found')
    })

    it('should handle sample data retrieval errors gracefully', async () => {
      // Arrange
      const mockDataSource = {
        ...createMockDataSource(),
        columns: [],
        charts: [],
        _count: { marketSnapshotData: 0 }
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockRejectedValue(new Error('Sample data error'))

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.dataSource.sampleData).toEqual([])
    })
  })

  describe('DELETE /api/data-sources/[id]', () => {
    it('should delete data source and all related data', async () => {
      // Arrange
      const mockDataSource = {
        ...createMockDataSource(),
        columns: [createMockColumn()],
        _count: { marketSnapshotData: 50 },
        file_path: '/test/file.xlsx'
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await callback(mockPrisma)
        return true
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        method: 'DELETE',
        user: { role: 'ADMIN', email: 'admin@test.com' }
      })

      // Act
      const response = await DELETE(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Data source deleted successfully')
      expect(data.details.recordsDeleted).toBe(50)
      expect(data.details.columnsDeleted).toBe(1)

      // Verify transaction calls
      expect(mockPrisma.marketSnapshotData.deleteMany).toHaveBeenCalledWith({
        where: { data_source_id: 'test-id' }
      })
      expect(mockPrisma.dataSourceColumn.deleteMany).toHaveBeenCalledWith({
        where: { data_source_id: 'test-id' }
      })
      expect(mockPrisma.chart.deleteMany).toHaveBeenCalledWith({
        where: { data_source_id: 'test-id' }
      })
      expect(mockPrisma.dataSource.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' }
      })
    })

    it('should return 404 for non-existent data source', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(null)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/non-existent', {
        method: 'DELETE',
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await DELETE(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Data source not found')
    })

    it('should handle file deletion errors gracefully', async () => {
      // Arrange
      const mockDataSource = {
        ...createMockDataSource(),
        columns: [],
        _count: { marketSnapshotData: 0 },
        file_path: '/test/file.xlsx'
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await callback(mockPrisma)
        return true
      })

      // Mock storage.delete to throw error
      const { storage } = await import('@/lib/storage')
      vi.mocked(storage.delete).mockRejectedValue(new Error('File deletion failed'))

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        method: 'DELETE',
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await DELETE(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert - Should still succeed even if file deletion fails
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('PATCH /api/data-sources/[id]', () => {
    it('should update data source properties', async () => {
      // Arrange
      const existingDataSource = {
        ...createMockDataSource(),
        columns: [createMockColumn()]
      }
      const updatedDataSource = {
        ...existingDataSource,
        name: 'Updated Name',
        description: 'Updated description'
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(existingDataSource)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.dataSource.update.mockResolvedValue(updatedDataSource)
        return await callback(mockPrisma)
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Name',
          description: 'Updated description',
          status: 'ACTIVE'
        }),
        user: { role: 'ADMIN', email: 'admin@test.com' }
      })

      // Act
      const response = await PATCH(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Data source updated successfully')
      expect(mockPrisma.dataSource.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          name: 'Updated Name',
          description: 'Updated description',
          status: 'ACTIVE',
          updated_at: expect.any(Date)
        }
      })
    })

    it('should update column mappings', async () => {
      // Arrange
      const existingDataSource = {
        ...createMockDataSource(),
        columns: [createMockColumn({ id: 'col1' })]
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(existingDataSource)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.dataSource.update.mockResolvedValue(existingDataSource)
        return await callback(mockPrisma)
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        method: 'PATCH',
        body: JSON.stringify({
          columnUpdates: [
            {
              id: 'col1',
              label: 'Updated Label',
              expose_as_filter: true,
              data_type: 'INTEGER'
            }
          ]
        }),
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await PATCH(request, { params: { id: 'test-id' } })

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.dataSourceColumn.update).toHaveBeenCalledWith({
        where: { id: 'col1' },
        data: {
          label: 'Updated Label',
          expose_as_filter: true,
          data_type: 'INTEGER'
        }
      })
    })

    it('should return 404 for non-existent data source', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(null)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await PATCH(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Data source not found')
    })

    it('should handle partial updates correctly', async () => {
      // Arrange
      const existingDataSource = {
        ...createMockDataSource({ name: 'Original Name' }),
        columns: []
      }
      const updatedDataSource = {
        ...existingDataSource,
        description: 'New description only'
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(existingDataSource)
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.dataSource.update.mockResolvedValue(updatedDataSource)
        return await callback(mockPrisma)
      })

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'New description only'
          // name and status not provided - should not be updated
        }),
        user: { role: 'ADMIN' }
      })

      // Act
      const response = await PATCH(request, { params: { id: 'test-id' } })

      // Assert
      expect(response.status).toBe(200)
      expect(mockPrisma.dataSource.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: {
          description: 'New description only',
          updated_at: expect.any(Date)
        }
      })
    })
  })
})
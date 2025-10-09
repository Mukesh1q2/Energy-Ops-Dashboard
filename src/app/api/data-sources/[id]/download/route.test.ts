import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { mockPrisma, createMockUser, createMockDataSource, createMockColumn, createMockMarketData, resetAllMocks, createAuthenticatedRequest } from '@/test/setup'

describe('/api/data-sources/[id]/download', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/data-sources/[id]/download', () => {
    const mockDataSource = {
      ...createMockDataSource({ name: 'Test Data Source' }),
      columns: [
        createMockColumn({ column_name: 'time_period', data_type: 'DATETIME' }),
        createMockColumn({ column_name: 'dam_price', data_type: 'DECIMAL' })
      ]
    }

    const mockMarketData = [
      createMockMarketData({
        time_period: new Date('2024-01-01T10:00:00Z'),
        timeblock: 1,
        dam_price: 100.50
      }),
      createMockMarketData({
        time_period: new Date('2024-01-01T11:00:00Z'),
        timeblock: 2,
        dam_price: 105.25
      })
    ]

    it('should download Excel format by default', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers['Content-Type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      expect(response.headers['Content-Disposition']).toContain('Test_Data_Source_')
      expect(response.headers['Content-Disposition']).toContain('.xlsx')

      // Verify XLSX library was called
      const XLSX = await import('xlsx')
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2) // Data + Metadata sheets
    })

    it('should download CSV format when requested', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?format=csv', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers['Content-Type']).toBe('text/csv; charset=utf-8')
      expect(response.headers['Content-Disposition']).toContain('.csv')

      // Verify the CSV content structure
      const csvContent = await response.text()
      expect(csvContent).toContain('Time Period,Timeblock,DAM Price (Rs/MWh)')
      expect(csvContent).toContain('2024-01-01T10:00:00.000Z,1,100.5')
    })

    it('should download JSON format when requested', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?format=json', {
        user: { role: 'USER', email: 'test@example.com' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })
      const jsonData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(response.headers['Content-Type']).toBe('application/json')
      expect(response.headers['Content-Disposition']).toContain('.json')

      expect(jsonData).toHaveProperty('metadata')
      expect(jsonData).toHaveProperty('data')
      expect(jsonData.metadata.exportedBy).toBe('test@example.com')
      expect(jsonData.metadata.dataSource.name).toBe('Test Data Source')
      expect(jsonData.data).toHaveLength(2)
    })

    it('should limit records to 1000 by default', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download', {
        user: { role: 'USER' }
      })

      // Act
      await GET(request, { params: { id: 'test-id' } })

      // Assert
      expect(mockPrisma.marketSnapshotData.findMany).toHaveBeenCalledWith({
        where: { data_source_id: 'test-id' },
        orderBy: [
          { time_period: 'desc' },
          { timeblock: 'asc' }
        ],
        take: 1000
      })
    })

    it('should include all records when include_all=true', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?include_all=true', {
        user: { role: 'USER' }
      })

      // Act
      await GET(request, { params: { id: 'test-id' } })

      // Assert
      expect(mockPrisma.marketSnapshotData.findMany).toHaveBeenCalledWith({
        where: { data_source_id: 'test-id' },
        orderBy: [
          { time_period: 'desc' },
          { timeblock: 'asc' }
        ],
        take: undefined
      })
    })

    it('should return 404 for non-existent data source', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(null)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/non-existent/download', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'non-existent' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Data source not found')
    })

    it('should generate sample data when no actual data exists', async () => {
      // Arrange
      const dataSourceWithColumns = {
        ...mockDataSource,
        columns: [
          createMockColumn({ 
            column_name: 'test_col', 
            sample_values: ['Sample 1', 'Sample 2', 'Sample 3'] 
          })
        ]
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(dataSourceWithColumns)
      mockPrisma.marketSnapshotData.findMany.mockRejectedValue(new Error('No data'))

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?format=json', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })
      const jsonData = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(jsonData.data).toHaveLength(10) // Should generate 10 sample records
      expect(jsonData.data[0]).toHaveProperty('test_col')
      expect(['Sample 1', 'Sample 2', 'Sample 3']).toContain(jsonData.data[0].test_col)
    })

    it('should return 404 when no data and no columns available', async () => {
      // Arrange
      const dataSourceNoColumns = {
        ...createMockDataSource(),
        columns: []
      }

      mockPrisma.dataSource.findUnique.mockResolvedValue(dataSourceNoColumns)
      mockPrisma.marketSnapshotData.findMany.mockRejectedValue(new Error('No data'))

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No data available for download')
    })

    it('should handle unsupported format', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?format=xml', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unsupported format. Use excel, csv, or json.')
    })

    it('should generate proper filename with date', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue({
        ...mockDataSource,
        name: 'My Energy Data! (Test)'
      })
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })

      // Assert
      expect(response.headers['Content-Disposition']).toMatch(/My_Energy_Data__Test__\d{4}-\d{2}-\d{2}\.xlsx/)
    })

    it('should handle CSV escaping correctly', async () => {
      // Arrange
      const dataWithSpecialChars = [
        createMockMarketData({
          plant_name: 'Plant, "Special" Name',
          region: 'North\nRegion',
          state: 'Active,Running'
        })
      ]

      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(dataWithSpecialChars)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?format=csv', {
        user: { role: 'USER' }
      })

      // Act
      const response = await GET(request, { params: { id: 'test-id' } })

      // Assert
      const csvContent = await response.text()
      expect(csvContent).toContain('"Plant, ""Special"" Name"') // Properly escaped CSV
      expect(csvContent).toContain('"North\nRegion"')
      expect(csvContent).toContain('"Active,Running"')
    })

    it('should include metadata sheet in Excel export', async () => {
      // Arrange
      mockPrisma.dataSource.findUnique.mockResolvedValue(mockDataSource)
      mockPrisma.marketSnapshotData.findMany.mockResolvedValue(mockMarketData)

      const request = createAuthenticatedRequest('http://localhost:3000/api/data-sources/test-id/download?format=excel', {
        user: { role: 'USER' }
      })

      // Act
      await GET(request, { params: { id: 'test-id' } })

      // Assert
      const XLSX = await import('xlsx')
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2)
      
      // Verify metadata sheet content structure
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(
        expect.arrayContaining([
          ['Data Source Information'],
          ['Name', 'Test Data Source'],
          expect.anything(), // Other metadata rows
        ])
      )
    })
  })
})
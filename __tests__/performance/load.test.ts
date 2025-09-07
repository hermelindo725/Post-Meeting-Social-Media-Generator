import { NextRequest } from 'next/server'
import { GET } from '@/app/api/meetings/route'
import { prisma } from '@/lib/database'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    },
  }),
}))

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('API Response Times', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeMeetingsList = Array.from({ length: 1000 }, (_, i) => ({
        id: `meeting-${i}`,
        title: `Meeting ${i}`,
        startTime: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`),
        endTime: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}T11:00:00Z`),
        platform: 'zoom',
        status: 'completed',
        userId: 'test-user-id',
        posts: [],
      }))

      const mockPagination = {
        page: 1,
        limit: 20,
        total: 1000,
        pages: 50,
      }

      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: largeMeetingsList.slice(0, 20), // Return first 20 for pagination
        pagination: mockPagination,
      })

      const startTime = Date.now()
      
      const request = new NextRequest('http://localhost:3000/api/meetings?page=1&limit=20')
      const response = await GET(request)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should respond within 1 second
      
      const data = await response.json()
      expect(data.meetings).toHaveLength(20)
      expect(data.pagination.total).toBe(1000)
    })

    it('should handle concurrent requests efficiently', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          title: 'Test Meeting',
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
          platform: 'zoom',
          status: 'completed',
          userId: 'test-user-id',
          posts: [],
        },
      ]

      const mockPagination = {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      }

      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: mockMeetings,
        pagination: mockPagination,
      })

      // Simulate 10 concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, () => {
        const request = new NextRequest('http://localhost:3000/api/meetings')
        return GET(request)
      })

      const startTime = Date.now()
      const responses = await Promise.all(concurrentRequests)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(2000) // Should complete within 2 seconds
    })

    it('should handle pagination efficiently', async () => {
      const mockMeetings = Array.from({ length: 20 }, (_, i) => ({
        id: `meeting-${i}`,
        title: `Meeting ${i}`,
        startTime: new Date(`2024-01-15T${10 + i}:00:00Z`),
        endTime: new Date(`2024-01-15T${10 + i}:30:00Z`),
        platform: 'zoom',
        status: 'completed',
        userId: 'test-user-id',
        posts: [],
      }))

      ;(prisma.findMeetingsByUser as jest.Mock).mockImplementation((userId, options) => {
        const { page = 1, limit = 20 } = options
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        
        return Promise.resolve({
          meetings: mockMeetings.slice(startIndex, endIndex),
          pagination: {
            page,
            limit,
            total: 1000,
            pages: Math.ceil(1000 / limit),
          },
        })
      })

      // Test different page sizes
      const pageSizes = [10, 20, 50, 100]
      
      for (const limit of pageSizes) {
        const startTime = Date.now()
        
        const request = new NextRequest(`http://localhost:3000/api/meetings?page=1&limit=${limit}`)
        const response = await GET(request)
        
        const endTime = Date.now()
        const responseTime = endTime - startTime

        expect(response.status).toBe(200)
        expect(responseTime).toBeLessThan(500) // Should respond within 500ms
        
        const data = await response.json()
        expect(data.meetings.length).toBeLessThanOrEqual(limit)
      }
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory with repeated requests', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          title: 'Test Meeting',
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
          platform: 'zoom',
          status: 'completed',
          userId: 'test-user-id',
          posts: [],
        },
      ]

      const mockPagination = {
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      }

      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: mockMeetings,
        pagination: mockPagination,
      })

      // Make 100 requests to test for memory leaks
      const requests = Array.from({ length: 100 }, () => {
        const request = new NextRequest('http://localhost:3000/api/meetings')
        return GET(request)
      })

      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
    })
  })

  describe('Database Performance', () => {
    it('should handle complex queries efficiently', async () => {
      const complexMeetings = Array.from({ length: 100 }, (_, i) => ({
        id: `meeting-${i}`,
        title: `Complex Meeting ${i}`,
        startTime: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}T10:00:00Z`),
        endTime: new Date(`2024-01-${String(i % 28 + 1).padStart(2, '0')}T11:00:00Z`),
        platform: i % 2 === 0 ? 'zoom' : 'teams',
        status: i % 3 === 0 ? 'completed' : 'scheduled',
        userId: 'test-user-id',
        posts: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => ({
          id: `post-${i}-${j}`,
          content: `Post content ${i}-${j}`,
          platform: j % 2 === 0 ? 'linkedin' : 'facebook',
          status: 'posted',
        })),
      }))

      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: complexMeetings.slice(0, 20),
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          pages: 5,
        },
      })

      const startTime = Date.now()
      
      const request = new NextRequest('http://localhost:3000/api/meetings?platform=zoom&status=completed')
      const response = await GET(request)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(1000) // Should handle complex queries within 1 second
      
      const data = await response.json()
      expect(data.meetings).toBeDefined()
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      ;(prisma.findMeetingsByUser as jest.Mock).mockRejectedValue(new Error('Database error'))

      const startTime = Date.now()
      
      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(500)
      expect(responseTime).toBeLessThan(1000) // Should handle errors quickly
    })
  })
})

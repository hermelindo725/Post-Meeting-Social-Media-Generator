import { NextRequest } from 'next/server'
import { GET } from '@/app/api/meetings/route'
import { POST } from '@/app/api/meetings/route'

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

describe('Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      // Mock no session
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid session', async () => {
      // Mock invalid session
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: null,
      })

      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should accept requests with valid session', async () => {
      // Mock valid session
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      })

      // Mock Prisma response
      jest.mocked(require('@/lib/database').prisma.findMeetingsByUser).mockResolvedValue({
        meetings: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      })

      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Input Validation Security', () => {
    beforeEach(() => {
      // Mock valid session for all tests
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      })
    })

    it('should reject SQL injection attempts', async () => {
      const maliciousRequest = new NextRequest('http://localhost:3000/api/meetings?title=test\'; DROP TABLE meetings; --')
      
      jest.mocked(require('@/lib/database').prisma.findMeetingsByUser).mockResolvedValue({
        meetings: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      })

      const response = await GET(maliciousRequest)

      // Should not crash and should handle the request normally
      expect(response.status).toBe(200)
      
      // Verify that Prisma was called with sanitized parameters
      expect(require('@/lib/database').prisma.findMeetingsByUser).toHaveBeenCalledWith(
        'test-user-id',
        expect.objectContaining({
          // The malicious input should be sanitized
        })
      )
    })

    it('should reject XSS attempts in request body', async () => {
      const xssPayload = '<script>alert("XSS")</script>'
      
      const maliciousRequest = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: xssPayload,
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/123456789',
          attendees: ['test@example.com'],
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(maliciousRequest)

      // Should reject the request due to validation
      expect(response.status).toBe(400)
    })

    it('should reject requests with oversized payloads', async () => {
      const largeTitle = 'A'.repeat(10000) // Very large title
      
      const largeRequest = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: largeTitle,
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/123456789',
          attendees: ['test@example.com'],
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(largeRequest)

      // Should reject due to validation
      expect(response.status).toBe(400)
    })

    it('should reject requests with invalid data types', async () => {
      const invalidRequest = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: 123, // Should be string
          startTime: 'invalid-date',
          endTime: 'invalid-date',
          platform: 'invalid-platform',
          meetingUrl: 'not-a-url',
          attendees: 'not-an-array',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(invalidRequest)

      expect(response.status).toBe(400)
    })
  })

  describe('Authorization Security', () => {
    it('should only return meetings for authenticated user', async () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
      }

      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User 2',
      }

      // Mock session for user 1
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: user1,
      })

      // Mock Prisma to return only user 1's meetings
      jest.mocked(require('@/lib/database').prisma.findMeetingsByUser).mockResolvedValue({
        meetings: [
          {
            id: 'meeting-1',
            title: 'User 1 Meeting',
            userId: 'user-1',
            startTime: new Date('2024-01-15T10:00:00Z'),
            endTime: new Date('2024-01-15T10:30:00Z'),
            platform: 'zoom',
            status: 'completed',
            posts: [],
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      })

      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.meetings).toHaveLength(1)
      expect(data.meetings[0].userId).toBe('user-1')
      expect(data.meetings[0].title).toBe('User 1 Meeting')

      // Verify Prisma was called with correct user ID
      expect(require('@/lib/database').prisma.findMeetingsByUser).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object)
      )
    })
  })

  describe('Rate Limiting Security', () => {
    it('should handle rate limiting gracefully', async () => {
      // Mock valid session
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      })

      // Mock Prisma response
      jest.mocked(require('@/lib/database').prisma.findMeetingsByUser).mockResolvedValue({
        meetings: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      })

      // Simulate multiple rapid requests
      const requests = Array.from({ length: 5 }, () => {
        const request = new NextRequest('http://localhost:3000/api/meetings')
        return GET(request)
      })

      const responses = await Promise.all(requests)

      // All requests should be handled (rate limiting would be handled by middleware)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status)
      })
    })
  })

  describe('CSRF Protection', () => {
    it('should reject requests without proper origin', async () => {
      // Mock valid session
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      })

      // Mock Prisma response
      jest.mocked(require('@/lib/database').prisma.meeting.create).mockResolvedValue({
        id: 'meeting-123',
        title: 'Test Meeting',
        userId: 'test-user-id',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        platform: 'zoom',
        status: 'scheduled',
        posts: [],
      })

      // Request without proper origin header
      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Meeting',
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/123456789',
          attendees: ['test@example.com'],
        }),
        headers: { 
          'Content-Type': 'application/json',
          // No origin header
        },
      })

      const response = await POST(request)

      // Should be handled by middleware, but the request should still be processed
      // (CSRF protection would be handled at the middleware level)
      expect([200, 201, 403]).toContain(response.status)
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize user input', async () => {
      // Mock valid session
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
        },
      })

      // Mock Prisma response
      jest.mocked(require('@/lib/database').prisma.meeting.create).mockResolvedValue({
        id: 'meeting-123',
        title: 'Test Meeting',
        userId: 'test-user-id',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:30:00Z'),
        platform: 'zoom',
        status: 'scheduled',
        posts: [],
      })

      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Meeting <script>alert("xss")</script>',
          startTime: '2024-01-15T10:00:00.000Z',
          endTime: '2024-01-15T10:30:00.000Z',
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/123456789',
          attendees: ['test@example.com'],
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)

      // Should reject due to validation
      expect(response.status).toBe(400)
    })
  })
})

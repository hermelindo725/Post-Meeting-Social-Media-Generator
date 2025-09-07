import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/meetings/route'
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

// Mock Prisma
jest.mock('@/lib/database', () => ({
  prisma: {
    findMeetingsByUser: jest.fn(),
    meeting: {
      create: jest.fn(),
    },
  },
}))

describe('/api/meetings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/meetings', () => {
    it('should return meetings for authenticated user', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          title: 'Test Meeting',
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T10:30:00Z'),
          platform: 'zoom',
          status: 'completed',
          userId: 'test-user-id',
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

      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.meetings).toHaveLength(1)
      expect(data.meetings[0].title).toBe('Test Meeting')
      expect(data.pagination.total).toBe(1)
    })

    it('should handle query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/meetings?page=2&limit=10&status=completed')
      
      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: [],
        pagination: { page: 2, limit: 10, total: 0, pages: 0 },
      })

      await GET(request)

      expect(prisma.findMeetingsByUser).toHaveBeenCalledWith('test-user-id', {
        status: 'completed',
        platform: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 2,
        limit: 10,
      })
    })

    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/meetings')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/meetings', () => {
    it('should create a new meeting', async () => {
      const meetingData = {
        title: 'New Meeting',
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T10:30:00.000Z',
        platform: 'zoom',
        meetingUrl: 'https://zoom.us/j/123456789',
        attendees: ['john@example.com'],
        description: 'Test meeting',
      }

      const mockCreatedMeeting = {
        id: 'new-meeting-id',
        ...meetingData,
        userId: 'test-user-id',
        startTime: new Date(meetingData.startTime),
        endTime: new Date(meetingData.endTime),
        posts: [],
      }

      ;(prisma.meeting.create as jest.Mock).mockResolvedValue(mockCreatedMeeting)

      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.title).toBe('New Meeting')
      expect(data.userId).toBe('test-user-id')
    })

    it('should validate meeting data', async () => {
      const invalidData = {
        title: '', // Empty title
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T09:00:00.000Z', // End before start
        platform: 'invalid-platform',
      }

      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 401 for unauthenticated user', async () => {
      jest.mocked(require('next-auth').getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })
})

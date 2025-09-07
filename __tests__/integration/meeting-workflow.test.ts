import { NextRequest } from 'next/server'
import { GET as getMeetings, POST as createMeeting } from '@/app/api/meetings/route'
import { POST as generatePost } from '@/app/api/ai/generate-social-post/route'
import { prisma } from '@/lib/database'

// Mock external services
jest.mock('@/lib/api-clients', () => ({
  createApiClients: {
    openai: () => ({
      generateSocialPost: jest.fn().mockResolvedValue('Great meeting today! Key insights shared. #TeamWork #Innovation'),
    }),
  },
}))

describe('Meeting Workflow Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock NextAuth session
    jest.mocked(require('next-auth').getServerSession).mockResolvedValue({
      user: mockUser,
    })
  })

  describe('Complete Meeting Workflow', () => {
    it('should create meeting, generate transcript, and create social post', async () => {
      // Step 1: Create a meeting
      const meetingData = {
        title: 'Sprint Planning',
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T11:00:00.000Z',
        platform: 'zoom',
        meetingUrl: 'https://zoom.us/j/123456789',
        attendees: ['john@example.com', 'jane@example.com'],
        description: 'Weekly sprint planning meeting',
      }

      const mockCreatedMeeting = {
        id: 'meeting-123',
        ...meetingData,
        userId: mockUser.id,
        startTime: new Date(meetingData.startTime),
        endTime: new Date(meetingData.endTime),
        status: 'scheduled',
        posts: [],
      }

      ;(prisma.meeting.create as jest.Mock).mockResolvedValue(mockCreatedMeeting)

      const createRequest = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData),
        headers: { 'Content-Type': 'application/json' },
      })

      const createResponse = await createMeeting(createRequest)
      const createdMeeting = await createResponse.json()

      expect(createResponse.status).toBe(201)
      expect(createdMeeting.title).toBe('Sprint Planning')

      // Step 2: Update meeting with transcript (simulate after meeting ends)
      const updatedMeeting = {
        ...mockCreatedMeeting,
        transcript: 'Sprint Planning Meeting - January 15, 2024\n\nAttendees: John Doe, Jane Smith\n\nKey Discussion Points:\n- Reviewed previous sprint achievements\n- Planned upcoming features\n- Discussed resource allocation\n\nAction Items:\n- John to finalize API documentation\n- Jane to prepare user stories',
        status: 'completed',
      }

      ;(prisma.meeting.update as jest.Mock).mockResolvedValue(updatedMeeting)

      // Step 3: Generate social media post
      const postData = {
        meetingId: createdMeeting.id,
        platform: 'linkedin',
        tone: 'professional',
        includeHashtags: true,
        maxLength: 280,
      }

      const generateRequest = new NextRequest('http://localhost:3000/api/ai/generate-social-post', {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { 'Content-Type': 'application/json' },
      })

      const generateResponse = await generatePost(generateRequest)
      const generatedPost = await generateResponse.json()

      expect(generateResponse.status).toBe(200)
      expect(generatedPost.content).toContain('Great meeting today!')
      expect(generatedPost.platform).toBe('linkedin')

      // Step 4: Verify meeting can be retrieved
      const mockMeetings = [updatedMeeting]
      const mockPagination = { page: 1, limit: 20, total: 1, pages: 1 }

      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: mockMeetings,
        pagination: mockPagination,
      })

      const getRequest = new NextRequest('http://localhost:3000/api/meetings')
      const getResponse = await getMeetings(getRequest)
      const meetings = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(meetings.meetings).toHaveLength(1)
      expect(meetings.meetings[0].status).toBe('completed')
      expect(meetings.meetings[0].transcript).toBeDefined()
    })

    it('should handle meeting with multiple social posts', async () => {
      const meetingData = {
        title: 'Product Review',
        startTime: '2024-01-15T14:00:00.000Z',
        endTime: '2024-01-15T15:00:00.000Z',
        platform: 'teams',
        meetingUrl: 'https://teams.microsoft.com/l/meetup-join/123456789',
        attendees: ['product@example.com', 'dev@example.com'],
        description: 'Product review meeting',
      }

      const mockMeeting = {
        id: 'meeting-456',
        ...meetingData,
        userId: mockUser.id,
        startTime: new Date(meetingData.startTime),
        endTime: new Date(meetingData.endTime),
        status: 'completed',
        transcript: 'Product review meeting transcript...',
        posts: [
          {
            id: 'post-1',
            content: 'LinkedIn post content',
            platform: 'linkedin',
            status: 'posted',
          },
          {
            id: 'post-2',
            content: 'Facebook post content',
            platform: 'facebook',
            status: 'posted',
          },
        ],
      }

      ;(prisma.meeting.create as jest.Mock).mockResolvedValue(mockMeeting)
      ;(prisma.findMeetingsByUser as jest.Mock).mockResolvedValue({
        meetings: [mockMeeting],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      })

      // Create meeting
      const createRequest = new NextRequest('http://localhost:3000/api/meetings', {
        method: 'POST',
        body: JSON.stringify(meetingData),
        headers: { 'Content-Type': 'application/json' },
      })

      const createResponse = await createMeeting(createRequest)
      const createdMeeting = await createResponse.json()

      // Retrieve meeting with posts
      const getRequest = new NextRequest('http://localhost:3000/api/meetings')
      const getResponse = await getMeetings(getRequest)
      const meetings = await getResponse.json()

      expect(meetings.meetings[0].posts).toHaveLength(2)
      expect(meetings.meetings[0].posts[0].platform).toBe('linkedin')
      expect(meetings.meetings[0].posts[1].platform).toBe('facebook')
    })

    it('should handle automation workflow', async () => {
      // Mock automation that triggers after meeting completion
      const automationData = {
        name: 'LinkedIn Post Generator',
        type: 'Generate post',
        platform: 'linkedin',
        isActive: true,
        triggerConditions: {
          meetingEnded: true,
          hasTranscript: true,
          minDuration: 30,
        },
      }

      const mockAutomation = {
        id: 'automation-123',
        ...automationData,
        userId: mockUser.id,
      }

      ;(prisma.automation.create as jest.Mock).mockResolvedValue(mockAutomation)

      // Create automation
      const createAutomationRequest = new NextRequest('http://localhost:3000/api/automations', {
        method: 'POST',
        body: JSON.stringify(automationData),
        headers: { 'Content-Type': 'application/json' },
      })

      // Mock the automation endpoint
      const mockAutomationResponse = {
        json: () => Promise.resolve(mockAutomation),
        status: 201,
      }

      // Simulate automation triggering after meeting completion
      const meetingWithAutomation = {
        id: 'meeting-789',
        title: 'Team Standup',
        status: 'completed',
        transcript: 'Team standup meeting transcript...',
        userId: mockUser.id,
        automation: mockAutomation,
      }

      ;(prisma.meeting.findFirst as jest.Mock).mockResolvedValue(meetingWithAutomation)

      // Generate post using automation
      const generateRequest = new NextRequest('http://localhost:3000/api/ai/generate-social-post', {
        method: 'POST',
        body: JSON.stringify({
          meetingId: meetingWithAutomation.id,
          platform: 'linkedin',
          automationId: mockAutomation.id,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const generateResponse = await generatePost(generateRequest)
      const generatedPost = await generateResponse.json()

      expect(generateResponse.status).toBe(200)
      expect(generatedPost.content).toBeDefined()
      expect(generatedPost.platform).toBe('linkedin')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      ;(prisma.meeting.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

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
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createMeeting(request)

      expect(response.status).toBe(500)
    })

    it('should handle AI service errors gracefully', async () => {
      // Mock OpenAI service error
      jest.mocked(require('@/lib/api-clients').createApiClients.openai().generateSocialPost)
        .mockRejectedValue(new Error('OpenAI API rate limit exceeded'))

      const request = new NextRequest('http://localhost:3000/api/ai/generate-social-post', {
        method: 'POST',
        body: JSON.stringify({
          meetingId: 'meeting-123',
          platform: 'linkedin',
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await generatePost(request)

      expect(response.status).toBe(500)
    })
  })
})

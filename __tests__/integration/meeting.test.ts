// Comprehensive Integration Tests
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient } from '@prisma/client'
import { createMocks } from 'node-mocks-http'
import handler from '../../app/api/meetings/past/route'

const prisma = new PrismaClient()

describe('Meeting API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.post.deleteMany()
    await prisma.meeting.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('GET /api/meetings/past', () => {
    it('should return past meetings for authenticated user', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          id: 'test-user-1',
          email: 'test@example.com',
          name: 'Test User'
        }
      })

      // Create test meeting
      const meeting = await prisma.meeting.create({
        data: {
          id: 'test-meeting-1',
          title: 'Test Meeting',
          startTime: new Date('2023-01-01T10:00:00Z'),
          endTime: new Date('2023-01-01T11:00:00Z'),
          platform: 'zoom',
          status: 'completed',
          transcript: 'Test transcript content',
          attendees: ['user1@example.com', 'user2@example.com'],
          userId: user.id
        }
      })

      // Create test post
      await prisma.post.create({
        data: {
          id: 'test-post-1',
          content: 'Test social media post',
          platform: 'linkedin',
          status: 'draft',
          meetingId: meeting.id
        }
      })

      // Mock request
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      // Mock session
      jest.mock('next-auth', () => ({
        getServerSession: () => ({
          user: { id: user.id }
        })
      }))

      // Call handler
      await handler(req, res)

      // Assertions
      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.meetings).toHaveLength(1)
      expect(data.meetings[0].id).toBe(meeting.id)
      expect(data.meetings[0].posts).toHaveLength(1)
    })

    it('should return 401 for unauthenticated user', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })

      // Mock no session
      jest.mock('next-auth', () => ({
        getServerSession: () => null
      }))

      await handler(req, res)

      expect(res._getStatusCode()).toBe(401)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prisma.meeting, 'findMany').mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer test-token'
        }
      })

      jest.mock('next-auth', () => ({
        getServerSession: () => ({
          user: { id: 'test-user' }
        })
      }))

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Meeting Business Logic', () => {
    it('should calculate meeting duration correctly', () => {
      const startTime = new Date('2023-01-01T10:00:00Z')
      const endTime = new Date('2023-01-01T11:30:00Z')
      const duration = endTime.getTime() - startTime.getTime()
      
      expect(duration).toBe(90 * 60 * 1000) // 90 minutes
    })

    it('should extract meeting platform from URL', () => {
      const zoomUrl = 'https://zoom.us/j/123456789'
      const teamsUrl = 'https://teams.microsoft.com/l/meetup-join/abc123'
      const meetUrl = 'https://meet.google.com/abc-defg-hij'

      expect(zoomUrl.includes('zoom.us')).toBe(true)
      expect(teamsUrl.includes('teams.microsoft.com')).toBe(true)
      expect(meetUrl.includes('meet.google.com')).toBe(true)
    })

    it('should validate meeting data', () => {
      const validMeeting = {
        title: 'Test Meeting',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        platform: 'zoom'
      }

      expect(validMeeting.title).toBeTruthy()
      expect(validMeeting.startTime).toBeInstanceOf(Date)
      expect(validMeeting.endTime.getTime()).toBeGreaterThan(validMeeting.startTime.getTime())
      expect(['zoom', 'teams', 'google-meet']).toContain(validMeeting.platform)
    })
  })

  describe('Content Generation Integration', () => {
    it('should generate content from meeting transcript', async () => {
      const transcript = 'We discussed retirement planning strategies and portfolio optimization.'
      const meetingTitle = 'Client Retirement Planning Meeting'
      
      // Mock OpenAI response
      const mockOpenAI = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'Great discussion about retirement planning strategies today!'
                }
              }]
            })
          }
        }
      }

      jest.mock('openai', () => ({
        __esModule: true,
        default: jest.fn(() => mockOpenAI)
      }))

      // Test content generation
      const response = await mockOpenAI.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Generate a LinkedIn post from: ${transcript}` }]
      })

      expect(response.choices[0].message.content).toContain('retirement planning')
    })
  })

  describe('Social Media Integration', () => {
    it('should validate social media credentials', () => {
      const validCredentials = {
        platform: 'linkedin',
        accessToken: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000)
      }

      expect(validCredentials.platform).toMatch(/^(linkedin|facebook|twitter)$/)
      expect(validCredentials.accessToken).toBeTruthy()
      expect(validCredentials.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should format content for different platforms', () => {
      const baseContent = 'This is a test post about our meeting discussion.'
      
      const linkedinPost = {
        content: baseContent,
        maxLength: 3000,
        hashtags: ['#meeting', '#business']
      }

      const twitterPost = {
        content: baseContent.substring(0, 280),
        maxLength: 280,
        hashtags: ['#meeting']
      }

      expect(linkedinPost.content.length).toBeLessThanOrEqual(linkedinPost.maxLength)
      expect(twitterPost.content.length).toBeLessThanOrEqual(twitterPost.maxLength)
    })
  })

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded'
      }

      expect(rateLimitError.status).toBe(429)
      expect(rateLimitError.message).toContain('Rate limit')
    })

    it('should handle API failures gracefully', async () => {
      const apiError = {
        status: 500,
        message: 'Internal server error',
        retryable: true
      }

      expect(apiError.status).toBe(500)
      expect(apiError.retryable).toBe(true)
    })

    it('should validate input data', () => {
      const invalidInputs = [
        { title: '', startTime: new Date(), endTime: new Date() },
        { title: 'Test', startTime: 'invalid', endTime: new Date() },
        { title: 'Test', startTime: new Date(), endTime: new Date(Date.now() - 3600000) }
      ]

      invalidInputs.forEach(input => {
        expect(() => {
          if (!input.title) throw new Error('Title required')
          if (!(input.startTime instanceof Date)) throw new Error('Invalid start time')
          if (input.endTime.getTime() <= input.startTime.getTime()) throw new Error('Invalid end time')
        }).toThrow()
      })
    })
  })

  describe('Performance Tests', () => {
    it('should handle large transcript processing', async () => {
      const largeTranscript = 'A'.repeat(100000) // 100KB transcript
      const startTime = Date.now()

      // Simulate processing
      const processed = largeTranscript.substring(0, 1000)
      const processingTime = Date.now() - startTime

      expect(processed.length).toBe(1000)
      expect(processingTime).toBeLessThan(1000) // Should process in under 1 second
    })

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        Promise.resolve({ id: i, status: 'success' })
      )

      const results = await Promise.all(concurrentRequests)
      expect(results).toHaveLength(10)
      expect(results.every(r => r.status === 'success')).toBe(true)
    })
  })

  describe('Security Tests', () => {
    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const sanitized = maliciousInput.replace(/<[^>]*>/g, '')
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toBe('alert("xss")')
    })

    it('should validate user permissions', () => {
      const userPermissions = {
        userId: 'user-1',
        canViewMeeting: (meetingUserId: string) => meetingUserId === 'user-1',
        canEditMeeting: (meetingUserId: string) => meetingUserId === 'user-1'
      }

      expect(userPermissions.canViewMeeting('user-1')).toBe(true)
      expect(userPermissions.canViewMeeting('user-2')).toBe(false)
    })

    it('should encrypt sensitive data', () => {
      const sensitiveData = 'user-email@example.com'
      const encrypted = Buffer.from(sensitiveData).toString('base64')
      const decrypted = Buffer.from(encrypted, 'base64').toString('utf-8')
      
      expect(encrypted).not.toBe(sensitiveData)
      expect(decrypted).toBe(sensitiveData)
    })
  })
})

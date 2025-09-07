import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

// Test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postmeeting_test',
    },
  },
})

// Global test setup
beforeAll(async () => {
  // Reset test database
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  })
})

// Clean up after each test
afterEach(async () => {
  // Clean up test data
  await prisma.post.deleteMany()
  await prisma.automation.deleteMany()
  await prisma.meeting.deleteMany()
  await prisma.userSettings.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
})

// Clean up after all tests
afterAll(async () => {
  await prisma.$disconnect()
})

// Mock external services
jest.mock('../lib/api-clients', () => ({
  createApiClients: {
    googleCalendar: jest.fn(() => ({
      getEvents: jest.fn().mockResolvedValue({
        items: [
          {
            id: 'test-event-1',
            summary: 'Test Meeting',
            start: { dateTime: new Date().toISOString() },
            end: { dateTime: new Date(Date.now() + 3600000).toISOString() },
            attendees: [{ email: 'test@example.com', displayName: 'Test User' }],
            hangoutLink: 'https://meet.google.com/test',
          },
        ],
      })),
    })),
    openai: jest.fn(() => ({
      generateSocialPost: jest.fn().mockResolvedValue('Test social media post content'),
      generateEmailSummary: jest.fn().mockResolvedValue('Test email summary content'),
    })),
    recall: jest.fn(() => ({
      createBot: jest.fn().mockResolvedValue({ id: 'test-bot-id' }),
      getBotTranscript: jest.fn().mockResolvedValue('Test transcript content'),
    })),
    linkedin: jest.fn(() => ({
      postUpdate: jest.fn().mockResolvedValue({ id: 'test-post-id' }),
    })),
    facebook: jest.fn(() => ({
      postToPage: jest.fn().mockResolvedValue({ id: 'test-post-id' }),
    })),
  },
}))

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
    },
  }),
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postmeeting_test'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.OPENAI_API_KEY = 'test-openai-api-key'
process.env.RECALL_API_KEY = 'test-recall-api-key'

export { prisma }

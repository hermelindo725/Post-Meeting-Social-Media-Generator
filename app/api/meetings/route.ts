import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database'
import { handleApiError } from '@/lib/errors'
import { validateInput, meetingSchemas } from '@/lib/validation'
import { log } from '@/lib/logger'
import { withApiSecurity } from '@/lib/security'

// GET /api/meetings - Get user's meetings
async function getMeetings(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = validateInput(meetingSchemas.query, Object.fromEntries(searchParams))

  try {
    const result = await prisma.findMeetingsByUser(session.user.id, {
      status: query.status,
      platform: query.platform,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page: query.page,
      limit: query.limit,
    })

    log.info(`Retrieved ${result.meetings.length} meetings for user ${session.user.id}`)

    return NextResponse.json({
      meetings: result.meetings,
      pagination: result.pagination,
    })
  } catch (error) {
    log.error('Failed to retrieve meetings', { error, userId: session.user.id })
    return handleApiError(error)
  }
}

// POST /api/meetings - Create a new meeting
async function createMeeting(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const meetingData = validateInput(meetingSchemas.create, body)

    // Validate date range
    const startTime = new Date(meetingData.startTime)
    const endTime = new Date(meetingData.endTime)
    
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    const meeting = await prisma.meeting.create({
      data: {
        ...meetingData,
        userId: session.user.id,
        startTime,
        endTime,
      },
      include: {
        posts: true,
      },
    })

    log.meeting.created(meeting.id, session.user.id, meeting.title)

    return NextResponse.json(meeting, { status: 201 })
  } catch (error) {
    log.error('Failed to create meeting', { error, userId: session.user.id })
    return handleApiError(error)
  }
}

// Main handler with security middleware
export const GET = withApiSecurity(getMeetings, {
  requireAuth: true,
  rateLimit: { limit: 100, windowMs: 15 * 60 * 1000 },
  methods: ['GET'],
})

export const POST = withApiSecurity(createMeeting, {
  requireAuth: true,
  rateLimit: { limit: 10, windowMs: 15 * 60 * 1000 },
  methods: ['POST'],
})

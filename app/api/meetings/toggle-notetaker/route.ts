import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createRecallBot } from '@/lib/recall'
import { extractMeetingUrl, detectPlatform } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId, enabled } = await request.json()

    if (enabled) {
      // Get the calendar event details
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          provider: 'google'
        }
      })

      if (!account?.access_token) {
        return NextResponse.json({ error: 'Google account not connected' }, { status: 400 })
      }

      // For now, we'll create a placeholder meeting record
      // In a real implementation, you'd fetch the event details from Google Calendar
      const meeting = await prisma.meeting.create({
        data: {
          title: `Meeting ${eventId}`,
          startTime: new Date(),
          endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
          platform: 'zoom',
          meetingUrl: 'https://zoom.us/j/123456789',
          userId: session.user.id,
          status: 'scheduled'
        }
      })

      // Create recall bot (this would need the actual meeting URL)
      // const bot = await createRecallBot(meetingUrl, meeting.title, meeting.startTime.toISOString())
      
      return NextResponse.json({ success: true, meetingId: meeting.id })
    } else {
      // Disable notetaker - remove the meeting or update status
      await prisma.meeting.deleteMany({
        where: {
          userId: session.user.id,
          // You'd need to match by calendar event ID
        }
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error toggling notetaker:', error)
    return NextResponse.json({ error: 'Failed to toggle notetaker' }, { status: 500 })
  }
}

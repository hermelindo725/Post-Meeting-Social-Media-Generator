import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateFollowUpEmail } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript, meetingTitle } = await request.json()

    if (!transcript || !meetingTitle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const email = await generateFollowUpEmail(transcript, meetingTitle)
    
    return NextResponse.json({ email })
  } catch (error) {
    console.error('Error generating email:', error)
    return NextResponse.json({ error: 'Failed to generate email' }, { status: 500 })
  }
}

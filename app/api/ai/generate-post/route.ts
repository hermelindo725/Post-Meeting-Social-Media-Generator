import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateSocialMediaPost } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transcript, meetingTitle, automation } = await request.json()

    if (!transcript || !meetingTitle || !automation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const post = await generateSocialMediaPost(transcript, meetingTitle, automation)
    
    // Save the generated post to the database
    const savedPost = await prisma.post.create({
      data: {
        content: post,
        platform: automation.platform,
        meetingId: automation.meetingId || '',
        automationId: automation.id,
        status: 'draft'
      }
    })
    
    return NextResponse.json({ post, postId: savedPost.id })
  } catch (error) {
    console.error('Error generating post:', error)
    return NextResponse.json({ error: 'Failed to generate post' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content, platform } = await request.json()

    // Get the social account
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: platform
      }
    })

    if (!socialAccount) {
      return NextResponse.json({ error: 'Social account not connected' }, { status: 400 })
    }

    // Post to the social platform
    let success = false
    
    if (platform === 'linkedin') {
      success = await postToLinkedIn(content, socialAccount.accessToken)
    } else if (platform === 'facebook') {
      success = await postToFacebook(content, socialAccount.accessToken)
    }

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Failed to post to social media' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error posting to social media:', error)
    return NextResponse.json({ error: 'Failed to post to social media' }, { status: 500 })
  }
}

async function postToLinkedIn(content: string, accessToken: string): Promise<boolean> {
  try {
    // First, get the user's profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    })

    if (!profileResponse.ok) return false

    const profile = await profileResponse.json()
    const personUrn = profile.id

    // Create a share
    const shareResponse = await fetch('https://api.linkedin.com/v2/shares', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    })

    return shareResponse.ok
  } catch (error) {
    console.error('Error posting to LinkedIn:', error)
    return false
  }
}

async function postToFacebook(content: string, accessToken: string): Promise<boolean> {
  try {
    // For Facebook, we'll post to the user's feed
    const response = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: content
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error posting to Facebook:', error)
    return false
  }
}

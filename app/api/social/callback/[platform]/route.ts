import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=missing_params`)
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    let accessToken = ''
    let refreshToken = ''
    let expiresAt: Date | null = null

    if (platform === 'linkedin') {
      // Exchange code for access token
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: `${baseUrl}/api/social/callback/linkedin`,
        }),
      })

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
    } else if (platform === 'facebook') {
      // Exchange code for access token
      const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.FACEBOOK_CLIENT_ID!,
          client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
          redirect_uri: `${baseUrl}/api/social/callback/facebook`,
          code,
        }),
      })

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
    }

    // Save the social account
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: state,
          platform: platform
        }
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt
      },
      create: {
        userId: state,
        platform: platform,
        accessToken,
        refreshToken,
        expiresAt
      }
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?connected=${platform}`)
  } catch (error) {
    console.error('Error in social callback:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=callback_failed`)
  }
}

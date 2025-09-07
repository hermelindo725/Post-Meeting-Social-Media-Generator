import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = params
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    let authUrl = ''
    
    if (platform === 'linkedin') {
      const clientId = process.env.LINKEDIN_CLIENT_ID
      const redirectUri = `${baseUrl}/api/social/callback/linkedin`
      const scope = 'r_liteprofile r_emailaddress w_member_social'
      
      authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${session.user.id}&scope=${scope}`
    } else if (platform === 'facebook') {
      const clientId = process.env.FACEBOOK_CLIENT_ID
      const redirectUri = `${baseUrl}/api/social/callback/facebook`
      const scope = 'pages_manage_posts,pages_read_engagement'
      
      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${session.user.id}&scope=${scope}`
    } else {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 })
  }
}

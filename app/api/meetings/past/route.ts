import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        userId: session.user.id,
        status: 'completed'
      },
      include: {
        posts: {
          include: {
            automation: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })
    
    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('Error fetching past meetings:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

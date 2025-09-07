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

    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId: session.user.id }
    })

    const linkedin = socialAccounts.some(account => account.platform === 'linkedin')
    const facebook = socialAccounts.some(account => account.platform === 'facebook')
    
    return NextResponse.json({ linkedin, facebook })
  } catch (error) {
    console.error('Error checking social status:', error)
    return NextResponse.json({ error: 'Failed to check social status' }, { status: 500 })
  }
}

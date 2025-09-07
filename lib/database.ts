import { PrismaClient, Prisma } from '@prisma/client'
import { log } from './logger'
import { NotFoundError, ConflictError } from './errors'

// Extend Prisma client with custom methods
class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    })

    // Log slow queries
    this.$on('query', (e) => {
      if (e.duration > 1000) {
        log.performance.slowQuery(e.query, e.duration)
      }
    })

    this.$on('error', (e) => {
      log.error('Database error', e)
    })
  }

  // Custom methods for common operations
  async findUserByEmail(email: string) {
    return this.user.findUnique({
      where: { email },
      include: {
        accounts: true,
        sessions: true,
        meetings: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        automations: {
          where: { isActive: true },
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  }

  async findUserWithSettings(userId: string) {
    return this.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        automations: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async findMeetingsByUser(userId: string, options: {
    status?: string
    platform?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  } = {}) {
    const {
      status,
      platform,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = options

    const where: Prisma.MeetingWhereInput = {
      userId,
      ...(status && { status }),
      ...(platform && { platform }),
      ...(startDate && { startTime: { gte: startDate } }),
      ...(endDate && { startTime: { lte: endDate } }),
    }

    const [meetings, total] = await Promise.all([
      this.meeting.findMany({
        where,
        include: {
          posts: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.meeting.count({ where }),
    ])

    return {
      meetings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async findUpcomingMeetings(userId: string) {
    return this.meeting.findMany({
      where: {
        userId,
        startTime: { gte: new Date() },
        status: 'scheduled',
      },
      include: {
        posts: true,
      },
      orderBy: { startTime: 'asc' },
    })
  }

  async findPastMeetings(userId: string, limit: number = 20) {
    return this.meeting.findMany({
      where: {
        userId,
        startTime: { lt: new Date() },
        status: { in: ['completed', 'cancelled'] },
      },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { startTime: 'desc' },
      take: limit,
    })
  }

  async createMeetingWithBot(data: Prisma.MeetingCreateInput & {
    botId?: string
    botStatus?: string
  }) {
    const { botId, botStatus, ...meetingData } = data

    return this.meeting.create({
      data: {
        ...meetingData,
        ...(botId && {
          bot: {
            create: {
              botId,
              status: botStatus || 'active',
            },
          },
        }),
      },
      include: {
        bot: true,
        posts: true,
      },
    })
  }

  async updateMeetingWithTranscript(
    meetingId: string,
    transcript: string,
    status: string = 'completed'
  ) {
    return this.meeting.update({
      where: { id: meetingId },
      data: {
        transcript,
        status,
        updatedAt: new Date(),
      },
      include: {
        posts: true,
        bot: true,
      },
    })
  }

  async findAutomationsByUser(userId: string, isActive?: boolean) {
    return this.automation.findMany({
      where: {
        userId,
        ...(isActive !== undefined && { isActive }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createAutomationWithDefaults(data: Prisma.AutomationCreateInput) {
    return this.automation.create({
      data: {
        ...data,
        triggerConditions: data.triggerConditions || {
          meetingEnded: true,
          hasTranscript: true,
          minDuration: 0,
        },
      },
    })
  }

  async findPostsByUser(userId: string, options: {
    platform?: string
    status?: string
    meetingId?: string
    page?: number
    limit?: number
  } = {}) {
    const {
      platform,
      status,
      meetingId,
      page = 1,
      limit = 20,
    } = options

    const where: Prisma.PostWhereInput = {
      meeting: { userId },
      ...(platform && { platform }),
      ...(status && { status }),
      ...(meetingId && { meetingId }),
    }

    const [posts, total] = await Promise.all([
      this.post.findMany({
        where,
        include: {
          meeting: {
            select: {
              id: true,
              title: true,
              startTime: true,
            },
          },
          automation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.post.count({ where }),
    ])

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async createPostWithValidation(data: Prisma.PostCreateInput) {
    // Validate meeting exists and belongs to user
    const meeting = await this.meeting.findFirst({
      where: {
        id: data.meeting.connect?.id,
        userId: data.user?.connect?.id,
      },
    })

    if (!meeting) {
      throw new NotFoundError('Meeting not found')
    }

    return this.post.create({
      data,
      include: {
        meeting: true,
        automation: true,
      },
    })
  }

  async getUserSettings(userId: string) {
    let settings = await this.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      // Create default settings
      settings = await this.userSettings.create({
        data: {
          userId,
          botJoinMinutesBefore: 5,
          defaultAutomationEnabled: true,
          emailNotifications: true,
          socialMediaNotifications: true,
          timezone: 'UTC',
          language: 'en',
        },
      })
    }

    return settings
  }

  async updateUserSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return this.userSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    })
  }

  // Analytics and reporting methods
  async getUserAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.MeetingWhereInput = {
      userId,
      ...(startDate && endDate && {
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      }),
    }

    const [
      totalMeetings,
      completedMeetings,
      totalPosts,
      successfulPosts,
      platformStats,
      automationStats,
    ] = await Promise.all([
      this.meeting.count({ where }),
      this.meeting.count({ where: { ...where, status: 'completed' } }),
      this.post.count({
        where: {
          meeting: { userId },
          ...(startDate && endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
      }),
      this.post.count({
        where: {
          meeting: { userId },
          status: 'posted',
          ...(startDate && endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
      }),
      this.meeting.groupBy({
        by: ['platform'],
        where,
        _count: { platform: true },
      }),
      this.post.groupBy({
        by: ['platform'],
        where: {
          meeting: { userId },
          ...(startDate && endDate && {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        },
        _count: { platform: true },
      }),
    ])

    return {
      meetings: {
        total: totalMeetings,
        completed: completedMeetings,
        completionRate: totalMeetings > 0 ? (completedMeetings / totalMeetings) * 100 : 0,
      },
      posts: {
        total: totalPosts,
        successful: successfulPosts,
        successRate: totalPosts > 0 ? (successfulPosts / totalPosts) * 100 : 0,
      },
      platformStats,
      automationStats,
    }
  }

  // Cleanup methods
  async cleanupExpiredData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    // Delete old failed posts
    await this.post.deleteMany({
      where: {
        status: 'failed',
        createdAt: { lt: thirtyDaysAgo },
      },
    })

    // Delete old cancelled meetings without transcripts
    await this.meeting.deleteMany({
      where: {
        status: 'cancelled',
        transcript: null,
        startTime: { lt: thirtyDaysAgo },
      },
    })

    log.info('Database cleanup completed')
  }
}

// Create and export the extended Prisma client
export const prisma = new ExtendedPrismaClient()

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

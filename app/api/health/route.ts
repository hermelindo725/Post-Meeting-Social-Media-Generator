import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { log } from '@/lib/logger'

interface HealthCheck {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: 'healthy' | 'unhealthy'
    redis?: 'healthy' | 'unhealthy'
    external: {
      openai: 'healthy' | 'unhealthy'
      recall: 'healthy' | 'unhealthy'
      google: 'healthy' | 'unhealthy'
    }
  }
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'unhealthy',
      external: {
        openai: 'unhealthy',
        recall: 'unhealthy',
        google: 'unhealthy',
      },
    },
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
    },
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    healthCheck.services.database = 'healthy'
  } catch (error) {
    healthCheck.services.database = 'unhealthy'
    healthCheck.status = 'unhealthy'
    log.error('Database health check failed', { error })
  }

  // Check Redis connection (if available)
  if (process.env.REDIS_URL) {
    try {
      // Redis check would go here
      healthCheck.services.redis = 'healthy'
    } catch (error) {
      healthCheck.services.redis = 'unhealthy'
      log.error('Redis health check failed', { error })
    }
  }

  // Check external services
  try {
    // OpenAI check
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      })
      healthCheck.services.external.openai = response.ok ? 'healthy' : 'unhealthy'
    }
  } catch (error) {
    healthCheck.services.external.openai = 'unhealthy'
    log.error('OpenAI health check failed', { error })
  }

  try {
    // Recall.ai check
    if (process.env.RECALL_API_KEY) {
      const response = await fetch('https://api.recall.ai/api/v1/bot', {
        headers: {
          'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        },
        signal: AbortSignal.timeout(5000),
      })
      healthCheck.services.external.recall = response.ok ? 'healthy' : 'unhealthy'
    }
  } catch (error) {
    healthCheck.services.external.recall = 'unhealthy'
    log.error('Recall.ai health check failed', { error })
  }

  try {
    // Google API check
    if (process.env.GOOGLE_CLIENT_ID) {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        signal: AbortSignal.timeout(5000),
      })
      healthCheck.services.external.google = response.status === 401 ? 'healthy' : 'unhealthy'
    }
  } catch (error) {
    healthCheck.services.external.google = 'unhealthy'
    log.error('Google API health check failed', { error })
  }

  // Determine overall health status
  const criticalServices = [
    healthCheck.services.database,
    healthCheck.services.external.openai,
    healthCheck.services.external.recall,
  ]

  if (criticalServices.includes('unhealthy')) {
    healthCheck.status = 'unhealthy'
  }

  const responseTime = Date.now() - startTime
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503

  log.info('Health check completed', {
    status: healthCheck.status,
    responseTime,
    services: healthCheck.services,
  })

  return NextResponse.json(healthCheck, { status: statusCode })
}

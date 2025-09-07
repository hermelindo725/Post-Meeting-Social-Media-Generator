// Enterprise Metrics and Monitoring
import { prometheus } from 'prom-client'

// Custom metrics registry
const register = new prometheus.Registry()

// Business metrics
export const meetingMetrics = {
  scheduled: new prometheus.Counter({
    name: 'meetings_scheduled_total',
    help: 'Total number of meetings scheduled',
    labelNames: ['platform', 'user_id'],
    registers: [register]
  }),
  
  completed: new prometheus.Counter({
    name: 'meetings_completed_total',
    help: 'Total number of meetings completed',
    labelNames: ['platform', 'user_id'],
    registers: [register]
  }),
  
  duration: new prometheus.Histogram({
    name: 'meeting_duration_seconds',
    help: 'Duration of meetings in seconds',
    labelNames: ['platform'],
    buckets: [300, 600, 900, 1800, 3600, 7200], // 5min to 2hr
    registers: [register]
  }),
  
  transcriptLength: new prometheus.Histogram({
    name: 'meeting_transcript_length_chars',
    help: 'Length of meeting transcripts in characters',
    labelNames: ['platform'],
    buckets: [1000, 5000, 10000, 25000, 50000, 100000],
    registers: [register]
  })
}

export const contentMetrics = {
  generated: new prometheus.Counter({
    name: 'content_generated_total',
    help: 'Total number of content pieces generated',
    labelNames: ['type', 'platform', 'automation_id'],
    registers: [register]
  }),
  
  generationTime: new prometheus.Histogram({
    name: 'content_generation_duration_seconds',
    help: 'Time taken to generate content',
    labelNames: ['type', 'platform'],
    buckets: [1, 2, 5, 10, 30, 60],
    registers: [register]
  }),
  
  posted: new prometheus.Counter({
    name: 'content_posted_total',
    help: 'Total number of content pieces posted to social media',
    labelNames: ['platform', 'status'],
    registers: [register]
  })
}

export const userMetrics = {
  activeUsers: new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users',
    labelNames: ['time_period'],
    registers: [register]
  }),
  
  socialConnections: new prometheus.Gauge({
    name: 'social_connections_total',
    help: 'Number of social media connections',
    labelNames: ['platform'],
    registers: [register]
  }),
  
  automationsCreated: new prometheus.Counter({
    name: 'automations_created_total',
    help: 'Total number of automations created',
    labelNames: ['platform', 'user_id'],
    registers: [register]
  })
}

export const systemMetrics = {
  apiRequests: new prometheus.Counter({
    name: 'api_requests_total',
    help: 'Total number of API requests',
    labelNames: ['method', 'endpoint', 'status_code'],
    registers: [register]
  }),
  
  apiDuration: new prometheus.Histogram({
    name: 'api_request_duration_seconds',
    help: 'Duration of API requests',
    labelNames: ['method', 'endpoint'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
  }),
  
  databaseConnections: new prometheus.Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
    registers: [register]
  }),
  
  cacheHitRate: new prometheus.Gauge({
    name: 'cache_hit_rate',
    help: 'Cache hit rate percentage',
    labelNames: ['cache_type'],
    registers: [register]
  })
}

export const errorMetrics = {
  errors: new prometheus.Counter({
    name: 'application_errors_total',
    help: 'Total number of application errors',
    labelNames: ['error_type', 'component', 'severity'],
    registers: [register]
  }),
  
  externalApiErrors: new prometheus.Counter({
    name: 'external_api_errors_total',
    help: 'Total number of external API errors',
    labelNames: ['api_name', 'error_code'],
    registers: [register]
  })
}

// Custom business metrics
export class BusinessMetrics {
  private static instance: BusinessMetrics
  
  static getInstance(): BusinessMetrics {
    if (!BusinessMetrics.instance) {
      BusinessMetrics.instance = new BusinessMetrics()
    }
    return BusinessMetrics.instance
  }

  // Track meeting value generation
  trackMeetingValue(meetingId: string, value: number, platform: string): void {
    // Custom metric for business value
    console.log(`Meeting value tracked: ${meetingId} = ${value} (${platform})`)
  }

  // Track content engagement
  trackContentEngagement(postId: string, platform: string, engagement: {
    likes: number
    shares: number
    comments: number
  }): void {
    console.log(`Content engagement tracked: ${postId} on ${platform}`, engagement)
  }

  // Track user productivity
  trackUserProductivity(userId: string, metrics: {
    meetingsPerWeek: number
    contentGenerated: number
    socialPosts: number
  }): void {
    console.log(`User productivity tracked: ${userId}`, metrics)
  }

  // Track ROI metrics
  trackROI(userId: string, metrics: {
    timeSaved: number // in minutes
    contentValue: number
    engagementValue: number
  }): void {
    console.log(`ROI tracked: ${userId}`, metrics)
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Monitor function execution time
  async monitorExecution<T>(
    name: string,
    fn: () => Promise<T>,
    labels: Record<string, string> = {}
  ): Promise<T> {
    const start = Date.now()
    
    try {
      const result = await fn()
      const duration = (Date.now() - start) / 1000
      
      systemMetrics.apiDuration
        .labels({ method: 'FUNCTION', endpoint: name, ...labels })
        .observe(duration)
      
      return result
    } catch (error) {
      const duration = (Date.now() - start) / 1000
      
      errorMetrics.errors
        .labels({ 
          error_type: error.constructor.name, 
          component: name, 
          severity: 'ERROR' 
        })
        .inc()
      
      systemMetrics.apiDuration
        .labels({ method: 'FUNCTION', endpoint: name, ...labels })
        .observe(duration)
      
      throw error
    }
  }

  // Monitor memory usage
  getMemoryUsage(): {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
  } {
    return process.memoryUsage()
  }

  // Monitor CPU usage
  getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage()
      const startTime = Date.now()
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage)
        const endTime = Date.now()
        
        const cpuPercent = (endUsage.user + endUsage.system) / 1000 / (endTime - startTime) * 100
        resolve(cpuPercent)
      }, 100)
    })
  }
}

// Health check system
export class HealthChecker {
  private static instance: HealthChecker
  
  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker()
    }
    return HealthChecker.instance
  }

  async checkDatabase(): Promise<{ status: string; latency: number }> {
    const start = Date.now()
    
    try {
      // Simple database ping
      await prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - start
      
      return { status: 'healthy', latency }
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start }
    }
  }

  async checkExternalAPIs(): Promise<Record<string, { status: string; latency: number }>> {
    const apis = {
      openai: 'https://api.openai.com/v1/models',
      recall: 'https://api.recall.ai/api/v1/bot',
      google: 'https://www.googleapis.com/calendar/v3/users/me/calendarList'
    }

    const results: Record<string, { status: string; latency: number }> = {}

    for (const [name, url] of Object.entries(apis)) {
      const start = Date.now()
      
      try {
        const response = await fetch(url, { method: 'HEAD' })
        const latency = Date.now() - start
        
        results[name] = {
          status: response.ok ? 'healthy' : 'unhealthy',
          latency
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          latency: Date.now() - start
        }
      }
    }

    return results
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    checks: Record<string, any>
    timestamp: Date
  }> {
    const [database, externalAPIs] = await Promise.all([
      this.checkDatabase(),
      this.checkExternalAPIs()
    ])

    const checks = {
      database,
      externalAPIs,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (database.status === 'unhealthy') {
      status = 'unhealthy'
    } else if (Object.values(externalAPIs).some(api => api.status === 'unhealthy')) {
      status = 'degraded'
    }

    return {
      status,
      checks,
      timestamp: new Date()
    }
  }
}

export const businessMetrics = BusinessMetrics.getInstance()
export const performanceMonitor = PerformanceMonitor.getInstance()
export const healthChecker = HealthChecker.getInstance()

// Export metrics registry for Prometheus scraping
export { register as metricsRegister }

// Enterprise Rate Limiting with Redis
import { Redis } from 'ioredis'

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyGenerator?: (req: any) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export class EnterpriseRateLimiter {
  private redis: Redis
  private configs: Map<string, RateLimitConfig> = new Map()

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379')
  }

  addLimit(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config)
  }

  async checkLimit(name: string, identifier: string): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    totalHits: number
  }> {
    const config = this.configs.get(name)
    if (!config) {
      throw new Error(`Rate limit config '${name}' not found`)
    }

    const key = `rate_limit:${name}:${identifier}`
    const window = Math.floor(Date.now() / config.windowMs)
    const windowKey = `${key}:${window}`

    // Use Redis pipeline for atomic operations
    const pipeline = this.redis.pipeline()
    
    // Increment counter
    pipeline.incr(windowKey)
    pipeline.expire(windowKey, Math.ceil(config.windowMs / 1000))
    
    // Get current count
    pipeline.get(windowKey)
    
    const results = await pipeline.exec()
    const currentCount = parseInt(results[2][1] as string) || 0

    const allowed = currentCount <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - currentCount)
    const resetTime = (window + 1) * config.windowMs

    return {
      allowed,
      remaining,
      resetTime,
      totalHits: currentCount
    }
  }

  async resetLimit(name: string, identifier: string): Promise<void> {
    const key = `rate_limit:${name}:${identifier}`
    const pattern = `${key}:*`
    
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  // Advanced rate limiting with sliding window
  async checkSlidingWindowLimit(
    name: string,
    identifier: string,
    windowMs: number,
    maxRequests: number
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
  }> {
    const key = `sliding_rate_limit:${name}:${identifier}`
    const now = Date.now()
    const windowStart = now - windowMs

    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart)

    // Count current requests
    const currentCount = await this.redis.zcard(key)

    if (currentCount >= maxRequests) {
      // Get oldest request to calculate reset time
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES')
      const resetTime = oldestRequest.length > 0 ? 
        parseInt(oldestRequest[1]) + windowMs : now + windowMs

      return {
        allowed: false,
        remaining: 0,
        resetTime
      }
    }

    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`)
    await this.redis.expire(key, Math.ceil(windowMs / 1000))

    return {
      allowed: true,
      remaining: maxRequests - currentCount - 1,
      resetTime: now + windowMs
    }
  }

  // Distributed rate limiting for microservices
  async checkDistributedLimit(
    name: string,
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): Promise<boolean> {
    const key = `distributed_limit:${name}:${identifier}`
    const lockKey = `${key}:lock`
    
    // Try to acquire lock
    const lockAcquired = await this.redis.set(lockKey, '1', 'PX', 1000, 'NX')
    
    if (!lockAcquired) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.checkDistributedLimit(name, identifier, maxRequests, windowMs)
    }

    try {
      const current = await this.redis.get(key)
      const count = current ? parseInt(current) : 0

      if (count >= maxRequests) {
        return false
      }

      // Increment and set expiration
      await this.redis.multi()
        .incr(key)
        .expire(key, Math.ceil(windowMs / 1000))
        .exec()

      return true
    } finally {
      // Release lock
      await this.redis.del(lockKey)
    }
  }
}

// Singleton instance
export const rateLimiter = new EnterpriseRateLimiter()

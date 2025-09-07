import { Redis } from 'ioredis'
import { env, features } from './config'

// In-memory store for development (fallback when Redis is not available)
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const item = this.store.get(key)
    if (!item) return null
    
    if (Date.now() > item.resetTime) {
      this.store.delete(key)
      return null
    }
    
    return item
  }

  async set(key: string, count: number, ttl: number): Promise<void> {
    this.store.set(key, {
      count,
      resetTime: Date.now() + ttl
    })
  }

  async increment(key: string, ttl: number): Promise<number> {
    const item = await this.get(key)
    const count = item ? item.count + 1 : 1
    
    await this.set(key, count, ttl)
    return count
  }
}

// Redis client (if available)
let redis: Redis | null = null
if (features.redis && env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  } catch (error) {
    console.warn('Redis connection failed, falling back to memory store:', error)
  }
}

const memoryStore = new MemoryStore()

// Rate limiter implementation
export const rateLimit = {
  async check(key: string, limit: number, windowMs: number): Promise<void> {
    const ttl = windowMs
    const count = redis 
      ? await redis.incr(key)
      : await memoryStore.increment(key, ttl)
    
    if (count === 1 && redis) {
      await redis.expire(key, Math.ceil(ttl / 1000))
    }
    
    if (count > limit) {
      throw new Error('Rate limit exceeded')
    }
  },

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (redis) {
      const count = await redis.get(key)
      const ttl = await redis.ttl(key)
      
      if (!count) return null
      
      return {
        count: parseInt(count),
        resetTime: Date.now() + (ttl * 1000)
      }
    }
    
    return memoryStore.get(key)
  },

  async reset(key: string): Promise<void> {
    if (redis) {
      await redis.del(key)
    } else {
      memoryStore.store.delete(key)
    }
  }
}

// Rate limiting middleware for different endpoints
export const rateLimiters = {
  api: (limit: number = 100, windowMs: number = 15 * 60 * 1000) => 
    (key: string) => rateLimit.check(key, limit, windowMs),
  
  ai: (limit: number = 10, windowMs: number = 60 * 1000) => 
    (key: string) => rateLimit.check(key, limit, windowMs),
  
  social: (limit: number = 50, windowMs: number = 60 * 60 * 1000) => 
    (key: string) => rateLimit.check(key, limit, windowMs),
  
  auth: (limit: number = 5, windowMs: number = 15 * 60 * 1000) => 
    (key: string) => rateLimit.check(key, limit, windowMs),
}

// Cleanup function for memory store
if (!redis) {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of memoryStore.store.entries()) {
      if (now > value.resetTime) {
        memoryStore.store.delete(key)
      }
    }
  }, 60000) // Clean up every minute
}

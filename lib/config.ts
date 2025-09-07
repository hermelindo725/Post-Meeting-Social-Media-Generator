import { z } from 'zod'

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API Key is required'),
  
  // Recall.ai
  RECALL_API_KEY: z.string().min(1, 'Recall.ai API Key is required'),
  
  // Social Media (Optional)
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  
  // Redis (Optional)
  REDIS_URL: z.string().url().optional(),
  
  // Encryption (Optional)
  MASTER_ENCRYPTION_KEY: z.string().min(32).optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      throw new Error(`Environment validation failed:\n${missingVars.join('\n')}`)
    }
    throw error
  }
}

export const env = parseEnv()

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>

// Feature flags
export const features = {
  linkedin: !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
  facebook: !!(env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET),
  redis: !!env.REDIS_URL,
  encryption: !!env.MASTER_ENCRYPTION_KEY,
} as const

// API endpoints
export const apiEndpoints = {
  google: {
    calendar: 'https://www.googleapis.com/calendar/v3',
    oauth: 'https://oauth2.googleapis.com',
  },
  recall: {
    base: 'https://api.recall.ai/api/v1',
  },
  openai: {
    base: 'https://api.openai.com/v1',
  },
  linkedin: {
    base: 'https://api.linkedin.com/v2',
    oauth: 'https://www.linkedin.com/oauth/v2',
  },
  facebook: {
    base: 'https://graph.facebook.com/v18.0',
    oauth: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
} as const

// Rate limiting configuration
export const rateLimits = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 AI requests per minute
  },
  social: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // limit each user to 50 social posts per hour
  },
} as const

// Security configuration
export const security = {
  cors: {
    origin: env.NODE_ENV === 'production' 
      ? [env.NEXTAUTH_URL] 
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.openai.com", "https://api.recall.ai"],
      },
    },
  },
} as const

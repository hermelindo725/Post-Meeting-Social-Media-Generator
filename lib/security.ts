import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimit } from './rate-limiter'
import { log } from './logger'
import { security } from './config'
import { AuthenticationError, AuthorizationError, RateLimitError } from './errors'

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const key = `rate_limit:${ip}:${request.nextUrl.pathname}`
  
  try {
    await rateLimit.check(key, limit, windowMs)
  } catch (error) {
    log.security.rateLimit(ip, request.nextUrl.pathname)
    throw new RateLimitError('Too many requests')
  }
}

// Authentication middleware
export async function withAuth(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  if (!token) {
    log.security.unauthorized('anonymous', request.nextUrl.pathname)
    throw new AuthenticationError()
  }
  
  return token
}

// Authorization middleware
export async function withAuthAndUser(request: NextRequest) {
  const token = await withAuth(request)
  
  if (!token.sub) {
    throw new AuthenticationError('Invalid token')
  }
  
  return {
    token,
    userId: token.sub,
    userEmail: token.email,
  }
}

// CSRF protection middleware
export function withCSRF(request: NextRequest) {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (!origin && !referer) {
      throw new Error('CSRF: Missing origin/referer')
    }
    
    const allowedOrigins = security.cors.origin
    if (origin && !allowedOrigins.includes(origin)) {
      throw new Error('CSRF: Invalid origin')
    }
  }
}

// Input sanitization middleware
export function sanitizeRequest(request: NextRequest) {
  const url = new URL(request.url)
  
  // Sanitize query parameters
  for (const [key, value] of url.searchParams.entries()) {
    const sanitized = value.replace(/[<>]/g, '')
    url.searchParams.set(key, sanitized)
  }
  
  return new NextRequest(url, request)
}

// Security headers middleware
export function withSecurityHeaders(response: NextResponse) {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

// API route security wrapper
export function withApiSecurity(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    rateLimit?: { limit: number; windowMs: number }
    methods?: string[]
  } = {}
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    try {
      // Method validation
      if (options.methods && !options.methods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        )
      }
      
      // CSRF protection
      withCSRF(request)
      
      // Rate limiting
      if (options.rateLimit) {
        await withRateLimit(request, options.rateLimit.limit, options.rateLimit.windowMs)
      }
      
      // Authentication
      if (options.requireAuth) {
        await withAuth(request)
      }
      
      // Sanitize request
      const sanitizedRequest = sanitizeRequest(request)
      
      // Execute handler
      const response = await handler(sanitizedRequest, context)
      
      // Add security headers
      return withSecurityHeaders(response)
      
    } catch (error) {
      log.api.error(request.method, request.nextUrl.pathname, error)
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Data validation and sanitization
export function validateAndSanitize<T>(
  data: any,
  schema: any,
  options: { stripUnknown?: boolean } = {}
): T {
  const result = schema.parse(data)
  
  // Recursively sanitize strings
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>]/g, '')
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value)
      }
      return sanitized
    }
    return obj
  }
  
  return sanitize(result)
}

// SQL injection prevention
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''")
}

// XSS prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// File upload validation
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}
): void {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options
  
  if (file.size > maxSize) {
    throw new Error('File too large')
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (allowedExtensions.length > 0 && extension && !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }
}

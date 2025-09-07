import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimiters } from './lib/rate-limiter'
import { log } from './lib/logger'
import { security } from './lib/config'

// Rate limiting store (in-memory for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limiting middleware
async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const path = request.nextUrl.pathname
  
  // Different rate limits for different endpoints
  let limit = 100
  let windowMs = 15 * 60 * 1000 // 15 minutes
  
  if (path.startsWith('/api/ai/')) {
    limit = 10
    windowMs = 60 * 1000 // 1 minute
  } else if (path.startsWith('/api/social/')) {
    limit = 50
    windowMs = 60 * 60 * 1000 // 1 hour
  } else if (path.startsWith('/api/auth/')) {
    limit = 5
    windowMs = 15 * 60 * 1000 // 15 minutes
  }
  
  const key = `rate_limit:${ip}:${path}`
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
  } else {
    if (current.count >= limit) {
      log.security.rateLimit(ip, path)
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    current.count++
  }
  
  return null
}

// Authentication middleware
async function authMiddleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // Allow public routes
  const publicRoutes = [
    '/api/auth/',
    '/api/health',
    '/api/webhooks/',
  ]
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isPublicRoute) {
    return null
  }
  
  // Require authentication for API routes
  if (request.nextUrl.pathname.startsWith('/api/') && !token) {
    log.security.unauthorized('anonymous', request.nextUrl.pathname)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  return null
}

// Security headers middleware
function securityHeadersMiddleware(response: NextResponse) {
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
  
  // CORS headers
  const origin = response.headers.get('origin')
  if (origin && security.cors.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  return response
}

// CSRF protection middleware
function csrfMiddleware(request: NextRequest) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null
  }
  
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  if (!origin && !referer) {
    return NextResponse.json(
      { error: 'CSRF: Missing origin/referer' },
      { status: 403 }
    )
  }
  
  const allowedOrigins = security.cors.origin
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: 'CSRF: Invalid origin' },
      { status: 403 }
    )
  }
  
  return null
}

// Input sanitization middleware
function sanitizationMiddleware(request: NextRequest) {
  // Sanitize query parameters
  const url = new URL(request.url)
  for (const [key, value] of url.searchParams.entries()) {
    const sanitized = value.replace(/[<>]/g, '')
    url.searchParams.set(key, sanitized)
  }
  
  // Create new request with sanitized URL
  return new NextRequest(url, request)
}

// Main middleware function
export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Log API requests
    if (request.nextUrl.pathname.startsWith('/api/')) {
      log.api.request(request.method, request.nextUrl.pathname)
    }
    
    // Apply middleware in order
    const sanitizedRequest = sanitizationMiddleware(request)
    
    // CSRF protection
    const csrfError = csrfMiddleware(sanitizedRequest)
    if (csrfError) return csrfError
    
    // Rate limiting
    const rateLimitError = await rateLimitMiddleware(sanitizedRequest)
    if (rateLimitError) return rateLimitError
    
    // Authentication
    const authError = await authMiddleware(sanitizedRequest)
    if (authError) return authError
    
    // Continue with the request
    const response = NextResponse.next()
    
    // Add security headers
    const securedResponse = securityHeadersMiddleware(response)
    
    // Log response
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const duration = Date.now() - startTime
      log.api.response(request.method, request.nextUrl.pathname, 200, duration)
    }
    
    return securedResponse
    
  } catch (error) {
    log.api.error(request.method, request.nextUrl.pathname, error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from './config'

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// Log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// Transports
const transports = [
  // Console transport
  new winston.transports.Console({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
  
  // File transport for errors
  new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d',
  }),
  
  // File transport for all logs
  new DailyRotateFile({
    filename: 'logs/combined-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
  }),
]

// Create logger
const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
})

// Structured logging helpers
export const log = {
  // Basic logging
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // API logging
  api: {
    request: (method: string, url: string, userId?: string) => 
      logger.http(`API Request: ${method} ${url}`, { userId }),
    response: (method: string, url: string, statusCode: number, duration: number, userId?: string) =>
      logger.http(`API Response: ${method} ${url} ${statusCode} (${duration}ms)`, { userId }),
    error: (method: string, url: string, error: any, userId?: string) =>
      logger.error(`API Error: ${method} ${url}`, { error: error.message, stack: error.stack, userId }),
  },
  
  // Authentication logging
  auth: {
    login: (userId: string, provider: string) =>
      logger.info(`User login: ${userId} via ${provider}`, { userId, provider }),
    logout: (userId: string) =>
      logger.info(`User logout: ${userId}`, { userId }),
    failed: (email: string, reason: string) =>
      logger.warn(`Login failed: ${email} - ${reason}`, { email, reason }),
  },
  
  // Meeting logging
  meeting: {
    created: (meetingId: string, userId: string, title: string) =>
      logger.info(`Meeting created: ${meetingId}`, { meetingId, userId, title }),
    updated: (meetingId: string, userId: string, changes: any) =>
      logger.info(`Meeting updated: ${meetingId}`, { meetingId, userId, changes }),
    deleted: (meetingId: string, userId: string) =>
      logger.info(`Meeting deleted: ${meetingId}`, { meetingId, userId }),
    transcript: (meetingId: string, userId: string, success: boolean) =>
      logger.info(`Transcript processed: ${meetingId}`, { meetingId, userId, success }),
  },
  
  // Social media logging
  social: {
    post: (postId: string, userId: string, platform: string, success: boolean) =>
      logger.info(`Social post: ${postId}`, { postId, userId, platform, success }),
    automation: (automationId: string, userId: string, action: string) =>
      logger.info(`Automation ${action}: ${automationId}`, { automationId, userId, action }),
  },
  
  // External service logging
  external: {
    google: (action: string, success: boolean, error?: any) =>
      logger.info(`Google API: ${action}`, { service: 'google', action, success, error: error?.message }),
    openai: (action: string, success: boolean, error?: any) =>
      logger.info(`OpenAI API: ${action}`, { service: 'openai', action, success, error: error?.message }),
    recall: (action: string, success: boolean, error?: any) =>
      logger.info(`Recall API: ${action}`, { service: 'recall', action, success, error: error?.message }),
  },
  
  // Security logging
  security: {
    suspicious: (userId: string, action: string, details: any) =>
      logger.warn(`Suspicious activity: ${userId}`, { userId, action, details }),
    rateLimit: (userId: string, endpoint: string) =>
      logger.warn(`Rate limit exceeded: ${userId}`, { userId, endpoint }),
    unauthorized: (userId: string, resource: string) =>
      logger.warn(`Unauthorized access: ${userId}`, { userId, resource }),
  },
  
  // Performance logging
  performance: {
    slowQuery: (query: string, duration: number) =>
      logger.warn(`Slow query: ${duration}ms`, { query, duration }),
    slowApi: (endpoint: string, duration: number) =>
      logger.warn(`Slow API: ${endpoint} (${duration}ms)`, { endpoint, duration }),
  },
}

export default logger

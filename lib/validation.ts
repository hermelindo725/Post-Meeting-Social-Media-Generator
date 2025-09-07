import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  email: z.string().email('Invalid email format'),
  url: z.string().url('Invalid URL format'),
  dateTime: z.string().datetime('Invalid datetime format'),
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonEmptyString: z.string().min(1, 'String cannot be empty'),
  optionalString: z.string().optional(),
  platform: z.enum(['linkedin', 'facebook', 'twitter', 'instagram']),
  meetingPlatform: z.enum(['zoom', 'teams', 'google-meet', 'webex', 'other']),
  automationType: z.enum(['Generate post', 'Send email', 'Create task']),
  postStatus: z.enum(['draft', 'scheduled', 'posted', 'failed']),
  meetingStatus: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
}

// User validation schemas
export const userSchemas = {
  create: z.object({
    email: commonSchemas.email,
    name: commonSchemas.nonEmptyString,
    image: commonSchemas.url.optional(),
  }),
  
  update: z.object({
    name: commonSchemas.nonEmptyString.optional(),
    image: commonSchemas.url.optional(),
  }),
}

// Meeting validation schemas
export const meetingSchemas = {
  create: z.object({
    title: commonSchemas.nonEmptyString,
    startTime: commonSchemas.dateTime,
    endTime: commonSchemas.dateTime,
    platform: commonSchemas.meetingPlatform,
    meetingUrl: commonSchemas.url,
    attendees: z.array(commonSchemas.nonEmptyString).min(1, 'At least one attendee required'),
    description: commonSchemas.optionalString,
  }),
  
  update: z.object({
    title: commonSchemas.nonEmptyString.optional(),
    startTime: commonSchemas.dateTime.optional(),
    endTime: commonSchemas.dateTime.optional(),
    platform: commonSchemas.meetingPlatform.optional(),
    meetingUrl: commonSchemas.url.optional(),
    attendees: z.array(commonSchemas.nonEmptyString).optional(),
    description: commonSchemas.optionalString,
    transcript: commonSchemas.optionalString,
    status: commonSchemas.meetingStatus.optional(),
  }),
  
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: commonSchemas.meetingStatus.optional(),
    platform: commonSchemas.meetingPlatform.optional(),
    startDate: commonSchemas.dateTime.optional(),
    endDate: commonSchemas.dateTime.optional(),
  }),
}

// Automation validation schemas
export const automationSchemas = {
  create: z.object({
    name: commonSchemas.nonEmptyString,
    type: commonSchemas.automationType,
    platform: commonSchemas.platform,
    description: commonSchemas.optionalString,
    isActive: z.boolean().default(true),
    triggerConditions: z.object({
      meetingEnded: z.boolean().default(true),
      hasTranscript: z.boolean().default(true),
      minDuration: z.number().int().min(0).default(0), // in minutes
    }).optional(),
    contentTemplate: commonSchemas.optionalString,
  }),
  
  update: z.object({
    name: commonSchemas.nonEmptyString.optional(),
    type: commonSchemas.automationType.optional(),
    platform: commonSchemas.platform.optional(),
    description: commonSchemas.optionalString,
    isActive: z.boolean().optional(),
    triggerConditions: z.object({
      meetingEnded: z.boolean().optional(),
      hasTranscript: z.boolean().optional(),
      minDuration: z.number().int().min(0).optional(),
    }).optional(),
    contentTemplate: commonSchemas.optionalString,
  }),
}

// Social media post validation schemas
export const postSchemas = {
  create: z.object({
    content: commonSchemas.nonEmptyString.max(2000, 'Content too long'),
    platform: commonSchemas.platform,
    meetingId: commonSchemas.id,
    automationId: commonSchemas.id.optional(),
    scheduledFor: commonSchemas.dateTime.optional(),
    status: commonSchemas.postStatus.default('draft'),
  }),
  
  update: z.object({
    content: commonSchemas.nonEmptyString.max(2000, 'Content too long').optional(),
    platform: commonSchemas.platform.optional(),
    status: commonSchemas.postStatus.optional(),
    scheduledFor: commonSchemas.dateTime.optional(),
  }),
  
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    platform: commonSchemas.platform.optional(),
    status: commonSchemas.postStatus.optional(),
    meetingId: commonSchemas.id.optional(),
  }),
}

// Settings validation schemas
export const settingsSchemas = {
  update: z.object({
    botJoinMinutesBefore: z.number().int().min(0).max(60).default(5),
    defaultAutomationEnabled: z.boolean().default(true),
    emailNotifications: z.boolean().default(true),
    socialMediaNotifications: z.boolean().default(true),
    timezone: z.string().default('UTC'),
    language: z.string().default('en'),
  }),
}

// API request validation schemas
export const apiSchemas = {
  toggleNotetaker: z.object({
    eventId: commonSchemas.nonEmptyString,
    enabled: z.boolean(),
  }),
  
  generateEmail: z.object({
    meetingId: commonSchemas.id,
    recipients: z.array(commonSchemas.email).min(1, 'At least one recipient required'),
    subject: commonSchemas.optionalString,
    includeActionItems: z.boolean().default(true),
    includeTranscript: z.boolean().default(false),
  }),
  
  generateSocialPost: z.object({
    meetingId: commonSchemas.id,
    platform: commonSchemas.platform,
    automationId: commonSchemas.id.optional(),
    tone: z.enum(['professional', 'casual', 'friendly']).default('professional'),
    includeHashtags: z.boolean().default(true),
    maxLength: z.number().int().min(50).max(2000).default(280),
  }),
  
  webhook: z.object({
    event: z.string(),
    data: z.record(z.any()),
    timestamp: z.string(),
    signature: z.string().optional(),
  }),
}

// Calendar event validation
export const calendarSchemas = {
  event: z.object({
    id: commonSchemas.nonEmptyString,
    summary: commonSchemas.nonEmptyString,
    start: z.object({
      dateTime: commonSchemas.dateTime.optional(),
      date: z.string().optional(),
    }),
    end: z.object({
      dateTime: commonSchemas.dateTime.optional(),
      date: z.string().optional(),
    }),
    attendees: z.array(z.object({
      email: commonSchemas.email,
      displayName: commonSchemas.optionalString,
      responseStatus: z.enum(['needsAction', 'declined', 'tentative', 'accepted']).optional(),
    })).optional(),
    hangoutLink: commonSchemas.url.optional(),
    description: commonSchemas.optionalString,
    location: commonSchemas.optionalString,
  }),
}

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }))
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`)
    }
    throw error
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const data = Object.fromEntries(searchParams.entries())
  return validateInput(schema, data)
}

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeSql(input: string): string {
  return input.replace(/'/g, "''")
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255)
}

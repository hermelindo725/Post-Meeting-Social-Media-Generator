// Domain Events for Enterprise Architecture
import { DomainEvent } from './event-bus'

export class MeetingScheduledEvent implements DomainEvent {
  id: string
  type = 'MeetingScheduled'
  aggregateId: string
  aggregateType = 'Meeting'
  version: number
  timestamp: Date
  data: {
    title: string
    startTime: Date
    endTime: Date
    platform: string
    meetingUrl?: string
    attendees: string[]
  }
  metadata?: {
    userId?: string
    correlationId?: string
    causationId?: string
  }

  constructor(aggregateId: string, data: any, metadata?: any) {
    this.id = `meeting-scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = aggregateId
    this.version = 1
    this.timestamp = new Date()
    this.data = data
    this.metadata = metadata
  }
}

export class MeetingCompletedEvent implements DomainEvent {
  id: string
  type = 'MeetingCompleted'
  aggregateId: string
  aggregateType = 'Meeting'
  version: number
  timestamp: Date
  data: {
    transcript: string
    duration: number
    participants: string[]
  }
  metadata?: {
    userId?: string
    correlationId?: string
    causationId?: string
  }

  constructor(aggregateId: string, data: any, metadata?: any) {
    this.id = `meeting-completed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = aggregateId
    this.version = 1
    this.timestamp = new Date()
    this.data = data
    this.metadata = metadata
  }
}

export class ContentGeneratedEvent implements DomainEvent {
  id: string
  type = 'ContentGenerated'
  aggregateId: string
  aggregateType = 'Post'
  version: number
  timestamp: Date
  data: {
    content: string
    platform: string
    automationId: string
    meetingId: string
  }
  metadata?: {
    userId?: string
    correlationId?: string
    causationId?: string
  }

  constructor(aggregateId: string, data: any, metadata?: any) {
    this.id = `content-generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = aggregateId
    this.version = 1
    this.timestamp = new Date()
    this.data = data
    this.metadata = metadata
  }
}

export class SocialMediaPostedEvent implements DomainEvent {
  id: string
  type = 'SocialMediaPosted'
  aggregateId: string
  aggregateType = 'Post'
  version: number
  timestamp: Date
  data: {
    platform: string
    postId: string
    content: string
    engagement?: {
      likes?: number
      shares?: number
      comments?: number
    }
  }
  metadata?: {
    userId?: string
    correlationId?: string
    causationId?: string
  }

  constructor(aggregateId: string, data: any, metadata?: any) {
    this.id = `social-posted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.aggregateId = aggregateId
    this.version = 1
    this.timestamp = new Date()
    this.data = data
    this.metadata = metadata
  }
}

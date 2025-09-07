// Enterprise Audit Logging System
import { prisma } from '../prisma'

export interface AuditEvent {
  id: string
  userId: string
  action: string
  resource: string
  resourceId: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  result: 'SUCCESS' | 'FAILURE'
  errorMessage?: string
}

export class AuditLogger {
  private static instance: AuditLogger
  private queue: AuditEvent[] = []
  private batchSize = 100
  private flushInterval = 5000 // 5 seconds

  private constructor() {
    // Start batch processing
    setInterval(() => this.flush(), this.flushInterval)
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    this.queue.push(auditEvent)

    // Flush immediately if queue is full
    if (this.queue.length >= this.batchSize) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return

    const events = [...this.queue]
    this.queue = []

    try {
      // Store in database
      await prisma.auditLog.createMany({
        data: events.map(event => ({
          id: event.id,
          userId: event.userId,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          timestamp: event.timestamp,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata,
          result: event.result,
          errorMessage: event.errorMessage
        }))
      })

      // Send to external SIEM systems
      await this.sendToSIEM(events)
      
      console.log(`Audit log flushed: ${events.length} events`)
    } catch (error) {
      console.error('Failed to flush audit logs:', error)
      // Re-queue failed events
      this.queue.unshift(...events)
    }
  }

  private async sendToSIEM(events: AuditEvent[]): Promise<void> {
    // Integration with Splunk, ELK Stack, or other SIEM systems
    console.log('Sending audit events to SIEM:', events.length)
  }

  // Compliance reporting
  async generateComplianceReport(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<any> {
    const where: any = {
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    }

    if (userId) {
      where.userId = userId
    }

    const events = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    })

    return {
      period: { startDate, endDate },
      totalEvents: events.length,
      successRate: events.filter(e => e.result === 'SUCCESS').length / events.length,
      topActions: this.getTopActions(events),
      topResources: this.getTopResources(events),
      events
    }
  }

  private getTopActions(events: AuditEvent[]): Array<{ action: string; count: number }> {
    const actionCounts = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private getTopResources(events: AuditEvent[]): Array<{ resource: string; count: number }> {
    const resourceCounts = events.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }
}

export const auditLogger = AuditLogger.getInstance()

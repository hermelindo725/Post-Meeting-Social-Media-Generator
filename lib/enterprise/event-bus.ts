// Enterprise Event Bus for Microservices Communication
import { EventEmitter } from 'events'

export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  version: number
  timestamp: Date
  data: any
  metadata?: {
    userId?: string
    correlationId?: string
    causationId?: string
  }
}

export interface EventHandler<T = any> {
  handle(event: T): Promise<void>
}

export class EnterpriseEventBus extends EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map()
  private eventStore: DomainEvent[] = []
  private maxRetries = 3
  private retryDelay = 1000

  constructor() {
    super()
    this.setMaxListeners(100)
  }

  async publish(event: DomainEvent): Promise<void> {
    try {
      // Store event for audit and replay
      this.eventStore.push(event)
      
      // Emit to local handlers
      this.emit(event.type, event)
      
      // Publish to external systems (Redis, RabbitMQ, etc.)
      await this.publishToExternalSystems(event)
      
      console.log(`Event published: ${event.type} for ${event.aggregateType}:${event.aggregateId}`)
    } catch (error) {
      console.error('Failed to publish event:', error)
      throw error
    }
  }

  subscribe<T = any>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    this.handlers.get(eventType)!.push(handler)
    
    this.on(eventType, async (event: DomainEvent) => {
      await this.handleEventWithRetry(event, handler)
    })
  }

  private async handleEventWithRetry(event: DomainEvent, handler: EventHandler): Promise<void> {
    let attempts = 0
    
    while (attempts < this.maxRetries) {
      try {
        await handler.handle(event)
        return
      } catch (error) {
        attempts++
        console.error(`Event handler failed (attempt ${attempts}):`, error)
        
        if (attempts < this.maxRetries) {
          await this.delay(this.retryDelay * attempts)
        } else {
          // Dead letter queue for failed events
          await this.sendToDeadLetterQueue(event, error)
        }
      }
    }
  }

  private async publishToExternalSystems(event: DomainEvent): Promise<void> {
    // Integration with external message brokers
    // This would connect to Redis, RabbitMQ, or cloud services
    console.log('Publishing to external systems:', event.type)
  }

  private async sendToDeadLetterQueue(event: DomainEvent, error: any): Promise<void> {
    console.error('Sending to dead letter queue:', { event, error })
    // Implement dead letter queue logic
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Event sourcing capabilities
  getEventsForAggregate(aggregateId: string, aggregateType: string): DomainEvent[] {
    return this.eventStore.filter(
      event => event.aggregateId === aggregateId && event.aggregateType === aggregateType
    )
  }

  // Replay events for rebuilding state
  async replayEvents(aggregateId: string, aggregateType: string): Promise<void> {
    const events = this.getEventsForAggregate(aggregateId, aggregateType)
    
    for (const event of events) {
      this.emit(event.type, event)
    }
  }
}

// Singleton instance
export const eventBus = new EnterpriseEventBus()

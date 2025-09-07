// Enterprise Integration Connectors
import { WebClient } from '@slack/web-api'
import { Client } from '@microsoft/microsoft-graph-client'
import axios from 'axios'

export interface IntegrationConfig {
  type: 'slack' | 'teams' | 'salesforce' | 'hubspot' | 'zapier'
  credentials: any
  settings: any
}

export class SlackConnector {
  private client: WebClient

  constructor(token: string) {
    this.client = new WebClient(token)
  }

  async sendMeetingNotification(meeting: any): Promise<void> {
    const message = {
      channel: '#meetings',
      text: `New meeting scheduled: ${meeting.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${meeting.title}*\n📅 ${new Date(meeting.startTime).toLocaleString()}\n👥 ${meeting.attendees?.length || 0} attendees\n🔗 ${meeting.platform}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Details'
              },
              url: `${process.env.NEXTAUTH_URL}/meetings/${meeting.id}`
            }
          ]
        }
      ]
    }

    await this.client.chat.postMessage(message)
  }

  async sendContentNotification(content: any): Promise<void> {
    const message = {
      channel: '#content',
      text: `New content generated for ${content.platform}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*New ${content.platform} post generated*\n\n${content.content.substring(0, 200)}...`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Approve & Post'
              },
              style: 'primary',
              action_id: 'approve_post',
              value: content.id
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Edit'
              },
              action_id: 'edit_post',
              value: content.id
            }
          ]
        }
      ]
    }

    await this.client.chat.postMessage(message)
  }

  async createWorkflow(workflow: any): Promise<void> {
    // Create Slack workflow for content approval
    const workflowDefinition = {
      name: 'Content Approval Workflow',
      steps: [
        {
          type: 'approval',
          name: 'Content Review',
          approvers: workflow.approvers
        },
        {
          type: 'action',
          name: 'Post to Social Media',
          action: 'post_content'
        }
      ]
    }

    // Implementation would depend on Slack Workflow Builder API
    console.log('Creating Slack workflow:', workflowDefinition)
  }
}

export class MicrosoftTeamsConnector {
  private client: Client

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken)
      }
    })
  }

  async sendMeetingCard(meeting: any): Promise<void> {
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
              {
                type: 'TextBlock',
                text: meeting.title,
                weight: 'Bolder',
                size: 'Medium'
              },
              {
                type: 'TextBlock',
                text: `📅 ${new Date(meeting.startTime).toLocaleString()}`,
                spacing: 'None'
              },
              {
                type: 'TextBlock',
                text: `👥 ${meeting.attendees?.length || 0} attendees`,
                spacing: 'None'
              },
              {
                type: 'TextBlock',
                text: `🔗 ${meeting.platform}`,
                spacing: 'None'
              }
            ],
            actions: [
              {
                type: 'Action.OpenUrl',
                title: 'View Details',
                url: `${process.env.NEXTAUTH_URL}/meetings/${meeting.id}`
              }
            ]
          }
        }
      ]
    }

    await this.client.api('/teams/{team-id}/channels/{channel-id}/messages').post(card)
  }

  async createApprovalFlow(content: any): Promise<void> {
    const approvalCard = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
              {
                type: 'TextBlock',
                text: 'Content Approval Required',
                weight: 'Bolder',
                size: 'Medium'
              },
              {
                type: 'TextBlock',
                text: `Platform: ${content.platform}`,
                spacing: 'None'
              },
              {
                type: 'TextBlock',
                text: content.content.substring(0, 200) + '...',
                wrap: true
              }
            ],
            actions: [
              {
                type: 'Action.Submit',
                title: 'Approve',
                data: { action: 'approve', contentId: content.id }
              },
              {
                type: 'Action.Submit',
                title: 'Reject',
                data: { action: 'reject', contentId: content.id }
              }
            ]
          }
        }
      ]
    }

    // Send to approval channel
    await this.client.api('/teams/{team-id}/channels/{approval-channel-id}/messages').post(approvalCard)
  }
}

export class SalesforceConnector {
  private accessToken: string
  private instanceUrl: string

  constructor(accessToken: string, instanceUrl: string) {
    this.accessToken = accessToken
    this.instanceUrl = instanceUrl
  }

  async createMeetingRecord(meeting: any): Promise<string> {
    const meetingData = {
      Subject: meeting.title,
      StartDateTime: new Date(meeting.startTime).toISOString(),
      EndDateTime: new Date(meeting.endTime).toISOString(),
      Location: meeting.platform,
      Description: `Meeting URL: ${meeting.meetingUrl}\nAttendees: ${meeting.attendees?.join(', ')}`,
      Type: 'Meeting',
      Status: 'Completed'
    }

    const response = await axios.post(
      `${this.instanceUrl}/services/data/v58.0/sobjects/Event`,
      meetingData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.id
  }

  async createLeadFromMeeting(meeting: any, clientInfo: any): Promise<string> {
    const leadData = {
      FirstName: clientInfo.firstName,
      LastName: clientInfo.lastName,
      Email: clientInfo.email,
      Company: clientInfo.company,
      LeadSource: 'Meeting',
      Description: `Generated from meeting: ${meeting.title}\nMeeting Date: ${new Date(meeting.startTime).toLocaleDateString()}`,
      Status: 'New'
    }

    const response = await axios.post(
      `${this.instanceUrl}/services/data/v58.0/sobjects/Lead`,
      leadData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.id
  }

  async updateOpportunity(opportunityId: string, meeting: any): Promise<void> {
    const updateData = {
      Description: `Latest meeting: ${meeting.title} on ${new Date(meeting.startTime).toLocaleDateString()}`,
      LastActivityDate: new Date().toISOString()
    }

    await axios.patch(
      `${this.instanceUrl}/services/data/v58.0/sobjects/Opportunity/${opportunityId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export class HubSpotConnector {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  async createMeetingActivity(meeting: any): Promise<string> {
    const activityData = {
      eventTypeId: 'MEETING',
      eventName: meeting.title,
      startTime: new Date(meeting.startTime).getTime(),
      endTime: new Date(meeting.endTime).getTime(),
      description: `Meeting on ${meeting.platform}\nAttendees: ${meeting.attendees?.join(', ')}`
    }

    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/meetings',
      activityData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.id
  }

  async createContact(clientInfo: any): Promise<string> {
    const contactData = {
      properties: {
        firstname: clientInfo.firstName,
        lastname: clientInfo.lastName,
        email: clientInfo.email,
        company: clientInfo.company,
        lead_status: 'NEW'
      }
    }

    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      contactData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.id
  }

  async createDeal(dealInfo: any): Promise<string> {
    const dealData = {
      properties: {
        dealname: dealInfo.name,
        amount: dealInfo.amount,
        dealstage: 'appointmentscheduled',
        closedate: dealInfo.closeDate,
        pipeline: 'default'
      }
    }

    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/deals',
      dealData,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.id
  }
}

export class ZapierConnector {
  private webhookUrl: string

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl
  }

  async triggerMeetingWorkflow(meeting: any): Promise<void> {
    const payload = {
      event: 'meeting_completed',
      data: {
        meetingId: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        platform: meeting.platform,
        attendees: meeting.attendees,
        transcript: meeting.transcript
      }
    }

    await axios.post(this.webhookUrl, payload)
  }

  async triggerContentWorkflow(content: any): Promise<void> {
    const payload = {
      event: 'content_generated',
      data: {
        contentId: content.id,
        platform: content.platform,
        content: content.content,
        meetingId: content.meetingId,
        automationId: content.automationId
      }
    }

    await axios.post(this.webhookUrl, payload)
  }
}

// Integration Manager
export class IntegrationManager {
  private integrations: Map<string, any> = new Map()

  registerIntegration(name: string, config: IntegrationConfig): void {
    switch (config.type) {
      case 'slack':
        this.integrations.set(name, new SlackConnector(config.credentials.token))
        break
      case 'teams':
        this.integrations.set(name, new MicrosoftTeamsConnector(config.credentials.accessToken))
        break
      case 'salesforce':
        this.integrations.set(name, new SalesforceConnector(
          config.credentials.accessToken,
          config.credentials.instanceUrl
        ))
        break
      case 'hubspot':
        this.integrations.set(name, new HubSpotConnector(config.credentials.accessToken))
        break
      case 'zapier':
        this.integrations.set(name, new ZapierConnector(config.credentials.webhookUrl))
        break
    }
  }

  getIntegration(name: string): any {
    return this.integrations.get(name)
  }

  async notifyMeetingCompleted(meeting: any): Promise<void> {
    const promises = []

    for (const [name, integration] of this.integrations) {
      if (integration.sendMeetingNotification) {
        promises.push(integration.sendMeetingNotification(meeting))
      }
      if (integration.triggerMeetingWorkflow) {
        promises.push(integration.triggerMeetingWorkflow(meeting))
      }
    }

    await Promise.allSettled(promises)
  }

  async notifyContentGenerated(content: any): Promise<void> {
    const promises = []

    for (const [name, integration] of this.integrations) {
      if (integration.sendContentNotification) {
        promises.push(integration.sendContentNotification(content))
      }
      if (integration.triggerContentWorkflow) {
        promises.push(integration.triggerContentWorkflow(content))
      }
    }

    await Promise.allSettled(promises)
  }
}

export const integrationManager = new IntegrationManager()

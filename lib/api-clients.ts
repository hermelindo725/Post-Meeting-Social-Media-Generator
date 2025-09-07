import { env, apiEndpoints } from './config'
import { log } from './logger'
import { ExternalServiceError } from './errors'

// Base API client class
abstract class BaseApiClient {
  protected baseURL: string
  protected apiKey: string
  protected timeout: number = 30000

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.timeout),
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      log.external[this.constructor.name.toLowerCase()]('request', true)
      
      return data
    } catch (error) {
      const duration = Date.now() - startTime
      log.external[this.constructor.name.toLowerCase()]('request', false, error)
      
      if (error instanceof Error) {
        throw new ExternalServiceError(this.constructor.name, error.message)
      }
      throw error
    }
  }
}

// Google Calendar API client
export class GoogleCalendarClient extends BaseApiClient {
  constructor(accessToken: string) {
    super(apiEndpoints.google.calendar, accessToken)
  }

  async getEvents(timeMin?: string, timeMax?: string, maxResults: number = 100) {
    const params = new URLSearchParams({
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    })

    return this.request(`/calendars/primary/events?${params}`)
  }

  async getEvent(eventId: string) {
    return this.request(`/calendars/primary/events/${eventId}`)
  }
}

// OpenAI API client
export class OpenAIClient extends BaseApiClient {
  constructor() {
    super(apiEndpoints.openai.base, env.OPENAI_API_KEY)
  }

  async generateContent(prompt: string, options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}) {
    const {
      model = 'gpt-3.5-turbo',
      maxTokens = 1000,
      temperature = 0.7
    } = options

    return this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
      }),
    })
  }

  async generateSocialPost(transcript: string, platform: 'linkedin' | 'facebook', tone: 'professional' | 'casual' = 'professional') {
    const prompt = `Generate a ${tone} ${platform} post based on this meeting transcript. 
    Make it engaging, include relevant hashtags, and keep it under 280 characters for LinkedIn or 500 for Facebook.
    
    Transcript: ${transcript}
    
    Requirements:
    - Include 2-3 relevant hashtags
    - Make it engaging and professional
    - Highlight key insights or achievements
    - Use appropriate emojis sparingly
    - Platform: ${platform}
    - Tone: ${tone}`

    const response = await this.generateContent(prompt, {
      model: 'gpt-3.5-turbo',
      maxTokens: 200,
      temperature: 0.8,
    })

    return response.choices[0]?.message?.content || ''
  }

  async generateEmailSummary(transcript: string, recipients: string[]) {
    const prompt = `Generate a professional email summary of this meeting for the following recipients: ${recipients.join(', ')}.
    
    Transcript: ${transcript}
    
    Requirements:
    - Professional tone
    - Include key decisions and action items
    - Mention next steps
    - Keep it concise but comprehensive
    - Use proper email format`

    const response = await this.generateContent(prompt, {
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.6,
    })

    return response.choices[0]?.message?.content || ''
  }
}

// Recall.ai API client
export class RecallClient extends BaseApiClient {
  constructor() {
    super(apiEndpoints.recall.base, env.RECALL_API_KEY)
  }

  async createBot(meetingUrl: string, options: {
    botName?: string
    transcriptionOptions?: {
      provider?: string
      language?: string
    }
  } = {}) {
    const {
      botName = 'Meeting Notetaker',
      transcriptionOptions = { provider: 'deepgram', language: 'en' }
    } = options

    return this.request('/bot', {
      method: 'POST',
      body: JSON.stringify({
        bot_name: botName,
        meeting_url: meetingUrl,
        transcription_options: transcriptionOptions,
        real_time_transcription: {
          destination_url: `${env.NEXTAUTH_URL}/api/webhooks/recall`,
        },
      }),
    })
  }

  async getBot(botId: string) {
    return this.request(`/bot/${botId}`)
  }

  async getBotTranscript(botId: string) {
    return this.request(`/bot/${botId}/transcript`)
  }

  async deleteBot(botId: string) {
    return this.request(`/bot/${botId}`, {
      method: 'DELETE',
    })
  }
}

// LinkedIn API client
export class LinkedInClient extends BaseApiClient {
  constructor(accessToken: string) {
    super(apiEndpoints.linkedin.base, accessToken)
  }

  async postUpdate(text: string) {
    return this.request('/ugcPosts', {
      method: 'POST',
      body: JSON.stringify({
        author: 'urn:li:person:YOUR_PERSON_URN', // This needs to be fetched from user profile
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    })
  }

  async getUserProfile() {
    return this.request('/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))')
  }
}

// Facebook API client
export class FacebookClient extends BaseApiClient {
  constructor(accessToken: string) {
    super(apiEndpoints.facebook.base, accessToken)
  }

  async postToPage(pageId: string, message: string) {
    return this.request(`/${pageId}/feed`, {
      method: 'POST',
      body: JSON.stringify({
        message,
        access_token: this.apiKey,
      }),
    })
  }

  async getUserPages() {
    return this.request('/me/accounts')
  }
}

// Factory function to create API clients
export const createApiClients = {
  googleCalendar: (accessToken: string) => new GoogleCalendarClient(accessToken),
  openai: () => new OpenAIClient(),
  recall: () => new RecallClient(),
  linkedin: (accessToken: string) => new LinkedInClient(accessToken),
  facebook: (accessToken: string) => new FacebookClient(accessToken),
}

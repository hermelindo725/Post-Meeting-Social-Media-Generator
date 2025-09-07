import axios from 'axios'

const RECALL_API_BASE = 'https://api.recall.ai/api/v1'

export interface RecallBot {
  id: string
  bot_name: string
  meeting_url: string
  status: string
  meeting_metadata?: {
    title?: string
    start_time?: string
    end_time?: string
  }
}

export interface RecallMedia {
  id: string
  bot_id: string
  meeting_url: string
  status: string
  transcript?: {
    id: string
    status: string
    transcript?: string
  }
}

export async function createRecallBot(meetingUrl: string, meetingTitle: string, startTime: string): Promise<RecallBot> {
  const response = await axios.post(`${RECALL_API_BASE}/bot`, {
    bot_name: `Meeting Bot - ${meetingTitle}`,
    meeting_url: meetingUrl,
    meeting_metadata: {
      title: meetingTitle,
      start_time: startTime
    }
  }, {
    headers: {
      'Authorization': `Token ${process.env.RECALL_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  
  return response.data
}

export async function getRecallBot(botId: string): Promise<RecallBot> {
  const response = await axios.get(`${RECALL_API_BASE}/bot/${botId}`, {
    headers: {
      'Authorization': `Token ${process.env.RECALL_API_KEY}`
    }
  })
  
  return response.data
}

export async function getRecallMedia(botId: string): Promise<RecallMedia[]> {
  const response = await axios.get(`${RECALL_API_BASE}/media`, {
    headers: {
      'Authorization': `Token ${process.env.RECALL_API_KEY}`
    },
    params: {
      bot_id: botId
    }
  })
  
  return response.data.results || []
}

export async function getRecallTranscript(mediaId: string): Promise<string> {
  const response = await axios.get(`${RECALL_API_BASE}/media/${mediaId}/transcript`, {
    headers: {
      'Authorization': `Token ${process.env.RECALL_API_KEY}`
    }
  })
  
  return response.data.transcript || ''
}

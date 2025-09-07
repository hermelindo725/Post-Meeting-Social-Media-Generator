import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

export async function getGoogleCalendarClient(accessToken: string) {
  const auth = new OAuth2Client()
  auth.setCredentials({ access_token: accessToken })
  
  return google.calendar({ version: 'v3', auth })
}

export async function getUpcomingEvents(accessToken: string, maxResults: number = 10) {
  const calendar = await getGoogleCalendarClient(accessToken)
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  })

  return response.data.items || []
}

export function extractMeetingUrl(event: any): string | null {
  const description = event.description || ''
  const location = event.location || ''
  const hangoutLink = event.hangoutLink || ''
  
  // Check for various meeting URL patterns
  const urlPatterns = [
    /https:\/\/zoom\.us\/j\/\d+/,
    /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\/]+/,
    /https:\/\/meet\.google\.com\/[a-z-]+/,
    /https:\/\/us\d+\.web\.zoom\.us\/j\/\d+/,
  ]
  
  const textToSearch = `${description} ${location} ${hangoutLink}`
  
  for (const pattern of urlPatterns) {
    const match = textToSearch.match(pattern)
    if (match) {
      return match[0]
    }
  }
  
  return hangoutLink || null
}

export function detectPlatform(meetingUrl: string): string {
  if (meetingUrl.includes('zoom.us')) return 'zoom'
  if (meetingUrl.includes('teams.microsoft.com')) return 'teams'
  if (meetingUrl.includes('meet.google.com')) return 'google-meet'
  return 'unknown'
}

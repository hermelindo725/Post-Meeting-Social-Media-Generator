'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, Clock, Users, Video, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface CalendarEvent {
  id: string
  summary: string
  start: {
    dateTime: string
  }
  end: {
    dateTime: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  hangoutLink?: string
  description?: string
  location?: string
}


export default function UpcomingMeetings() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [enabledMeetings, setEnabledMeetings] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session) {
      fetchUpcomingEvents()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events')
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch calendar events')
    } finally {
      setLoading(false)
    }
  }

  const toggleMeetingNotetaker = async (eventId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/meetings/toggle-notetaker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          enabled,
        }),
      })

      if (response.ok) {
        if (enabled) {
          setEnabledMeetings(prev => new Set([...prev, eventId]))
          toast.success('Notetaker enabled for this meeting')
        } else {
          setEnabledMeetings(prev => {
            const newSet = new Set(prev)
            newSet.delete(eventId)
            return newSet
          })
          toast.success('Notetaker disabled for this meeting')
        }
      } else {
        toast.error('Failed to update notetaker setting')
      }
    } catch (error) {
      console.error('Error toggling notetaker:', error)
      toast.error('Failed to update notetaker setting')
    }
  }

  const getPlatformIcon = (event: CalendarEvent) => {
    const url = event.hangoutLink || event.description || event.location || ''
    if (url.includes('zoom.us')) return '🔵'
    if (url.includes('teams.microsoft.com')) return '🔷'
    if (url.includes('meet.google.com')) return '🟢'
    return '📹'
  }

  const getPlatformName = (event: CalendarEvent) => {
    const url = event.hangoutLink || event.description || event.location || ''
    if (url.includes('zoom.us')) return 'Zoom'
    if (url.includes('teams.microsoft.com')) return 'Teams'
    if (url.includes('meet.google.com')) return 'Google Meet'
    return 'Video Call'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Meetings</h2>
          <button
            onClick={fetchUpcomingEvents}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming meetings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your upcoming calendar events will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const isEnabled = enabledMeetings.has(event.id)
              const startTime = new Date(event.start.dateTime)
              const endTime = new Date(event.end.dateTime)
              
              return (
                <div
                  key={event.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{getPlatformIcon(event)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.summary}
                        </h3>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Video className="h-4 w-4" />
                          <span>{getPlatformName(event)}</span>
                        </div>
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{event.attendees.length} attendees</span>
                          </div>
                        )}
                      </div>

                      {event.attendees && event.attendees.length > 0 && (
                        <div className="text-sm text-gray-600 mb-3">
                          <strong>Attendees:</strong>{' '}
                          {event.attendees.map(attendee => attendee.displayName || attendee.email).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Notetaker
                        </div>
                        <div className="text-xs text-gray-500">
                          {isEnabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMeetingNotetaker(event.id, !isEnabled)}
                        className="flex items-center"
                      >
                        {isEnabled ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

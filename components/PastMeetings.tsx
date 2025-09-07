'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MessageSquare, Clock, Users, Video, Eye, Mail, Share2 } from 'lucide-react'
import { Meeting } from '@prisma/client'
import MeetingDetailModal from './MeetingDetailModal'


export default function PastMeetings() {
  const { data: session } = useSession()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  useEffect(() => {
    if (session) {
      fetchPastMeetings()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchPastMeetings = async () => {
    try {
      const response = await fetch('/api/meetings/past')
      if (response.ok) {
        const data = await response.json()
        setMeetings(data.meetings || [])
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'zoom': return '🔵'
      case 'teams': return '🔷'
      case 'google-meet': return '🟢'
      default: return '📹'
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'zoom': return 'Zoom'
      case 'teams': return 'Microsoft Teams'
      case 'google-meet': return 'Google Meet'
      default: return 'Video Call'
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Past Meetings</h2>
          <button
            onClick={fetchPastMeetings}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No past meetings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Completed meetings with transcripts will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getPlatformIcon(meeting.platform)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(meeting.startTime).toLocaleDateString()} at {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Video className="h-4 w-4" />
                        <span>{getPlatformName(meeting.platform)}</span>
                      </div>
                      {meeting.attendees && meeting.attendees.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{meeting.attendees.length} attendees</span>
                        </div>
                      )}
                    </div>

                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Attendees:</strong>{' '}
                        {meeting.attendees.join(', ')}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${meeting.transcript ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-gray-600">
                          {meeting.transcript ? 'Transcript available' : 'No transcript'}
                        </span>
                      </div>
                      {meeting.posts && meeting.posts.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Share2 className="h-4 w-4 text-blue-500" />
                          <span className="text-blue-600 font-medium">
                            {meeting.posts.length} social post{meeting.posts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedMeeting(meeting)}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </div>
  )
}

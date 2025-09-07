'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Send, MessageSquare, Mail, Share2, Clock, Users, Video } from 'lucide-react'
import { Meeting, Post, Automation } from '@prisma/client'
import toast from 'react-hot-toast'

interface MeetingWithPosts extends Meeting {
  posts: (Post & { automation: Automation | null })[]
}

interface MeetingDetailModalProps {
  meeting: MeetingWithPosts
  onClose: () => void
}

export default function MeetingDetailModal({ meeting, onClose }: MeetingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'transcript' | 'email' | 'posts'>('transcript')
  const [followUpEmail, setFollowUpEmail] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (meeting.transcript && activeTab === 'email') {
      generateFollowUpEmail()
    }
  }, [meeting.transcript, activeTab])

  const generateFollowUpEmail = async () => {
    if (followUpEmail) return // Already generated
    
    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: meeting.transcript,
          meetingTitle: meeting.title,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFollowUpEmail(data.email)
      } else {
        toast.error('Failed to generate follow-up email')
      }
    } catch (error) {
      console.error('Error generating email:', error)
      toast.error('Failed to generate follow-up email')
    } finally {
      setLoading(false)
    }
  }

  const generateSocialPost = async (automation: Automation) => {
    if (generatedPosts[automation.id]) return // Already generated
    
    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: meeting.transcript,
          meetingTitle: meeting.title,
          automation,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedPosts(prev => ({
          ...prev,
          [automation.id]: data.post
        }))
      } else {
        toast.error('Failed to generate social media post')
      }
    } catch (error) {
      console.error('Error generating post:', error)
      toast.error('Failed to generate social media post')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const postToSocial = async (content: string, platform: string) => {
    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          platform,
        }),
      })

      if (response.ok) {
        toast.success(`Posted to ${platform}!`)
      } else {
        toast.error(`Failed to post to ${platform}`)
      }
    } catch (error) {
      console.error('Error posting to social:', error)
      toast.error(`Failed to post to ${platform}`)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getPlatformIcon(meeting.platform)}</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{meeting.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
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
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex border-b">
          {[
            { id: 'transcript', label: 'Transcript', icon: MessageSquare },
            { id: 'email', label: 'Follow-up Email', icon: Mail },
            { id: 'posts', label: 'Social Posts', icon: Share2 },
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'transcript' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Meeting Transcript</h3>
              {meeting.transcript ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {meeting.transcript}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p>No transcript available for this meeting.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow-up Email</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : followUpEmail ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {followUpEmail}
                    </pre>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(followUpEmail)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => {/* Implement email sending */}}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send Email</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={generateFollowUpEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Generate Follow-up Email
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Social Media Posts</h3>
              <div className="space-y-6">
                {meeting.posts.map((post) => (
                  <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {post.automation?.name || `${post.platform} Post`}
                      </h4>
                      <span className="text-sm text-gray-500 capitalize">
                        {post.platform}
                      </span>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700">
                        {post.content}
                      </pre>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyToClipboard(post.content)}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => postToSocial(post.content, post.platform)}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        <Share2 className="h-4 w-4" />
                        <span>Post</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {meeting.posts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No social media posts generated for this meeting.</p>
                    <p className="text-sm">Configure automations in Settings to generate posts.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Settings, Plus, Edit, Trash2, Save, X, Link, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Automation {
  id: string
  name: string
  type: string
  platform: string
  description: string
  example?: string
}

interface UserSettings {
  id: string
  botJoinMinutesBefore: number
}


export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'social' | 'automations' | 'bot'>('social')
  const [automations, setAutomations] = useState<Automation[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAutomationModal, setShowAutomationModal] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [linkedInConnected, setLinkedInConnected] = useState(false)
  const [facebookConnected, setFacebookConnected] = useState(false)

  useEffect(() => {
    if (session) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchData = async () => {
    try {
      const [automationsRes, settingsRes, socialRes] = await Promise.all([
        fetch('/api/automations'),
        fetch('/api/settings'),
        fetch('/api/social/status')
      ])

      if (automationsRes.ok) {
        const data = await automationsRes.json()
        setAutomations(data.automations || [])
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data.settings)
      }

      if (socialRes.ok) {
        const data = await socialRes.json()
        setLinkedInConnected(data.linkedin)
        setFacebookConnected(data.facebook)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectSocialAccount = async (platform: string) => {
    try {
      const response = await fetch(`/api/social/connect/${platform}`)
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        toast.error(`Failed to connect ${platform}`)
      }
    } catch (error) {
      console.error('Error connecting social account:', error)
      toast.error(`Failed to connect ${platform}`)
    }
  }

  const disconnectSocialAccount = async (platform: string) => {
    try {
      const response = await fetch(`/api/social/disconnect/${platform}`, {
        method: 'POST'
      })
      if (response.ok) {
        if (platform === 'linkedin') {
          setLinkedInConnected(false)
        } else {
          setFacebookConnected(false)
        }
        toast.success(`Disconnected from ${platform}`)
      } else {
        toast.error(`Failed to disconnect ${platform}`)
      }
    } catch (error) {
      console.error('Error disconnecting social account:', error)
      toast.error(`Failed to disconnect ${platform}`)
    }
  }

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const saveAutomation = async (automation: Partial<Automation>) => {
    try {
      const response = await fetch('/api/automations', {
        method: editingAutomation ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...automation,
          id: editingAutomation?.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (editingAutomation) {
          setAutomations(prev => prev.map(a => a.id === editingAutomation.id ? data.automation : a))
        } else {
          setAutomations(prev => [...prev, data.automation])
        }
        setShowAutomationModal(false)
        setEditingAutomation(null)
        toast.success('Automation saved successfully')
      } else {
        toast.error('Failed to save automation')
      }
    } catch (error) {
      console.error('Error saving automation:', error)
      toast.error('Failed to save automation')
    }
  }

  const deleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return

    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAutomations(prev => prev.filter(a => a.id !== id))
        toast.success('Automation deleted successfully')
      } else {
        toast.error('Failed to delete automation')
      }
    } catch (error) {
      console.error('Error deleting automation:', error)
      toast.error('Failed to delete automation')
    }
  }

  const tabs = [
    { id: 'social', label: 'Social Media', icon: Link },
    { id: 'automations', label: 'Automations', icon: Settings },
    { id: 'bot', label: 'Bot Settings', icon: Clock },
  ]

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
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        </div>

        {/* Navigation */}
        <div className="flex border-b mb-6">
          {tabs.map((tab) => {
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

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Connected Social Media Accounts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LinkedIn */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">in</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">LinkedIn</h4>
                      <p className="text-sm text-gray-600">
                        {linkedInConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => linkedInConnected ? disconnectSocialAccount('linkedin') : connectSocialAccount('linkedin')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      linkedInConnected
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {linkedInConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>

              {/* Facebook */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">f</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">Facebook</h4>
                      <p className="text-sm text-gray-600">
                        {facebookConnected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => facebookConnected ? disconnectSocialAccount('facebook') : connectSocialAccount('facebook')}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      facebookConnected
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {facebookConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Automations Tab */}
        {activeTab === 'automations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Content Generation Automations</h3>
              <button
                onClick={() => setShowAutomationModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Add Automation</span>
              </button>
            </div>

            <div className="space-y-4">
              {automations.map((automation) => (
                <div key={automation.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{automation.name}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">
                          {automation.platform}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{automation.description}</p>
                      {automation.example && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Example:</p>
                          <p className="text-sm text-gray-700">{automation.example}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingAutomation(automation)
                          setShowAutomationModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteAutomation(automation.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {automations.length === 0 && (
                <div className="text-center py-12">
                  <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No automations configured</h3>
                  <p className="text-gray-600 mb-4">
                    Create automations to automatically generate social media posts from your meetings.
                  </p>
                  <button
                    onClick={() => setShowAutomationModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First Automation
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bot Settings Tab */}
        {activeTab === 'bot' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Bot Settings</h3>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Bot Join Time</h4>
                  <p className="text-sm text-gray-600">
                    How many minutes before a meeting should the bot join?
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings?.botJoinMinutesBefore || 5}
                    onChange={(e) => {
                      const newSettings = { ...settings, botJoinMinutesBefore: parseInt(e.target.value) }
                      setSettings(newSettings as UserSettings)
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
                  />
                  <button
                    onClick={() => saveSettings({ botJoinMinutesBefore: settings?.botJoinMinutesBefore })}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Automation Modal */}
      {showAutomationModal && (
        <AutomationModal
          automation={editingAutomation}
          onSave={saveAutomation}
          onClose={() => {
            setShowAutomationModal(false)
            setEditingAutomation(null)
          }}
        />
      )}
    </div>
  )
}

// Automation Modal Component
function AutomationModal({ 
  automation, 
  onSave, 
  onClose 
}: { 
  automation: Automation | null
  onSave: (automation: Partial<Automation>) => void
  onClose: () => void 
}) {
  const [formData, setFormData] = useState({
    name: automation?.name || '',
    type: automation?.type || 'Generate post',
    platform: automation?.platform || 'linkedin',
    description: automation?.description || '',
    example: automation?.example || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {automation ? 'Edit Automation' : 'Create Automation'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Generate LinkedIn post"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Generate post">Generate post</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe how the post should be generated..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Example (Optional)
            </label>
            <textarea
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide an example of the desired output..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {automation ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

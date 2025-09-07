'use client'

import { useState } from 'react'
import { X, Copy, Share2 } from 'lucide-react'
import { Button } from './ui/Button'

interface DraftPostModalProps {
  isOpen: boolean
  onClose: () => void
  content: string
  platform: string
  onPost: () => void
}

export default function DraftPostModal({ 
  isOpen, 
  onClose, 
  content, 
  platform, 
  onPost 
}: DraftPostModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Draft post</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate a post based on insights from this meeting.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <div className="whitespace-pre-wrap text-sm text-gray-700 mb-4">
              {content}
            </div>
            
            {/* Hashtags */}
            <div className="text-sm text-blue-600 mb-4">
              #RetirementPlanning #FinancialWellness #MarketInsights
            </div>
            
            {/* Disclaimer */}
            <div className="text-xs text-gray-500 italic">
              The views expressed are for informational purposes only and do not constitute financial advice. Past performance is no guarantee of future results.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={onPost}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

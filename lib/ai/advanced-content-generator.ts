// Advanced AI Content Generation with Custom Models
import OpenAI from 'openai'
import { prisma } from '../prisma'

export interface ContentGenerationConfig {
  model: string
  temperature: number
  maxTokens: number
  presencePenalty: number
  frequencyPenalty: number
  customInstructions?: string
  brandVoice?: string
  targetAudience?: string
  contentType?: 'educational' | 'promotional' | 'conversational' | 'professional'
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative'
  engagement: 'high' | 'medium' | 'low'
  readability: number
  keywords: string[]
  hashtags: string[]
  estimatedReach: number
}

export class AdvancedContentGenerator {
  private openai: OpenAI
  private customModels: Map<string, any> = new Map()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  // Generate content with advanced prompting
  async generateAdvancedContent(
    transcript: string,
    meetingTitle: string,
    config: ContentGenerationConfig,
    userPreferences?: any
  ): Promise<{
    content: string
    analysis: ContentAnalysis
    alternatives: string[]
    metadata: any
  }> {
    const startTime = Date.now()

    try {
      // Extract key insights from transcript
      const insights = await this.extractInsights(transcript)
      
      // Generate multiple content variations
      const variations = await this.generateVariations(insights, config, userPreferences)
      
      // Analyze and rank content
      const analyzedContent = await this.analyzeContent(variations)
      
      // Select best content
      const bestContent = this.selectBestContent(analyzedContent)
      
      // Generate alternatives
      const alternatives = analyzedContent
        .filter(c => c !== bestContent)
        .slice(0, 2)
        .map(c => c.content)

      const duration = Date.now() - startTime

      return {
        content: bestContent.content,
        analysis: bestContent.analysis,
        alternatives,
        metadata: {
          generationTime: duration,
          model: config.model,
          insights: insights,
          variationsGenerated: variations.length
        }
      }
    } catch (error) {
      console.error('Advanced content generation failed:', error)
      throw error
    }
  }

  // Extract key insights using AI
  private async extractInsights(transcript: string): Promise<any> {
    const prompt = `
    Analyze this meeting transcript and extract key insights for social media content:
    
    ${transcript}
    
    Please provide:
    1. Main topics discussed
    2. Key decisions made
    3. Action items
    4. Client pain points addressed
    5. Value delivered
    6. Industry insights
    7. Emotional tone of the meeting
    8. Potential social media angles
    
    Format as JSON.
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })

    return JSON.parse(response.choices[0]?.message?.content || '{}')
  }

  // Generate multiple content variations
  private async generateVariations(
    insights: any,
    config: ContentGenerationConfig,
    userPreferences?: any
  ): Promise<string[]> {
    const variations = []

    // Professional tone
    variations.push(await this.generateWithTone(insights, 'professional', config))
    
    // Conversational tone
    variations.push(await this.generateWithTone(insights, 'conversational', config))
    
    // Educational tone
    variations.push(await this.generateWithTone(insights, 'educational', config))

    // Custom tone based on user preferences
    if (userPreferences?.brandVoice) {
      variations.push(await this.generateWithTone(insights, userPreferences.brandVoice, config))
    }

    return variations
  }

  private async generateWithTone(
    insights: any,
    tone: string,
    config: ContentGenerationConfig
  ): Promise<string> {
    const prompt = `
    Generate a ${config.platform} post based on these meeting insights:
    
    ${JSON.stringify(insights, null, 2)}
    
    Requirements:
    - Tone: ${tone}
    - Platform: ${config.platform}
    - Length: ${config.maxTokens} tokens max
    - Include relevant hashtags
    - Make it engaging and valuable
    - Focus on client value delivered
    ${config.customInstructions ? `- Custom instructions: ${config.customInstructions}` : ''}
    
    Return only the post content.
    `

    const response = await this.openai.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      presence_penalty: config.presencePenalty,
      frequency_penalty: config.frequencyPenalty
    })

    return response.choices[0]?.message?.content || ''
  }

  // Analyze content quality and engagement potential
  private async analyzeContent(contentVariations: string[]): Promise<Array<{
    content: string
    analysis: ContentAnalysis
    score: number
  }>> {
    const analyzedContent = []

    for (const content of contentVariations) {
      const analysis = await this.analyzeContentQuality(content)
      const score = this.calculateContentScore(analysis)
      
      analyzedContent.push({
        content,
        analysis,
        score
      })
    }

    return analyzedContent.sort((a, b) => b.score - a.score)
  }

  private async analyzeContentQuality(content: string): Promise<ContentAnalysis> {
    const prompt = `
    Analyze this social media content for quality and engagement potential:
    
    ${content}
    
    Provide analysis in JSON format:
    {
      "sentiment": "positive|neutral|negative",
      "engagement": "high|medium|low",
      "readability": 0-100,
      "keywords": ["keyword1", "keyword2"],
      "hashtags": ["#hashtag1", "#hashtag2"],
      "estimatedReach": 0-100
    }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 500
    })

    return JSON.parse(response.choices[0]?.message?.content || '{}')
  }

  private calculateContentScore(analysis: ContentAnalysis): number {
    let score = 0

    // Sentiment scoring
    if (analysis.sentiment === 'positive') score += 30
    else if (analysis.sentiment === 'neutral') score += 20
    else score += 10

    // Engagement scoring
    if (analysis.engagement === 'high') score += 25
    else if (analysis.engagement === 'medium') score += 15
    else score += 5

    // Readability scoring
    score += analysis.readability * 0.2

    // Estimated reach scoring
    score += analysis.estimatedReach * 0.25

    return Math.min(100, score)
  }

  private selectBestContent(analyzedContent: Array<{
    content: string
    analysis: ContentAnalysis
    score: number
  }>): { content: string; analysis: ContentAnalysis } {
    const best = analyzedContent[0]
    return {
      content: best.content,
      analysis: best.analysis
    }
  }

  // Generate content for specific platforms with optimization
  async generatePlatformOptimizedContent(
    transcript: string,
    platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram',
    userProfile: any
  ): Promise<string> {
    const platformConfigs = {
      linkedin: {
        maxLength: 3000,
        tone: 'professional',
        hashtags: 3,
        includeCallToAction: true
      },
      facebook: {
        maxLength: 2000,
        tone: 'conversational',
        hashtags: 2,
        includeCallToAction: true
      },
      twitter: {
        maxLength: 280,
        tone: 'concise',
        hashtags: 2,
        includeCallToAction: false
      },
      instagram: {
        maxLength: 2200,
        tone: 'engaging',
        hashtags: 10,
        includeCallToAction: true
      }
    }

    const config = platformConfigs[platform]
    
    const prompt = `
    Generate a ${platform} post optimized for this platform:
    
    Meeting transcript: ${transcript}
    User profile: ${JSON.stringify(userProfile)}
    
    Platform requirements:
    - Max length: ${config.maxLength} characters
    - Tone: ${config.tone}
    - Hashtags: ${config.hashtags} max
    - Call to action: ${config.includeCallToAction ? 'include' : 'exclude'}
    
    Make it platform-specific and engaging.
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0]?.message?.content || ''
  }

  // A/B testing for content optimization
  async generateABTestVariants(
    baseContent: string,
    testType: 'headline' | 'cta' | 'tone' | 'length'
  ): Promise<{
    variantA: string
    variantB: string
    testConfig: any
  }> {
    const testConfigs = {
      headline: {
        prompt: 'Generate two different headlines for this content',
        variations: 2
      },
      cta: {
        prompt: 'Generate two different call-to-action endings',
        variations: 2
      },
      tone: {
        prompt: 'Generate this content in two different tones',
        variations: 2
      },
      length: {
        prompt: 'Generate a short and long version of this content',
        variations: 2
      }
    }

    const config = testConfigs[testType]
    
    const prompt = `
    ${config.prompt}:
    
    ${baseContent}
    
    Return as JSON: {"variantA": "...", "variantB": "..."}
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000
    })

    const variants = JSON.parse(response.choices[0]?.message?.content || '{}')

    return {
      variantA: variants.variantA || baseContent,
      variantB: variants.variantB || baseContent,
      testConfig: {
        type: testType,
        baseContent,
        createdAt: new Date()
      }
    }
  }

  // Content performance prediction
  async predictContentPerformance(
    content: string,
    platform: string,
    userProfile: any
  ): Promise<{
    predictedEngagement: number
    predictedReach: number
    confidence: number
    recommendations: string[]
  }> {
    // This would integrate with historical data and ML models
    // For now, using AI to predict based on content analysis
    
    const prompt = `
    Predict the performance of this social media content:
    
    Content: ${content}
    Platform: ${platform}
    User Profile: ${JSON.stringify(userProfile)}
    
    Provide predictions in JSON format:
    {
      "predictedEngagement": 0-100,
      "predictedReach": 0-100,
      "confidence": 0-100,
      "recommendations": ["rec1", "rec2"]
    }
    `

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    })

    return JSON.parse(response.choices[0]?.message?.content || '{}')
  }
}

export const advancedContentGenerator = new AdvancedContentGenerator()

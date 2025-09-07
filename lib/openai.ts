import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateFollowUpEmail(transcript: string, meetingTitle: string): Promise<string> {
  const prompt = `
Based on the following meeting transcript, generate a professional follow-up email that recaps what was discussed:

Meeting Title: ${meetingTitle}

Transcript:
${transcript}

Please generate a concise, professional follow-up email that:
1. Thanks the client for their time
2. Summarizes the key points discussed
3. Outlines next steps or action items
4. Maintains a warm, professional tone

Return only the email content without subject line.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || ''
}

export async function generateSocialMediaPost(
  transcript: string, 
  meetingTitle: string, 
  automation: { description: string, example?: string }
): Promise<string> {
  const prompt = `
Based on the following meeting transcript and automation configuration, generate a social media post:

Meeting Title: ${meetingTitle}

Transcript:
${transcript}

Automation Instructions:
${automation.description}

${automation.example ? `Example: ${automation.example}` : ''}

Please generate a social media post that follows the automation instructions exactly.
`

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content || ''
}

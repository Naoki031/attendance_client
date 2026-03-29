export type ChatbotMessage = {
  role: 'user' | 'assistant'
  content: string
  suggestions?: string[]
}

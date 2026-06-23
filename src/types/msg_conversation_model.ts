// src/types/msg_conversation_model.ts
export type Message = {
  id?: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
  updatedAt?: string | null
}

export type Conversation = {
  id: string
  title: string
  userId?: string
  createdAt?: string
  updatedAt?: string | null
}

export type AiModel = {
  id: string
  name: string
  modelId: string
  description?: string | null
  isValid: boolean
  createdAt?: string
  updatedAt?: string | null
}

// TEMPORARY
export type ChatRole = 'user' | 'assistant'

export type ChatMessagePayload = {
  role: ChatRole
  content: string
}

export type OllamaPayload = {
  messages: ChatMessagePayload[]
  model?: string
  system?: string
}

export type RetryContext = {
  payload: OllamaPayload
  conversationId: string
}
// src/types/msg_conversation_model.ts
export type ChatRole = 'user' | 'assistant'
export type fileType = 'image' | 'document' | 'audio'

export interface Attachment {
  url: string
  fileName: string
  fileType: fileType
  mimeType: string
  size: number
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

export interface OllamaInstalledModel {
  name: string
  modelId: string
  parameterSize?: string
  family?: string
}

export type Message = {
  id?: string
  role: ChatRole
  content: string
  attachments?: Attachment[]
  createdAt?: string
  updatedAt?: string | null
}

export interface ProcessedMessage {
  role: string
  content: string
  images?: string[]
}

export type OllamaPayload = {
  messages: Message[]
  model?: string
  system?: string
}

export type RetryContext = {
  payload: OllamaPayload
  conversationId: string
}
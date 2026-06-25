// src/types/props.ts
import { AiModel, Conversation } from "./msg_conversation_model"

export interface AuthBoxProps {
  onLogin: (token: string) => void
}

export interface AuthDialogProps {
  open: boolean
  mode: 'login' | 'signup'
  onOpenChange: (open: boolean) => void
  onLogin: (token: string) => void
}

export interface ChatInputProps {
  input: string
  streaming: boolean
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  onOpenSystemPrompt: () => void
}

export interface ChatSidebarProps {
  token: string | null
  conversations: Conversation[]
  selectedConv: string | null
  currentView: 'chat' | 'tools'
  selectedModel: AiModel | null
  modelsRefresh: number
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onSearch: () => void
  onViewTools: () => void
  onModelChange: (m: AiModel | null) => void
  onManageModels: () => void
  onRefreshConversations: () => void
  onLogout: () => void
  onDeactivate: () => void
}

export interface DeactivateAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export interface DeleteConversationDialogProps {
  title?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export interface DeleteMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  confirmDelete: () => void
}

export interface EditMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editDraft: string
  setEditDraft: (editDraft: string) => void
  confirmEdit: () => void
}

export interface LoginSignupProps {
  authDialogOpen: boolean
  authDialogMode: 'login' | 'signup'
  setAuthDialogOpen:  (authDialogOpen: boolean) => void
  setAuthDialogMode:  (authDialogMode: 'login' | 'signup') => void
  handleLogin: (tokenValue: string) => void
}

export interface ModelSelectProps {
  token: string | null
  value: string | null
  onChange: (model: AiModel | null) => void
  onManage: () => void
  refreshToken: number
}

export interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string | null
  onCreated: () => void
}

export interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onSelectResult: (conversationId: string, messageId?: string, query?: string) => void
}

export interface SystemPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onChange: (v: string) => void
  temperature: number[]
  setTemperature: (v: number[]) => void
  topP: number[]
  setTopP: (v: number[]) => void
  topK: number
  setTopK: (v: number) => void
}
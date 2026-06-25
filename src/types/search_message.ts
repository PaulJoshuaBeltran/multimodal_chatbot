// src/types/search_message.ts
export interface SearchConversation {
  id: string
  title: string
}

export interface SearchMessage {
  id: string
  conversationId: string
  content: string
  role: string
  conversation?: { title: string }
}

// Define the State Structure
export interface SearchState {
  query: string
  results: {
    conversations: SearchConversation[]
    messages: SearchMessage[]
  }
  loading: boolean
}

// Define Action Types
export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'START_SEARCH' }
  | { type: 'SEARCH_SUCCESS'; payload: { conversations: SearchConversation[]; messages: SearchMessage[] } }
  | { type: 'SEARCH_FAILURE' }
  | { type: 'RESET' }
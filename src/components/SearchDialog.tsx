// src/components/SearchDialog.tsx
'use client'

import React, { useEffect, useMemo, useReducer } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Search, FolderOpen, MessageSquare, Loader2 } from 'lucide-react'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onSelectResult: (conversationId: string, messageId?: string, query?: string) => void
}

interface SearchConversation {
  id: string
  title: string
}

interface SearchMessage {
  id: string
  conversationId: string
  content: string
  role: string
  conversation?: { title: string }
}

// 1. Define the State Structure
interface SearchState {
  query: string
  results: {
    conversations: SearchConversation[]
    messages: SearchMessage[]
  }
  loading: boolean
}

// 2. Define Action Types
type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'START_SEARCH' }
  | { type: 'SEARCH_SUCCESS'; payload: { conversations: SearchConversation[]; messages: SearchMessage[] } }
  | { type: 'SEARCH_FAILURE' }
  | { type: 'RESET' }

const initialState: SearchState = {
  query: '',
  results: { conversations: [], messages: [] },
  loading: false,
}

// 3. Define the Reducer Logic
function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        // Immediately wipe results if the user clears the text field manually
        results: action.payload.trim() ? state.results : { conversations: [], messages: [] },
      }
    case 'START_SEARCH':
      return { ...state, loading: true }
    case 'SEARCH_SUCCESS':
      return { ...state, loading: false, results: action.payload }
    case 'SEARCH_FAILURE':
      return { ...state, loading: false }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export default function SearchDialog({ isOpen, onClose, token, onSelectResult }: SearchDialogProps) {
  const [state, dispatch] = useReducer(searchReducer, initialState)
  const { query, results, loading } = state

  // Handle Search API calls
  useEffect(() => {
    if (!isOpen) return
    
    if (!query.trim()) {
      return
    }

    dispatch({ type: 'START_SEARCH' })

    async function performSearch() {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.ok) {
          const data = await res.json()
          dispatch({ type: 'SEARCH_SUCCESS', payload: data })
        } else {
          dispatch({ type: 'SEARCH_FAILURE' })
        }
      } catch (err) {
        console.error('Search error:', err)
        dispatch({ type: 'SEARCH_FAILURE' })
      }
    }

    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [query, isOpen, token])

  // Atomic Reset: Clears input, results, and loading indicators instantly when dialog closes
  useEffect(() => {
    if (!isOpen) {
      dispatch({ type: 'RESET' })
    }
  }, [isOpen])

  function getSnippet(text: string, keyword: string, contextLength = 50): string {
    if (!keyword.trim()) return text.substring(0, 120) + (text.length > 120 ? '…' : '')
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedKeyword, 'gi')
    const match = regex.exec(text)
    if (!match) return text.substring(0, 120) + (text.length > 120 ? '…' : '')
    const start = Math.max(0, match.index - contextLength)
    const end = Math.min(text.length, match.index + keyword.length + contextLength)
    let snippet = text.substring(start, end)
    if (start > 0) snippet = '…' + snippet
    if (end < text.length) snippet = snippet + '…'
    return snippet
  }

  function highlightText(text: string, keyword: string) {
    if (!keyword.trim()) return <span>{text}</span>
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark key={i} className="bg-[var(--yellow2)] text-black px-0.5 rounded-[2px]">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  const groupedMessages = useMemo(() => {
    return results.messages.reduce((acc, m) => {
      if (!acc[m.conversationId]) {
        acc[m.conversationId] = { title: m.conversation?.title || 'Untitled', messages: [] }
      }
      if (!acc[m.conversationId].messages.some((msg) => msg.id === m.id)) {
        acc[m.conversationId].messages.push(m)
      }
      return acc
    }, {} as Record<string, { title: string; messages: SearchMessage[] }>)
  }, [results.messages])

  const hasResults = results.conversations.length > 0 || results.messages.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-lg max-h-[80vh] grid grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-0 p-0 overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <DialogHeader className="px-4 pt-4 pb-0">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search across all conversations and messages.</DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="relative">
            {loading ? (
              <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder="Type to search…"
              value={query}
              onChange={(e) => dispatch({ type: 'SET_QUERY', payload: e.target.value })}
              className="pl-9"
              autoFocus
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            />
          </div>
        </div>

        <Separator />

        {/* Results */}
        <ScrollArea type="auto" className="min-h-0 px-4 py-3">
          {!query.trim() && (
            <p className="text-sm text-muted-foreground text-center py-6">Start typing to search…</p>
          )}

          {query.trim() && !loading && !hasResults && (
            <p className="text-sm text-muted-foreground text-center py-6">No results found for {query}</p>
          )}

          <div className="flex flex-col gap-4">
            {/* Conversation title matches */}
            {results.conversations.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Conversations</p>
                <div className="flex flex-col gap-1">
                  {results.conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { onSelectResult(c.id, undefined, query); onClose() }}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted/70 transition-colors w-full"
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <FolderOpen className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span>{highlightText(c.title, query)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message matches */}
            {Object.keys(groupedMessages).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Messages</p>
                <div className="flex flex-col gap-3">
                  {Object.entries(groupedMessages).map(([convId, group]) => (
                    <div key={convId} className="rounded-lg border border-border overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 text-xs font-medium text-muted-foreground">
                        <FolderOpen className="w-3.5 h-3.5" />
                        {group.title}
                      </div>
                      {group.messages.map((m, i) => (
                        <React.Fragment key={m.id}>
                          {i > 0 && <Separator />}
                          <button
                            onClick={() => { onSelectResult(convId, m.id, query); onClose() }}
                            className="flex items-start gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors w-full"
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs text-muted-foreground capitalize block mb-0.5">{m.role}</span>
                              <span className="text-sm leading-snug line-clamp-2">
                                {highlightText(getSnippet(m.content, query), query)}
                              </span>
                            </div>
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
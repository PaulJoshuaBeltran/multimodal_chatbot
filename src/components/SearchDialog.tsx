// src/components/SearchDialog.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  // Added optional third parameter to forward the keyword for highlighting upon redirect
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
  conversation?: {
    title: string
  }
}

export default function SearchDialog({ isOpen, onClose, token, onSelectResult }: SearchDialogProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{
    conversations: SearchConversation[]
    messages: SearchMessage[]
  }>({ conversations: [], messages: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    async function performSearch() {
      if (!query.trim()) {
        setResults({ conversations: [], messages: [] })
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.ok) {
          setResults(await res.json())
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const delayDebounce = setTimeout(() => {
      performSearch()
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query, isOpen, token])

  // --- FIXED: Returns a single focused contextual fragment per message bubble to avoid repetitive rows ---
  function getSnippets(text: string, keyword: string, contextLength = 40): string[] {
    if (!keyword.trim()) return [text.substring(0, 100) + '...']
    
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedKeyword, 'gi')
    const match = regex.exec(text)

    if (!match) {
      return [text.substring(0, 100) + '...']
    }

    const start = Math.max(0, match.index - contextLength)
    const end = Math.min(text.length, match.index + keyword.length + contextLength)
    let snippet = text.substring(start, end)
    
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'
    
    return [snippet]
  }

  function highlightText(text: string, keyword: string) {
    if (!keyword.trim()) return <span>{text}</span>
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark
              key={i}
              style={{
                backgroundColor: '#ffeb3b',
                padding: '0 2px',
                borderRadius: 2,
                color: '#000'
              }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  // --- FIXED: Explicitly deduplicates incoming message items by unique message ID ---
  const groupedMessages = useMemo(() => {
    return results.messages.reduce((acc, m) => {
      if (!acc[m.conversationId]) {
        acc[m.conversationId] = {
          title: m.conversation?.title || 'Untitled',
          messages: []
        }
      }
      
      const exists = acc[m.conversationId].messages.some(msg => msg.id === m.id)
      if (!exists) {
        acc[m.conversationId].messages.push(m)
      }
      
      return acc
    }, {} as Record<string, { title: string, messages: SearchMessage[] }>)
  }, [results.messages])

  if (!isOpen) return null

  return (
    <div style={{
      backgroundColor: 'rgba(0,0,0,0.5)',
      border: '#ffffff',
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#000000',
        border: '#ffffff',
        borderRadius: 12,
        width: '550px',
        maxHeight: '80vh',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        color: '#333'
      }}>
        <div style={{
          backgroundColor: '#000000',
          border: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12
        }}>
          <h3 style={{ color: '#ffffff', margin: 0 }}>Global Search</h3>
          <button onClick={onClose} style={{
            backgroundColor: '#000000',
            border: '#ffffff',
            fontSize: 20,
            cursor: 'pointer' 
          }}>&times;</button>
        </div>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type keywords to look up..."
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#ffffff',
            border: '#ffffff',
            borderRadius: 8,
            color: '#000000',
            fontSize: 14,
            marginBottom: 16,
            boxSizing: 'border-box'
          }}
          autoFocus
        />

        <div style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          border: '#ffffff',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingRight: 4
        }}>
          {loading && <div style={{ fontSize: 14, color: '#000000' }}>Searching...</div>}

          {!loading && results.conversations.length === 0
            && results.messages.length === 0 && query.trim() !== '' && (
            <div style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>No matches found</div>
          )}

          {/* Title Matches */}
          {results.conversations.length > 0 && (
            <div>
              <h4 style={{
                margin: '0 0 6px 0',
                fontSize: 12,
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>Conversations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { onSelectResult(c.id, undefined, query); onClose() }}
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000'}
                  >
                    📁 {highlightText(c.title, query)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Message Content Matches */}
          {Object.keys(groupedMessages).length > 0 && (
            <div>
              <h4 style={{
                margin: '0 0 6px 0',
                fontSize: 12,
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>Message Matches</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(groupedMessages).map(([convId, group]) => (
                  <div key={convId} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      backgroundColor: '#000000',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#555',
                    }}>
                      📁 {group.title}
                    </div>

                    {group.messages.map((m) => {
                      const snippets = getSnippets(m.content, query)
                      return (
                        <div
                          key={m.id}
                          onClick={() => { onSelectResult(convId, m.id, query); onClose() }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            backgroundColor: '#000000',
                            fontSize: 14,
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000'}
                        >
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'capitalize' }}>
                            {m.role}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {snippets.map((snippet, idx) => (
                              <div key={idx} style={{ lineHeight: '1.4' }}>
                                💬 {highlightText(snippet, query)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
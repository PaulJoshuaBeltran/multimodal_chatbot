// src/components/SearchDialog.tsx
'use client'

import React, { useState, useEffect } from 'react'

interface SearchDialogProps {
  isOpen: boolean
  onClose: () => void
  token: string | null
  onSelectResult: (conversationId: string, messageId?: string) => void
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

    // Moved inside to resolve the missing dependency warning
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
  }, [query, isOpen, token]) // Added token here since performSearch uses it

  function highlightText(text: string, keyword: string) {
    if (!keyword.trim()) return <span>{text}</span>
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === keyword.toLowerCase() ? (
            <mark key={i} style={{ backgroundColor: '#ffeb3b', padding: '0 2px', borderRadius: 2, color: '#000' }}>
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    )
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff', width: '500px', maxHeight: '80vh', borderRadius: 12, padding: 20,
        display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: '#333'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Global Search</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>&times;</button>
        </div>

        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Type keywords to look up..."
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ccc', fontSize: 14, marginBottom: 16, boxSizing: 'border-box' }}
          autoFocus
        />

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading && <div style={{ fontSize: 14, color: '#666' }}>Searching...</div>}

          {!loading && results.conversations.length === 0 && results.messages.length === 0 && query.trim() !== '' && (
            <div style={{ color: '#888', fontSize: 14, textAlign: 'center' }}>No matches found</div>
          )}

          {results.conversations.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Conversations</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { onSelectResult(c.id); onClose() }}
                    style={{ padding: '8px 12px', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', backgroundColor: '#f9f9f9', fontSize: 14 }}
                  >
                    📁 {highlightText(c.title, query)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.messages.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Messages</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.messages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => { onSelectResult(m.conversationId, m.id); onClose() }}
                    style={{ padding: '8px 12px', border: '1px solid #eee', borderRadius: 6, cursor: 'pointer', backgroundColor: '#f9f9f9', fontSize: 14 }}
                  >
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>
                      In: {m.conversation?.title || 'Untitled'} ({m.role})
                    </div>
                    <div>💬 {highlightText(m.content, query)}</div>
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
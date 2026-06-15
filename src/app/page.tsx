// src/app/page.tsx
// src/app/page.tsx
'use client'

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import ConversationList from '@/src/components/ConversationList'
import MessageList from '@/src/components/MessageList'
import ModelSelect from '@/src/components/ModelSelect'
import ModelManager from '@/src/components/ModelManager'
import SearchDialog from '@/src/components/SearchDialog'
import type { Conversation, Message as ChatMessage, AiModel } from '@/src/types/msg_conversation_model'

// Helper function to decode JWT claims client-side securely
function getUserNameFromToken(token: string | null): string {
  if (!token) return 'Account'
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload).name || 'User Account'
  } catch {
    return 'User Account'
  }
}

export default function Page() {
  const [auth, dispatch] = useReducer(
    (_: { token: string | null; ready: boolean }, action: { token: string | null; ready: boolean }) => action,
    { token: null, ready: false }
  )

  useEffect(() => {
    const stored = localStorage.getItem('token')
    dispatch({ token: stored, ready: true })
  }, [])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [modelsRefresh, setModelsRefresh] = useState(0)
  const [showModelManager, setShowModelManager] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  // Controls state for the bottom-left settings popover menu
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const fetchConversations = useCallback(async (q?: string) => {
    const url = q ? `/api/conversations?q=${encodeURIComponent(q)}` : '/api/conversations'
    const res = await fetch(url, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
    if (res.ok) setConversations(await res.json())
  }, [auth.token])

  useEffect(() => {
    let active = true
    ;(async () => {
      const url = '/api/conversations'
      const res = await fetch(url, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
      if (!active) return
      if (res.ok) setConversations(await res.json())
    })()
    return () => { active = false }
  }, [auth.token])

  async function loadMessages(convId: string) {
    setSelectedConv(convId)
    const res = await fetch(`/api/messages?conversationId=${convId}`, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
    if (res.ok) setMessages(await res.json())
  }

  async function handleSelectSearchResult(conversationId: string, messageId?: string) {
    setSelectedConv(conversationId)
    const res = await fetch(`/api/messages?conversationId=${conversationId}`, { 
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined 
    })
    if (res.ok) {
      setMessages(await res.json())
      if (messageId) {
        setTimeout(() => {
          const element = document.getElementById(`msg-${messageId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.style.outline = '2px solid #ffeb3b'
            setTimeout(() => { element.style.outline = 'none' }, 2000)
          }
        }, 300)
      }
    }
  }

  async function send() {
    if (!input.trim() || streaming) return
    if (!selectedConv) return alert('Select a conversation first')

    const userMsg = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (auth.token) headers.Authorization = `Bearer ${auth.token}`
      const response = await fetch('/api/messages', { method: 'POST', headers, body: JSON.stringify({ conversationId: selectedConv, role: 'user', content: userMsg.content }) })
      if (response.ok) {
        const savedMsg = await response.json()
        setMessages(prev => prev.map(m => m === userMsg ? savedMsg : m))
      }
    }

    setStreaming(true)
    abortRef.current = new AbortController()

    const context = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    const payload = { messages: context } as { messages: { role: 'user' | 'assistant'; content: string }[]; model?: string }
    if (selectedModel?.modelId) payload.model = selectedModel.modelId

    const res = await fetch('/api/chat/ollama', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: abortRef.current.signal })
    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    let reply = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: reply }
          return copy
        })
      }
    } catch (e) {
      console.log(`Stream stopped: ${e}`)
    } finally {
      setStreaming(false)
      {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        if (auth.token) headers.Authorization = `Bearer ${auth.token}`
        const response = await fetch('/api/messages', { method: 'POST', headers, body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }) })
        if (response.ok) {
          const savedAssistantMsg = await response.json()
          setMessages(prev => {
            const copy = [...prev]
            copy[copy.length - 1] = savedAssistantMsg
            return copy
          })
        }
      }
    }
  }

  function stop() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  function handleLogin(tokenValue: string) {
    localStorage.setItem('token', tokenValue)
    dispatch({ token: tokenValue, ready: true })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    dispatch({ token: null, ready: true })
    setConversations([])
    setMessages([])
    setProfileMenuOpen(false)
  }

  async function handleDeactivate() {
    if (!confirm('CRITICAL WARNING: Are you absolutely sure you want to deactivate your account? This will permanently wipe your profile, conversations, models, and messages. This action is irreversible.')) return
    
    const headers: Record<string, string> = { Authorization: `Bearer ${auth.token}` }
    const res = await fetch('/api/auth/deactivate', { method: 'DELETE', headers })
    
    if (res.ok) {
      alert('Your account has been successfully deactivated.')
      handleLogout()
    } else {
      alert('Failed to process deactivation. Please try again.')
    }
  }

  async function handleEditMessage(id: string, content: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`

    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ content }),
    })

    const editedIndex = messages.findIndex(m => m.id === id)
    if (editedIndex === -1) return

    const updatedMessages = messages
      .slice(0, editedIndex + 1)
      .map(m => (m.id === id ? { ...m, content } : m))

    setMessages(updatedMessages)

    const toDelete = messages.slice(editedIndex + 1).filter(m => m.id)
    await Promise.all(
      toDelete.map(m =>
        fetch(`/api/messages/${m.id}`, {
          method: 'DELETE',
          headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
        })
      )
    )

    if (!selectedConv) return
    setStreaming(true)
    abortRef.current = new AbortController()

    const context = updatedMessages.map(m => ({ role: m.role, content: m.content }))
    const payload = { messages: context } as {
      messages: { role: 'user' | 'assistant'; content: string }[]
      model?: string
    }
    if (selectedModel?.modelId) payload.model = selectedModel.modelId

    const res = await fetch('/api/chat/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: abortRef.current.signal,
    })

    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    let reply = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: reply }
          return copy
        })
      }
    } catch (e) {
      console.log(`Stream stopped: ${e}`)
    } finally {
      setStreaming(false)
      const saveHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
      if (auth.token) saveHeaders.Authorization = `Bearer ${auth.token}`
      await fetch('/api/messages', {
        method: 'POST',
        headers: saveHeaders,
        body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }),
      })
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100vh', padding: 16 }}>
      <aside style={{ width: 300, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <ModelSelect token={auth.token} value={selectedModel?.id ?? null} onChange={m => setSelectedModel(m)} onManage={() => setShowModelManager(true)} refreshToken={modelsRefresh} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Conversations</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setIsSearchOpen(true)} style={{ padding: '2px 8px', fontSize: 13 }}>🔍 Search</button>
            </div>
          </div>
        </div>
        
        {/* Main conversation section body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ConversationList 
            selectedConvId={selectedConv}
            onSelect={loadMessages} 
            onCreate={() => fetchConversations()} 
            onUpdate={() => fetchConversations()} 
            token={auth.token} 
            conversations={conversations} 
          />
        </div>

        {/* New Account details panel locked directly to the Bottom Left */}
        {auth.token && (
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 8px 0 8px',
            marginTop: 12,
            borderTop: '1px solid #e5e5e5'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', backgroundColor: '#1a1a1a',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 'bold', flexShrink: 0
              }}>
                {getUserNameFromToken(auth.token).charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getUserNameFromToken(auth.token)}
              </span>
            </div>

            <button 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              style={{
                background: 'none', border: 'none', fontSize: 16, cursor: 'pointer',
                color: '#666', padding: '4px 8px', borderRadius: 4
              }}
            >
              ⋮
            </button>

            {profileMenuOpen && (
              <div 
                onMouseLeave={() => setProfileMenuOpen(false)}
                style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: 8,
                  backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 8,
                  boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
                  minWidth: 140, overflow: 'hidden', zIndex: 10
                }}
              >
                <button 
                  onClick={handleLogout}
                  style={{
                    padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left',
                    fontSize: 13, cursor: 'pointer', color: '#333', borderBottom: '1px solid #eee'
                  }}
                >
                  Logout
                </button>
                <button 
                  onClick={handleDeactivate}
                  style={{
                    padding: '10px 12px', background: 'none', border: 'none', textAlign: 'left',
                    fontSize: 13, cursor: 'pointer', color: '#dc3545', fontWeight: 500
                  }}
                >
                  Deactivate Account
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MessageList
            messages={messages}
            streaming={streaming}
            onEdit={handleEditMessage}
            onDelete={async (id: string) => {
              const headers: Record<string,string> = {}
              if (auth.token) headers.Authorization = `Bearer ${auth.token}`
              await fetch(`/api/messages/${id}`, { method: 'DELETE', headers })
              setMessages(prev => prev.filter(m => m.id !== id))
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #e5e5e5' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Message..." disabled={streaming} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15 }} />
          {streaming ? <button onClick={stop} style={{ padding: '10px 18px' }}>Stop</button> : <button onClick={send} disabled={!input.trim()} style={{ padding: '10px 18px' }}>Send</button>}
        </div>

        <div style={{ marginTop: 8 }}>
          {auth.ready && !auth.token && (
            <AuthBox onLogin={handleLogin} />
          )}
        </div>
      </main>

      {showModelManager && <ModelManager token={auth.token} onClose={() => { setShowModelManager(false); setModelsRefresh(x => x + 1) }} onUpdated={() => setModelsRefresh(x => x + 1)} />}
      
      <SearchDialog 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        token={auth.token} 
        onSelectResult={handleSelectSearchResult} 
      />
    </div>
  )
}

function AuthBox({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password }) })
    if (res.ok) {
      const data = await res.json()
      onLogin(data.token)
    } else {
      alert('Auth failed')
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {mode === 'signup' && <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">{mode === 'login' ? 'Login' : 'Sign up'}</button>
      <button type="button" onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create account' : 'Have an account?'}</button>
    </form>
  )
}
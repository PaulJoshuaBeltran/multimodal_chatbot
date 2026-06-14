// src/app/page.tsx
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import ConversationList from '@/src/components/ConversationList'
import MessageList from '@/src/components/MessageList'
import ModelSelect from '@/src/components/ModelSelect'
import ModelManager from '@/src/components/ModelManager'
import type { Conversation, Message as ChatMessage, AiModel } from '@/src/types/msg_conversation_model'

export default function Page() {
  const [token, setToken] = useState<string | null>(() => typeof window !== 'undefined' ? localStorage.getItem('token') : null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [modelsRefresh, setModelsRefresh] = useState(0)
  const [showModelManager, setShowModelManager] = useState(false)

  const fetchConversations = useCallback(async (q?: string) => {
    const url = q ? `/api/conversations?q=${encodeURIComponent(q)}` : '/api/conversations'
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    if (res.ok) setConversations(await res.json())
  }, [token])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const url = '/api/conversations'
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      if (!mounted) return
      if (res.ok) setConversations(await res.json())
    })()
    return () => { mounted = false }
  }, [token])

  async function loadMessages(convId: string) {
    setSelectedConv(convId)
    const res = await fetch(`/api/messages?conversationId=${convId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    if (res.ok) setMessages(await res.json())
  }

  async function send() {
    if (!input.trim() || streaming) return
    if (!selectedConv) return alert('Select a conversation first')

    const userMsg = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // save user message
    {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      await fetch('/api/messages', { method: 'POST', headers, body: JSON.stringify({ conversationId: selectedConv, role: 'user', content: userMsg.content }) })
    }

    // stream assistant reply from ollama
    setStreaming(true)
    abortRef.current = new AbortController()

    const context = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    const payload = { messages: context } as { messages: { role: 'user' | 'assistant'; content: string }[]; model?: string }
    if (selectedModel?.modelId) payload.model = selectedModel.modelId

    const res = await fetch('/api/chat/ollama', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: abortRef.current.signal })
    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    let reply = ''

    // optimistic assistant message
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
      // aborted
      console.log(`Stream stopped: ${e}`)
    } finally {
      setStreaming(false)
      // persist assistant message
      {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`
        await fetch('/api/messages', { method: 'POST', headers, body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }) })
      }
    }
  }

  function stop() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  function handleLogin(tokenValue: string) {
    localStorage.setItem('token', tokenValue)
    setToken(tokenValue)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setConversations([])
    setMessages([])
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: '100vh', padding: 16 }}>
      <aside style={{ width: 300 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <ModelSelect token={token} value={selectedModel?.id ?? null} onChange={m => setSelectedModel(m)} onManage={() => setShowModelManager(true)} refreshToken={modelsRefresh} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Conversations</h3>
            {token ? <button onClick={handleLogout}>Logout</button> : null}
          </div>
        </div>
        <ConversationList onSelect={loadMessages} onCreate={() => fetchConversations()} token={token} conversations={conversations} />
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <MessageList messages={messages} streaming={streaming} onEdit={async (id: string, content: string) => {
            const headers: Record<string,string> = { 'Content-Type': 'application/json' }
            if (token) headers.Authorization = `Bearer ${token}`
            await fetch(`/api/messages/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ content }) })
            setMessages(prev => prev.map(m => (m.id === id ? { ...m, content } : m)))
          }} onDelete={async (id: string) => {
            const headers: Record<string,string> = {}
            if (token) headers.Authorization = `Bearer ${token}`
            await fetch(`/api/messages/${id}`, { method: 'DELETE', headers })
            setMessages(prev => prev.filter(m => m.id !== id))
          }} />
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #e5e5e5' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Message gemma4:e4b…" disabled={streaming} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15 }} />
          {streaming ? <button onClick={stop} style={{ padding: '10px 18px' }}>Stop</button> : <button onClick={send} disabled={!input.trim()} style={{ padding: '10px 18px' }}>Send</button>}
        </div>

        <div style={{ marginTop: 8 }}>
          {!token && (
            <AuthBox onLogin={handleLogin} />
          )}
        </div>
      </main>

      {showModelManager && <ModelManager token={token} onClose={() => { setShowModelManager(false); setModelsRefresh(x => x + 1) }} onUpdated={() => setModelsRefresh(x => x + 1)} />}
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
    alert(`Auth response: ${res.status}`)
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
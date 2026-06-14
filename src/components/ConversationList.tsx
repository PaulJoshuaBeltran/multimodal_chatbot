// src/components/ConversationList.tsx
'use client'

import React, { useState } from 'react'
import type { Conversation } from '@/src/types/msg_conversation_model'

export default function ConversationList({ conversations, onSelect, onCreate, token }: { conversations: Conversation[]; onSelect: (id: string) => void; onCreate: () => void; token?: string | null }) {
  const [title, setTitle] = useState('')

  async function create() {
    if (!token) {
      alert('Please log in to create a conversation')
      return
    }

    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    headers.Authorization = `Bearer ${token}`
    const res = await fetch('/api/conversations', { method: 'POST', headers, body: JSON.stringify({ title }) })
    if (res.ok) {
      setTitle('')
      onCreate()
    } else {
      const txt = await res.text().catch(() => '')
      alert('Create failed: ' + (txt || res.status))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="New conversation title" style={{ flex: 1 }} />
        <button onClick={create}>New</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {conversations.map((c: Conversation) => (
          <button key={c.id} onClick={() => onSelect(c.id)} style={{ textAlign: 'left', padding: 8, borderRadius: 6, border: '1px solid #eee' }}>{c.title}</button>
        ))}
      </div>
    </div>
  )
}
// src/components/ChatMain.tsx
'use client'

import React, { useState } from 'react'
import MessageList from './MessageList'
import AuthBox from './AuthBox'
import type { Message } from '@/src/types/msg_conversation_model'

export default function ChatMain({ token, messages, streaming, onSend, onEdit, onDelete, onStop, onLogin }: { token?: string | null; messages: Message[]; streaming?: boolean; onSend: (content: string) => Promise<void>; onEdit?: (id: string, content: string) => Promise<void>; onDelete?: (id: string) => Promise<void>; onStop: () => void; onLogin: (token: string) => void }) {
  const [input, setInput] = useState('')

  async function send() {
    if (!input.trim()) return
    await onSend(input.trim())
    setInput('')
  }

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <MessageList messages={messages} streaming={streaming} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #e5e5e5' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Message…" disabled={streaming} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid #ddd', fontSize: 15 }} />
        {streaming ? <button onClick={onStop} style={{ padding: '10px 18px' }}>Stop</button> : <button onClick={send} disabled={!input.trim()} style={{ padding: '10px 18px' }}>Send</button>}
      </div>

      <div style={{ marginTop: 8 }}>
        {!token && (
          <AuthBox onLogin={onLogin} />
        )}
      </div>
    </main>
  )
}

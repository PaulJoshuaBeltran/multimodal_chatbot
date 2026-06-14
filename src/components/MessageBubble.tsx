// src/components/MessageBubble.tsx
'use client'

import React from 'react'

export default function MessageBubble({ role, content, streaming, onEdit, onDelete }: { role: 'user' | 'assistant'; content: string; streaming?: boolean; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div style={{
      alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
      background: role === 'user' ? '#1a1a1a' : '#f1f1f1',
      color: role === 'user' ? '#fff' : '#111',
      padding: '10px 16px',
      borderRadius: 16,
      borderBottomRightRadius: role === 'user' ? 4 : 16,
      borderBottomLeftRadius: role === 'assistant' ? 4 : 16,
      maxWidth: '80%',
      whiteSpace: 'pre-wrap',
      lineHeight: 1.6,
      fontSize: 15,
      marginBottom: 8,
    }}>
      <div>{content}</div>
      <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
        {onEdit ? <button onClick={onEdit} style={{ fontSize: 12 }}>Edit</button> : null}
        {onDelete ? <button onClick={onDelete} style={{ fontSize: 12 }}>Delete</button> : null}
        {streaming ? <span style={{ marginLeft: 8, color: '#888' }}>• thinking…</span> : null}
      </div>
    </div>
  )
}
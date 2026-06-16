// src/components/ConversationList.tsx
'use client'

import React, { useState } from 'react'
import type { Conversation } from '@/src/types/msg_conversation_model'

export default function ConversationList({ 
  conversations, 
  selectedConvId,
  onSelect, 
  onCreate, 
  onUpdate,
  token 
}: { 
  conversations: Conversation[]; 
  selectedConvId: string | null;
  onSelect: (id: string) => void; 
  onCreate: () => void; 
  onUpdate: () => void;
  token?: string | null 
}) {
  const [title, setTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  async function create() {
    if (!token) return alert('Please log in to create a conversation')
    const headers: Record<string,string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const res = await fetch('/api/conversations', { method: 'POST', headers, body: JSON.stringify({ title }) })
    if (res.ok) {
      setTitle('')
      onCreate()
    }
  }

  async function renameConversation(id: string) {
    if (!editTitle.trim()) return
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title: editTitle })
    })
    if (res.ok) {
      setEditingId(null)
      onUpdate()
    }
  }

  async function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this conversation?')) return
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE', headers })
    if (res.ok || res.status === 204) {
      onUpdate()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="New conversation title"
          style={{ flex: 1 }}
        />
        <button onClick={create}>New</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {conversations.map((c: Conversation) => {
          const isSelected = selectedConvId === c.id
          const isEditing = editingId === c.id

          return (
            <div 
              key={c.id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #ffffff',
                backgroundColor: isSelected ? '#ffffff' : '#000000',
                color: isSelected ? '#000000' : '#ffffff'
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  <input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus 
                  />
                  <button
                    onClick={() => renameConversation(c.id)}
                    style={{ fontSize: 11 }}>Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    style={{ fontSize: 11 }}>X
                  </button>
                </div>
              ) : (
                <>
                  <span
                    onClick={() => onSelect(c.id)}
                    style={{
                      cursor: 'pointer',
                      flex: 1,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      fontSize: 14 }}>
                    {c.title}
                  </span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={() => { setEditingId(c.id); setEditTitle(c.title); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                      title="Rename">✏️
                    </button>
                    <button
                      onClick={(e) => deleteConversation(c.id, e)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                      title="Delete">🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
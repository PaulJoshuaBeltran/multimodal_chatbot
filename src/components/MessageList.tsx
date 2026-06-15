// src/components/MessageList.tsx
'use client'

import React from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'

export default function MessageList({ messages, streaming, onEdit, onDelete }: { messages: Message[]; streaming?: boolean; onEdit?: (id: string, content: string) => void; onDelete?: (id: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
      {messages.map((m: Message, index: number) => (
        <MessageBubble
          key={m.id ?? m.createdAt ?? index}
          role={m.role}
          content={m.content}
          streaming={streaming && m.role === 'assistant'}
          onEdit={m.id && onEdit ? () => onEdit(m.id!, prompt('Edit message', m.content) || m.content) : undefined}
          onDelete={m.id && onDelete ? () => onDelete(m.id!) : undefined} />
      ))}
    </div>
  )
}
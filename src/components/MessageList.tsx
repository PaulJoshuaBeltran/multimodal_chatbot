// src/components/MessageList.tsx
'use client'

import React from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'

export default function MessageList({
  messages,
  streaming,
  onEdit,
  onDelete,
  highlightQuery, // Added to receive target highlight string from the parent view context
}: {
  messages: Message[]
  streaming?: boolean
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  highlightQuery?: string
}) {
  const lastAssistantIndex = messages.reduce(
    (last, m, i) => (m.role === 'assistant' ? i : last),
    -1
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
      {messages.map((m: Message, index: number) => {
        const isUser = m.role === 'user'
        return (
          <MessageBubble
            key={m.id ?? m.createdAt ?? index}
            id={m.id}
            role={m.role as 'user' | 'assistant'}
            content={m.content}
            streaming={streaming && index === lastAssistantIndex}
            highlightQuery={highlightQuery} // Forwarded here
            onEdit={
              isUser && m.id && onEdit
                ? () => {
                    const result = prompt('Edit message', m.content)
                    if (result !== null) onEdit(m.id!, result || m.content)
                  }
                : undefined
            }
            onDelete={isUser && m.id && onDelete ? () => onDelete(m.id!) : undefined}
          />
        )
      })}
    </div>
  )
}
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
}: {
  messages: Message[]
  streaming?: boolean
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
}) {
  // Index of the last assistant message (the one currently streaming)
  const lastAssistantIndex = messages.reduce(
    (last, m, i) => (m.role === 'assistant' ? i : last),
    -1
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
      {messages.map((m: Message, index: number) => (
        <MessageBubble
          key={m.id ?? m.createdAt ?? index}
          role={m.role}
          content={m.content}
          // Only the last assistant bubble gets the streaming indicator
          streaming={streaming && index === lastAssistantIndex}
          onEdit={
            m.id && onEdit
              ? () => {
                  const result = prompt('Edit message', m.content)
                  if (result !== null) onEdit(m.id!, result || m.content)
                }
              : undefined
          }
          onDelete={m.id && onDelete ? () => onDelete(m.id!) : undefined}
        />
      ))}
    </div>
  )
}
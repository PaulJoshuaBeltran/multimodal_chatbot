// src/components/main/MessageList.tsx
'use client'

import React, { useState } from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'
import { toast } from 'sonner'
import { DeleteMessageDialog, EditMessageDialog } from '../dialogs/OtherDialogs'

function formatDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

// Groups messages by createdAt (send time), preserving array order.
// Deliberately does NOT use updatedAt — editing a message must not
// relocate it in the timeline.
function groupMessagesByDate(messages: Message[]) {
  const groups: { label: string; items: Message[] }[] = []
  for (const m of messages) {
    const ts = m.createdAt ?? new Date().toISOString()
    const label = formatDateLabel(new Date(ts))
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(m)
    } else {
      groups.push({ label, items: [m] })
    }
  }
  return groups
}

export default function MessageList({
  messages,
  streaming,
  isThinking,
  onEdit,
  onDelete,
  highlightQuery,
  onRegenerate,
}: {
  messages: Message[]
  streaming?: boolean
  isThinking?: boolean
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  highlightQuery?: string
  onRegenerate?: (index: number) => void
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{ id: string; content: string } | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  function openEdit(id: string, content: string) {
    setEditTarget({ id, content })
    setEditDraft(content)
    setEditDialogOpen(true)
  }

  function confirmEdit() {
    if (editTarget && onEdit) {
      onEdit(editTarget.id, editDraft || editTarget.content)
      toast.info('Message updated')
    }
    setEditDialogOpen(false)
    setEditTarget(null)
  }

  function openDelete(id: string) {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  function confirmDelete() {
    if (deleteTargetId && onDelete) {
      onDelete(deleteTargetId)
      toast.info('Message deleted')
    }
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
  }

  if (messages.length === 0 && !streaming && !isThinking) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24 px-8 gap-3">
        <p className="text-muted-foreground text-sm">No messages yet. Send one to get started.</p>
      </div>
    )
  }

  const groups = groupMessagesByDate(messages)
  const lastMessage = messages[messages.length - 1]
  let flatIndex = -1

  return (
    <>
      <div className="flex flex-col gap-2 p-4 min-h-full">
        {groups.map(({ label, items }, groupIdx) => (
          <div key={`${label}-${groupIdx}`}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground/60 font-medium select-none px-1">
                {label}
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {items.map((m: Message) => {
              flatIndex++
              const currentIndex = flatIndex
              const isUser = m.role === 'user'
              return (
                <MessageBubble
                  key={m.id ?? `msg-${currentIndex}`}
                  id={m.id}
                  role={m.role as 'user' | 'assistant'}
                  content={m.content}
                  highlightQuery={highlightQuery}
                  onEdit={isUser && m.id && onEdit ? () => openEdit(m.id!, m.content) : undefined}
                  onDelete={isUser && m.id && onDelete ? () => openDelete(m.id!) : undefined}
                  onRegenerate={
                    m.role === 'assistant' && onRegenerate ? () => onRegenerate(currentIndex) : undefined
                  }
                />
              )
            })}
          </div>
        ))}

        {/* Only show the "thinking" placeholder while waiting on a reply
            for the *current* turn — i.e. the last message is the user's,
            not just "no assistant message anywhere in this conversation". */}
        {isThinking && streaming && lastMessage?.role === 'user' && (
          <MessageBubble role="assistant" content="" />
        )}
      </div>

      {editDialogOpen && (
        <EditMessageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editDraft={editDraft}
          setEditDraft={setEditDraft}
          confirmEdit={confirmEdit}
        />
      )}

      {deleteDialogOpen && (
        <DeleteMessageDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          confirmDelete={confirmDelete}
        />
      )}
    </>
  )
}
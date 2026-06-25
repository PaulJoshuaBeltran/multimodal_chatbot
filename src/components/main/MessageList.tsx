// src/components/main/MessageList.tsx
'use client'

import React, { useState } from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'
import { toast } from 'sonner'
import { groupByDate } from '@/lib/dateGroups'
import { DeleteMessageDialog, EditMessageDialog } from '../dialogs/OtherDialogs'

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

  const lastAssistantIndex = messages.reduce(
    (last, m, i) => (m.role === 'assistant' ? i : last),
    -1
  )

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

  // Only group messages that have an updatedAt; streaming/thinking bubble is appended after
  const datedMessages = messages.filter((m) => m.updatedAt)
  const undatedMessages = messages.filter((m) => !m.updatedAt)
  const groups = groupByDate(datedMessages, true)

  // Track a flat index across groups so onRegenerate receives the correct index
  let flatIndex = -1

  return (
    <>
      <div className="flex flex-col gap-2 p-4 min-h-full">
        {groups.map(({ label, items }) => (
          <div key={label}>
            {/* Date separator */}
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
                  key={m.id ?? m.createdAt ?? currentIndex}
                  id={m.id}
                  role={m.role as 'user' | 'assistant'}
                  content={m.content}
                  highlightQuery={highlightQuery}
                  onEdit={
                    isUser && m.id && onEdit
                      ? () => openEdit(m.id!, m.content)
                      : undefined
                  }
                  onDelete={
                    isUser && m.id && onDelete
                      ? () => openDelete(m.id!)
                      : undefined
                  }
                  onRegenerate={
                    m.role === 'assistant' && onRegenerate
                      ? () => onRegenerate(currentIndex)
                      : undefined
                  }
                />
              )
            })}
          </div>
        ))}

        {undatedMessages.map((m: Message, i: number) => {
          flatIndex++
          const currentIndex = flatIndex
          const isUser = m.role === 'user'
          return (
            <MessageBubble
              key={m.id ?? m.createdAt ?? `undated-${i}`}
              id={m.id}
              role={m.role as 'user' | 'assistant'}
              content={m.content}
              highlightQuery={highlightQuery}
              onEdit={
                isUser && m.id && onEdit
                  ? () => openEdit(m.id!, m.content)
                  : undefined
              }
              onDelete={
                isUser && m.id && onDelete
                  ? () => openDelete(m.id!)
                  : undefined
              }
              onRegenerate={
                m.role === 'assistant' && onRegenerate
                  ? () => onRegenerate(currentIndex)
                  : undefined
              }
            />
          )
        })}

        {isThinking && streaming && lastAssistantIndex === -1 && (
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

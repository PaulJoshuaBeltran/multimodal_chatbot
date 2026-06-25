// src/components/main/MessageList.tsx
'use client'

import React, { useState } from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { toast } from 'sonner'
import { Label } from '../ui/label'
import { DeleteMessageDialog, EditMessageDialog } from '../dialogs/OtherDialogs'

export default function MessageList({
  messages,
  streaming,
  isThinking,
  onEdit,
  onDelete,
  highlightQuery,
  onRegenerate
}: {
  messages: Message[]
  streaming?: boolean
  // Fires immediately when the user sends — before any streamed content arrives
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

  const lastAssistantIndex = messages.reduce((last, m, i) => (m.role === 'assistant' ? i : last), -1)

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

  return (
    <>
      <div className="flex flex-col gap-2 p-4 min-h-full">
        {messages.map((m: Message, index: number) => {
          const isUser = m.role === 'user'
          return (
            <MessageBubble
              key={m.id ?? m.createdAt ?? index}
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
                  ? () => onRegenerate(index)
                  : undefined
              }
            />
          )
        })}
        
        {isThinking && streaming && lastAssistantIndex === -1 && (
          <MessageBubble
            role="assistant"
            content=""
          />
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

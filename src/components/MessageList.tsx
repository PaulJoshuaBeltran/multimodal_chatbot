// src/components/MessageList.tsx
'use client'

import React, { useState } from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'
import { Skeleton } from './ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { Label } from './ui/label'

export default function MessageList({
  messages,
  streaming,
  onEdit,
  onDelete,
  highlightQuery,
  onRegenerate
}: {
  messages: Message[]
  streaming?: boolean
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
  const lastUserIndex = messages.reduce((last, m, i) => (m.role === 'user' ? i : last), -1)

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

  if (messages.length === 0 && !streaming) {
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

        {/* Skeleton while streaming but no assistant message yet */}
        {streaming && lastAssistantIndex === -1 && (
          <div className="flex flex-col gap-2 max-w-[70%] self-start">
            <Skeleton className="h-4 w-48 rounded" />
            <Skeleton className="h-4 w-64 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
        )}
      </div>

      {/* Edit message dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="sm:max-w-lg"
          style={{ backgroundColor: 'var(--gray3)' }}
        >
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
            <DialogDescription>
              Editing will regenerate the assistant reply from this point.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label htmlFor="edit-message">Message</Label>
            <Textarea
              className="resize-none"
              id="edit-message"
              rows={4}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={confirmEdit}
                style={{ backgroundColor: 'var(--gray3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                >
                  Save &amp; regenerate
              </Button>
              <Button
                onClick={() => setEditDialogOpen(false)}
                style={{ backgroundColor: 'var(--gray3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete message alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be permanently removed from the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
// src/components/dialogs/ConversationDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'

import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { toast } from "@/src/components/ui/toast"
import { DeleteConversationDialogProps, NewConversationDialogProps } from '@/src/types/props'
import { AlertTriangle } from 'lucide-react'

// ── NewConversationDialog ─────────────────────────────────────────────────────
export function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: Omit<NewConversationDialogProps, 'token'>) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setTitle('')
        onCreated()
        onOpenChange(false)
        toast.add({
          title: "SUCCESS",
          description: "Conversation created",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--gray3)' }}>
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Give your conversation a title to get started.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conv-title">Title</Label>
            <Input
              id="conv-title"
              placeholder="e.g. Research notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              disabled={loading}
              autoFocus
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            />
          </div>
          <Button
            onClick={create}
            disabled={loading || !title.trim()}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── DeleteConversationDialog ──────────────────────────────────────────────────
export function DeleteConversationDialog({
  title,
  open,
  onOpenChange,
  onConfirm,
}: DeleteConversationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete conversation?
          </DialogTitle>
          <DialogDescription>
            <strong>{title}</strong> and all its messages will be permanently deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            Delete
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
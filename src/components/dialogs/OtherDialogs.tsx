// src/components/dialogs/OtherDialogs.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
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
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { AuthDialogProps, DeactivateAlertDialogProps, DeleteConversationDialogProps, DeleteMessageDialogProps, EditMessageDialogProps, NewConversationDialogProps } from '@/src/types/props'
import { Textarea } from '../ui/textarea'
import { AlertTriangle } from 'lucide-react'

// ── AuthDialog ────────────────────────────────────────────────────────────────
export function AuthDialog({ open, mode, onOpenChange, onLogin }: AuthDialogProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const body = mode === 'login' ? { email, password } : { name, email, password }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.token) {
          onLogin(data.token)
          onOpenChange(false)
          toast.success(mode === 'login' ? 'Welcome back!' : 'Account created! You are now logged in.')
        } else {
          toast.error('Authentication failed: Missing token in response.')
        }
      } else {
        toast.error('Authentication failed: Please check your credentials.')
      }
    } catch (err) {
      toast.error('An error occurred while processing your request: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Sign in' : 'Create account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login'
              ? 'Enter your credentials to continue.'
              : 'Fill in the details below to get started.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── NewConversationDialog ─────────────────────────────────────────────────────
export function NewConversationDialog({
  open,
  onOpenChange,
  token,
  onCreated,
}: NewConversationDialogProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!title.trim()) return
    if (!token) {
      toast.error('Not logged in: Please sign in to create a conversation.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setTitle('')
        onCreated()
        onOpenChange(false)
        toast.success('Conversation created')
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

// ── DeactivateAlertDialog ─────────────────────────────────────────────────────
export function DeactivateAlertDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeactivateAlertDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Deactivate account?
          </DialogTitle>
          <DialogDescription>
            This will permanently delete your profile, conversations, models, and messages.
            This action cannot be undone.
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

// ── EditMessageDialog ─────────────────────────────────────────────────────────
export function EditMessageDialog({
  open,
  onOpenChange,
  editDraft,
  setEditDraft,
  confirmEdit
}: EditMessageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onClick={() => onOpenChange(false)}
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
  )
}

// ── DeleteMessageDialog ───────────────────────────────────────────────────────
export function DeleteMessageDialog({
  open,
  onOpenChange,
  confirmDelete,
}: DeleteMessageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete message?
          </DialogTitle>
          <DialogDescription>
            This message will be permanently removed from the conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmDelete}
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
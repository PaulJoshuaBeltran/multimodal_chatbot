// src/components/dialogs/OtherDialogs.tsx
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'

import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { AddModelDialogProps, AuthDialogProps, DeactivateAlertDialogProps, DeleteConversationDialogProps, DeleteMessageDialogProps, EditMessageDialogProps, NewConversationDialogProps } from '@/src/types/props'
import { Textarea } from '../ui/textarea'
import { AlertTriangle, Check, Plus, Search } from 'lucide-react'
import { AiModel, OllamaInstalledModel } from '@/src/types/msg_conversation_model'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'

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

export function AddModelDialog({
  open,
  onOpenChange,
  token,
  onAdded,
}: AddModelDialogProps) {
  const [q, setQ] = useState('')
  const [installed, setInstalled] = useState<OllamaInstalledModel[]>([])
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set())
  const [loadingList, setLoadingList] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  // Render-time adjustment instead of an effect setState:
  // when `open` flips true, mark loading immediately, in the same render pass.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setLoadingList(true)
  }

  const loadInstalled = useCallback(async (query?: string) => {
    const url = query
      ? `/api/models/ollama-all?q=${encodeURIComponent(query)}`
      : '/api/models/ollama-all'
    const res = await fetch(url)
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      toast.error(`Couldn't load Ollama models: ${err?.error || res.statusText}`)
      return []
    }
    return res.json() as Promise<OllamaInstalledModel[]>
  }, [])

  const loadActivated = useCallback(async () => {
    const res = await fetch('/api/models', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!res.ok) return []
    return res.json() as Promise<AiModel[]>
  }, [token])

  useEffect(() => {
    if (!open) return
    let mounted = true
    Promise.all([loadInstalled(), loadActivated()]).then(([inst, act]) => {
      if (!mounted) return
      setInstalled(inst)
      setActivatedIds(new Set(act.map((m) => m.modelId.toLowerCase())))
      setLoadingList(false)
    })
    return () => { mounted = false }
  }, [open, loadInstalled, loadActivated])

  async function handleSearch() {
    setLoadingList(true) // fine — this is inside an event handler, not an effect body
    const inst = await loadInstalled(q)
    setInstalled(inst)
    setLoadingList(false)
  }

  async function activate(m: OllamaInstalledModel) {
    setAddingId(m.modelId)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const description = [m.family, m.parameterSize].filter(Boolean).join(' · ') || undefined
      const res = await fetch('/api/models', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: m.name, modelId: m.modelId, description }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }))
        toast.error(`Activate failed: ${err?.error || 'Unknown error'}`)
        return
      }
      setActivatedIds((prev) => new Set(prev).add(m.modelId.toLowerCase()))
      onAdded?.()
      toast.success(`${m.name} activated`)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>Add a model</DialogTitle>
          <DialogDescription>
            Search models installed in Ollama and activate the ones you want to use.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              style={{ transform: 'translateY(-3px)' }}
            />
            <Input
              className="pl-8"
              placeholder="Search installed models…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ backgroundColor: 'var(--gray3)' }}
            />
          </div>
          <Button onClick={handleSearch} style={{ backgroundColor: 'var(--gray3)' }}>
            Search
          </Button>
        </div>

        <ScrollArea type="auto" className="flex-1 min-h-0 pr-1">
          {loadingList ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : installed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No installed models found. Pull one with <code>ollama pull &lt;model&gt;</code> first.
            </p>
          ) : (
            <div className="flex flex-col max-h-[240px] pr-3">
              {/* 80px for each item */}
              {installed.map((m, i) => {
                const already = activatedIds.has(m.modelId.toLowerCase())
                if (!already){
                  return (
                    <React.Fragment key={m.modelId}>
                      {i > 0 && <Separator />}
                      <div className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{m.modelId}</p>
                          {(m.family || m.parameterSize) && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {[m.family, m.parameterSize].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          disabled={already || addingId === m.modelId}
                          onClick={() => activate(m)}
                          className="flex-shrink-0"
                          style={{ backgroundColor: 'var(--gray3)' }}
                        >
                          {addingId === m.modelId ? (
                            'Adding…'
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 mr-1" /> Add
                            </>
                          )}
                        </Button>
                      </div>
                    </React.Fragment>
                  )
                }
              })}
            </div>
          )}
        </ScrollArea>
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
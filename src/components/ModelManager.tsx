// src/components/ModelManager.tsx
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
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
import { toast } from 'sonner'
import { Search, Pencil, Trash2, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ModelManager({
  token,
  onClose,
  onUpdated,
}: {
  token?: string | null
  onClose: () => void
  onUpdated?: () => void
}) {
  const [models, setModels] = useState<AiModel[]>([])
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [modelId, setModelId] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState({ name: '', modelId: '', description: '' })
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const load = useCallback(
    async (query?: string): Promise<AiModel[]> => {
      const url = query ? `/api/models?q=${encodeURIComponent(query)}` : '/api/models'
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) return []
      return res.json()
    },
    [token]
  )

  useEffect(() => {
    let mounted = true
    load().then(async (data) => {
      if (!mounted) return
      if (data.length === 0) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers.Authorization = `Bearer ${token}`
          await fetch('/api/models', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Gemma 4', modelId: 'gemma4:e4b', description: 'System Default Model' }),
          })
          const freshData = await load()
          if (mounted) setModels(freshData)
        } catch (err) {
          console.error('Failed to seed default model', err)
        }
      } else {
        setModels(data)
      }
    })
    return () => { mounted = false }
  }, [load, token])

  async function handleSearch() {
    const data = await load(q)
    setModels(data)
  }

  async function createModel() {
    if (!name.trim() || !modelId.trim()) {
      // toast({ title: 'Display Name and Model ID are required.', variant: 'destructive' })
      toast.error('Display Name and Model ID are required.')
      return
    }
    if (models.some((m) => m.modelId.toLowerCase() === modelId.trim().toLowerCase())) {
      // toast({ title: 'A model with this Model ID already exists.', variant: 'destructive' })
      toast.error('A model with this Model ID already exists.')
      return
    }
    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('/api/models', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, modelId, description }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }))
        toast.error(`Create failed: ${err?.error || 'Unknown error'}`)
        return
      }
      setName('')
      setModelId('')
      setDescription('')
      const newModels = await load()
      setModels(newModels)
      onUpdated?.()
      // toast({ title: 'Model added' })
      toast.success('Model added')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(m: AiModel) {
    setEditingId(m.id)
    setEditFields({ name: m.name, modelId: m.modelId, description: m.description || '' })
  }

  async function saveEdit(m: AiModel) {
    if (!editFields.name.trim() || !editFields.modelId.trim()) {
      toast.error('Display Name and Model ID are required.')
      return
    }
    if (models.some((mod) => mod.id !== m.id && mod.modelId.toLowerCase() === editFields.modelId.trim().toLowerCase())) {
      toast.error('This Model ID is already in use.')
      return
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/models/${m.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(editFields),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      toast.error(`Update failed: ${err?.error || 'Unknown error'}`)
      return
    }
    setEditingId(null)
    const newModels = await load()
    setModels(newModels)
    onUpdated?.()
    toast.success('Model updated')
  }

  async function deleteModel(id: string) {
    const headers: Record<string, string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/models/${id}`, { method: 'DELETE', headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      toast.error(`Delete failed: ${err?.error || 'Unknown error'}`)
      setDeleteTargetId(null)
      return
    }
    const newModels = await load()
    setModels(newModels)
    onUpdated?.()
    toast.success('Model deleted')
    setDeleteTargetId(null)
  }

  const deleteTarget = models.find((m) => m.id === deleteTargetId)

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Manage models</DialogTitle>
            <DialogDescription>Add, search, edit, or remove AI models.</DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search models…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
            </div>
            <Button variant="outline" onClick={handleSearch}>Search</Button>
          </div>

          {/* Add new model form */}
          <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add new model</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="model-name" className="text-xs">Display name</Label>
                <Input
                  id="model-name"
                  placeholder="e.g. Gemma 4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="model-id" className="text-xs">Model ID</Label>
                <Input
                  id="model-id"
                  placeholder="e.g. gemma4:e4b"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createModel} disabled={loading} className="flex-shrink-0">
                <Plus className="w-4 h-4 mr-1" />
                {loading ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </div>

          {/* Model list */}
          <ScrollArea type="auto" className="flex-1 min-h-0 pr-1">
            {models.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No models yet.</p>
            ) : (
              <div className="flex flex-col">
                {models.map((m, i) => (
                  <React.Fragment key={m.id}>
                    {i > 0 && <Separator />}
                    <div className="py-3">
                      {editingId === m.id ? (
                        <div className="flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={editFields.name}
                              onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                              placeholder="Display name"
                            />
                            <Input
                              value={editFields.modelId}
                              onChange={(e) => setEditFields((f) => ({ ...f, modelId: e.target.value }))}
                              placeholder="Model ID"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={editFields.description}
                              onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                              placeholder="Description"
                              className="flex-1"
                            />
                            <Button size="icon" variant="ghost" onClick={() => saveEdit(m)} title="Save">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} title="Cancel">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{m.modelId}</p>
                            {m.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(m)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn('h-7 w-7 text-destructive hover:text-destructive')}
                              onClick={() => setDeleteTargetId(m.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete model?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} ({deleteTarget?.modelId}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTargetId && deleteModel(deleteTargetId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

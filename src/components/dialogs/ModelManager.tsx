// src/components/dialogs/ModelManager.tsx
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { toast } from 'sonner'
import { Search, Pencil, Trash2, Check, X, Plus, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Label } from '../ui/label'

export default function ModelManager({
  onClose,
  onUpdated,
  onOpenAddModel,
}: {
  onClose: () => void
  onUpdated?: () => void
  /** Parent should close this dialog and open AddModelDialog (OtherDialogs.tsx) */
  onOpenAddModel: () => void
}) {
  const [models, setModels] = useState<AiModel[]>([])
  const [q, setQ] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState({ name: '', modelId: '', description: '' })
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [screen, setScreen] = useState<'list' | 'confirm-delete'>('list')

  const load = useCallback(async (query?: string): Promise<AiModel[]> => {
    const url = query ? `/api/models?q=${encodeURIComponent(query)}` : '/api/models'
    const res = await fetch(url)
    if (!res.ok) return []
    return res.json()
  }, [])

  useEffect(() => {
    let mounted = true
    load().then(async (data) => {
      if (!mounted) return
      if (data.length === 0) {
        try {
          await fetch('/api/models', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Gemma4:E4B', modelId: 'gemma4:e4b', description: 'System Default Model' }),
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
  }, [load])

  async function handleSearch() {
    const data = await load(q)
    setModels(data)
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
    const res = await fetch(`/api/models/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch(`/api/models/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      toast.error(`Delete failed: ${err?.error || 'Unknown error'}`)
      cancelDelete()
      return
    }
    const newModels = await load()
    setModels(newModels)
    onUpdated?.()
    toast.success('Model deleted')
    cancelDelete()
  }

  function confirmDelete(id: string) {
    setDeleteTargetId(id)
    setScreen('confirm-delete')
  }

  function cancelDelete() {
    setDeleteTargetId(null)
    setScreen('list')
  }

  const deleteTarget = models.find((m) => m.id === deleteTargetId)

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        {screen === 'confirm-delete' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Delete model?
              </DialogTitle>
              <DialogDescription>
                <strong>{deleteTarget?.name}</strong> ({deleteTarget?.modelId}) will be permanently removed.
                This cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={cancelDelete}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                Cancel
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTargetId && deleteModel(deleteTargetId)}
              >
                Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <div>
                <DialogTitle>Manage models</DialogTitle>
                <DialogDescription>Search, edit, or remove activated models.</DialogDescription>
              </div>
            </DialogHeader>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  style={{ transform: 'translateY(-3px)' }}
                />
                <Input
                  className="pl-8"
                  placeholder="Search activated models…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ backgroundColor: 'var(--gray3)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
                />
              </div>
              <Button
                onClick={handleSearch}
                style={{ backgroundColor: 'var(--gray3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
              >
                Search
              </Button>
              <Button
                onClick={onOpenAddModel}
                className="flex-shrink-0"
                style={{ backgroundColor: 'var(--gray3)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add model
              </Button>
            </div>

            <ScrollArea type="auto" className="flex-1 px-2 min-h-0 pr-3">
              {models.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No models yet.</p>
              ) : (
                <div className="flex flex-col max-h-[320px] pr-1">
                  {models.map((m, i) => (
                    <div key={m.id}>
                      {i > 0 && <Separator />}
                      <div className="py-3">
                        {editingId === m.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Label>Name</Label>
                              <Label>Model ID</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={editFields.name}
                                onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Display name"
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              />
                              <Input
                                value={editFields.modelId}
                                onChange={(e) => setEditFields((f) => ({ ...f, modelId: e.target.value }))}
                                placeholder="Model ID"
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Label>Description</Label>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={editFields.description}
                                onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                                placeholder="Description"
                                className="flex-1"
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => saveEdit(m)}
                                title="Save"
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                                title="Cancel"
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              >
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => startEdit(m)}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn('h-7 w-7 text-destructive hover:text-destructive')}
                                onClick={() => confirmDelete(m.id)}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
// src/components/dialogs/KnowledgeDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'

import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { toast } from "@/src/components/ui/toast"
import { Textarea } from '../ui/textarea'
import { AlertTriangle, } from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import { KnowledgeFormData } from '@/src/types/dialog'
import { KnowledgeChunk } from '@/src/types/knowledge'

// ── PreviewKnowledgeDialog ──────────────────────────────────────────────────
export function PreviewKnowledgeDialog({
  open,
  title,
  chunks,
  onOpenChange,
}: {
  open: boolean
  title: string
  chunks: KnowledgeChunk[]
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea type="auto" className="flex-1 min-h-0 pr-1">
          <div className="flex flex-col gap-3 py-1 pr-3">
            {chunks.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground">No chunks available.</p>
                <br></br>
                <p>Note: newly upserted data to Pinecone may take a while to be detected.</p>
              </div>
            ) : (
              chunks
                .slice()
                .sort((a, b) => a.chunkIndex - b.chunkIndex)
                .map((chunk) => (
                  <div key={chunk.id} className="border-l-2 pl-3 py-1 border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Chunk {chunk.chunkIndex}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{chunk.preview}</p>
                  </div>
                ))
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            style={{ backgroundColor: 'var(--gray3)' }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── AddEditKnowledgeDialog ──────────────────────────────────────────────────
export function AddEditKnowledgeDialog({
  open,
  mode,
  initialData,
  onOpenChange,
  onSave,
}: {
  open: boolean
  mode: 'add' | 'edit'
  initialData?: KnowledgeFormData
  onOpenChange: (open: boolean) => void
  onSave?: (data: KnowledgeFormData) => Promise<void> | void
}) {
  const emptyForm: KnowledgeFormData = { title: '', category: '', content: '' }

  const [form, setForm] = useState<KnowledgeFormData>(initialData ?? emptyForm)
  const [saving, setSaving] = useState(false)

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setForm(initialData ?? emptyForm)
  }

  const isValid =
    form.title.trim().length > 0 &&
    form.category.trim().length > 0 &&
    (form.content ?? '').trim().length > 0

  function update<K extends keyof KnowledgeFormData>(key: K, value: KnowledgeFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!isValid) {
      toast.add({
        title: "ERROR",
        description: "Description, category, and content are required.",
      })
      return
    }
    setSaving(true)
    try {
      await onSave?.(form)
      onOpenChange(false)
    } catch {
      // onSave (RAGList) already toasts the specific error — keep the dialog
      // open on failure so the user doesn't lose what they typed.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add knowledge' : 'Edit knowledge'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Define a new knowledge entry for the RAG data table.'
              : 'Update the details for this knowledge entry. This replaces the embedded content.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea type="auto" className="flex-1 min-h-0 pr-1">
          <div className="flex flex-col gap-4 py-1 pr-3">
            <div className="grid gap-1.5">
              <Label htmlFor="knowledge-description">Title</Label>
              <Textarea
                id="knowledge-description"
                placeholder="What does this knowledge source do?"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                style={{ backgroundColor: 'var(--gray3)' }}
                rows={3}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="knowledge-category">Category</Label>
              <Input
                id="knowledge-category"
                placeholder="e.g. Web Search"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                style={{ backgroundColor: 'var(--gray3)' }}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="knowledge-content">Content</Label>
              <Textarea
                id="knowledge-content"
                placeholder={
                  mode === 'add'
                    ? 'Full text to embed for retrieval.'
                    : 'Full text to re-embed. This replaces all existing chunks for this document.'
                }
                value={form.content ?? ''}
                onChange={(e) => update('content', e.target.value)}
                style={{ backgroundColor: 'var(--gray3)' }}
                rows={6}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            style={{ backgroundColor: 'var(--gray3)' }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !isValid} style={{ backgroundColor: 'var(--gray3)' }}>
            {saving ? (mode === 'add' ? 'Adding…' : 'Saving…') : mode === 'add' ? 'Add' : 'Save changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── DeleteKnowledgeDialog ─────────────────────────────────────────────────────
export function DeleteKnowledgeDialog({
  count,
  open,
  onOpenChange,
  onConfirm,
  deleting,
}: {
  count: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  deleting?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: 'var(--gray3)', borderColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Delete {count} knowledge {count === 1 ? 'item' : 'items'}?
          </DialogTitle>
          <DialogDescription>
            <strong>{count}</strong> selected {count === 1 ? 'entry' : 'entries'} and their embedded
            content will be permanently deleted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={deleting}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
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
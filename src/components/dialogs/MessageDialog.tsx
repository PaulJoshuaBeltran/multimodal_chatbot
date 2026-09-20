// src/components/dialogs/MessageDialog.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'

import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { DeleteMessageDialogProps, EditMessageDialogProps } from '@/src/types/props'
import { Textarea } from '../ui/textarea'
import { AlertTriangle } from 'lucide-react'

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
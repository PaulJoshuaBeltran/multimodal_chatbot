// src/components/main/ChatInput.tsx
'use client'

import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Square, MessageSquarePlus, Plus, ImageIcon, FileText, Music, Settings, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Attachment } from '@/src/types/msg_conversation_model'
import { ChatInputProps } from '@/src/types/props'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatInput({
  input,
  streaming,
  onInputChange,
  onSend,
  onStop,
  onOpenSystemPrompt,
  attachment,
  onAttachmentChange,
  token,
}: ChatInputProps & {
  attachment: Attachment | null
  onAttachmentChange: (a: Attachment | null) => void
  token: string | null
}) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelected(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)

      let res: Response
      try {
        res = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: form,
        })
      } catch {
        throw new Error('Network error — check your connection and try again.')
      }

      if (!res.ok) {
        let message = `Upload failed (${res.status})`
        try {
          const err = await res.json()
          if (err?.error) message = err.error
        } catch {
          // response wasn't JSON — keep the generic status message
        }
        throw new Error(message)
      }

      let meta: Attachment
      try {
        meta = await res.json()
      } catch {
        throw new Error('Server returned an invalid response.')
      }

      onAttachmentChange(meta)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 w-full" style={{ backgroundColor: 'var(--gray3)' }}>
      {/* Hidden native pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { handleFileSelected(e.target.files?.[0]); e.target.value = '' }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.zip"
        className="hidden"
        onChange={(e) => { handleFileSelected(e.target.files?.[0]); e.target.value = '' }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => { handleFileSelected(e.target.files?.[0]); e.target.value = '' }}
      />

      {/* Pending attachment preview */}
      {(attachment || uploading) && (
        <div className="mb-3 px-3 py-2 rounded-lg max-w-xs" style={{ backgroundColor: 'var(--gray2)' }}>
          {uploading ? (
            <span className="text-xs text-white/60">Uploading...</span>
          ) : (
            <>
              {attachment!.fileType === 'image' ? (
                <div className="rounded-lg overflow-hidden" style={{ height: 160, width: 280 }}>
                  <img
                    src={attachment!.url}
                    alt={attachment!.fileName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-white/70 shrink-0" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-xs text-white/80 truncate font-medium">{attachment!.fileName}</span>
                    <span className="text-xs text-white/50">{formatFileSize(attachment!.size)} · {(attachment!.mimeType.split('/')[1] || 'file').toUpperCase()}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => onAttachmentChange(null)}
                className="mt-2 text-xs text-white/60 hover:text-white/80 flex items-center gap-1"
                aria-label="Remove attachment"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 mx-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full h-10 w-10 text-white hover:text-white hover:bg-white/10"
              style={{ backgroundColor: 'var(--gray2)', borderColor: 'var(--gray2)', transform: 'translateY(-2px)' }}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48 mb-2" style={{ backgroundColor: 'var(--gray3)' }}>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => imageInputRef.current?.click()}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Image
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => docInputRef.current?.click()}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => audioInputRef.current?.click()}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <Music className="w-4 h-4 mr-2" />
              Upload Audio
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onOpenSystemPrompt}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 relative" style={{ backgroundColor: 'transparent' }}>
          <Textarea
            placeholder="Message AI..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                onSend()
              }
            }}
            className="min-h-[44px] max-h-32 resize-none rounded-2xl py-3 px-4 pr-12 text-white placeholder:text-white/40"
            style={{ backgroundColor: 'var(--gray2)', borderColor: 'var(--gray2)' }}
            rows={1}
          />
          {streaming ? (
            <Button size="icon" variant="destructive" onClick={onStop} className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-xl animate-pulse">
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              disabled={(!input.trim() && !attachment) || uploading}
              onClick={onSend}
              className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-xl text-white disabled:text-white/25"
              style={{ backgroundColor: 'transparent' }}
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

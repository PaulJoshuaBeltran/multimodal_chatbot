// src/components/main/ChatInput.tsx
'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog'
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
} from '../ui/attachment'
import { AspectRatio } from '../ui/aspect-ratio'
import { Square, MessageSquarePlus, Plus, ImageIcon, FileText, Music, Settings, X } from 'lucide-react'
import { toast } from 'sonner'
import type { Attachment as AttachmentData } from '@/src/types/msg_conversation_model'
import { ChatInputProps } from '@/src/types/props'
import ImagePreviewDialog from '../dialogs/ImagePreviewDialog'

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
}: ChatInputProps & {
  attachment: AttachmentData | null
  onAttachmentChange: (a: AttachmentData | null) => void
}) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [imageRatio, setImageRatio] = useState(1)

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

      let meta: AttachmentData
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

  const isImage = attachment?.fileType === 'image'

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
        <div className="mb-3">
          {uploading ? (
            <Attachment state="uploading" size="sm" className="max-w-xs">
              <AttachmentMedia variant="icon">
                <FileText />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>Uploading…</AttachmentTitle>
              </AttachmentContent>
            </Attachment>
          ) : (
            <AttachmentGroup>
              <Attachment size="default" className="max-w-xs">
                {isImage ? (
                  <>
                    <AttachmentTrigger
                      onClick={() => setPreviewOpen(true)}
                      className="hover:bg-white/10 rounded-2xl"
                      aria-label={`Open preview of ${attachment!.fileName}`}
                    />
                    <AttachmentMedia variant="image">
                      <Image
                        src={attachment!.url}
                        alt={attachment!.fileName}
                        fill
                        sizes="192px"
                        onLoad={(e) => {
                          const { naturalWidth, naturalHeight } = e.currentTarget
                          if (naturalWidth && naturalHeight) {
                            setImageRatio(naturalWidth / naturalHeight)
                          }
                        }}
                      />
                    </AttachmentMedia>
                  </>
                ) : (
                  <AttachmentMedia variant="icon">
                    <FileText />
                  </AttachmentMedia>
                )}
                <AttachmentContent>
                  <AttachmentTitle>{attachment!.fileName}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatFileSize(attachment!.size)}
                    {!isImage && ` · ${(attachment!.mimeType.split('/')[1] || 'file').toUpperCase()}`}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    aria-label="Remove attachment"
                    onClick={() => onAttachmentChange(null)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <X />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            </AttachmentGroup>
          )}
        </div>
      )}

      {/* Full-size image preview dialog */}
      {isImage && (
        <ImagePreviewDialog
          attachment={attachment}
          imageRatio={imageRatio}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
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
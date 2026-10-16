// src/components/main/ChatInput.tsx
'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
} from '../ui/attachment'
import { Square, MessageSquarePlus, Plus, ImageIcon, FileText, Music, Settings, X } from 'lucide-react'
import { toast } from "@/src/components/ui/toast"
import type { Attachment as AttachmentData, Message as ChatMessage } from '@/src/types/msg_conversation_model'
import { ChatInputProps } from '@/src/types/sidebar_dialog'
import ImagePreviewDialog from '../dialogs/ImagePreviewDialog'
import { cn } from '@/src/lib/utils'

const MAX_ATTACHMENTS = 5

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Rough heuristic (~4 chars/token for English). No tokenizer is wired up
// client-side, so treat this as an estimate, not an exact count.
function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export function ChatInput({
  input,
  streaming,
  onInputChange,
  onSend,
  onStop,
  onOpenSystemPrompt,
  attachments,
  onAttachmentsChange,
  numCtx,
  numPredict,
  historyMessages = [],
}: ChatInputProps & {
  attachments: AttachmentData[]
  onAttachmentsChange: Dispatch<SetStateAction<AttachmentData[]>>
  numCtx: number
  numPredict: number
  historyMessages?: ChatMessage[]
}) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const docInputRef = useRef<HTMLInputElement | null>(null)
  const audioInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [previewTarget, setPreviewTarget] = useState<AttachmentData | null>(null)
  const [ratios, setRatios] = useState<Record<string, number>>({})
  const uploading = uploadingCount > 0

  // Estimated usage: full history + current draft + reserved output tokens,
  // against the configured context window.
  const usage = useMemo(() => {
    const historyTokens = historyMessages.reduce(
      (sum, m) => sum + estimateTokens(m.content ?? ''),
      0
    )
    const inputTokens = estimateTokens(input)
    const used = historyTokens + inputTokens + numPredict
    const ratio = numCtx > 0 ? used / numCtx : 0
    return { used, ratio }
  }, [historyMessages, input, numPredict, numCtx])

  const isNearLimit = usage.ratio >= 0.8 && usage.ratio < 1
  const isOverLimit = usage.ratio >= 1

  async function uploadOne(file: File): Promise<AttachmentData> {
    const form = new FormData()
    form.append('file', file)

    let res: Response
    try {
      res = await fetch('/api/file/management/', {
        method: 'POST',
        body: form,
      })
    } catch {
      throw new Error(`${file.name}: network error, check your connection.`)
    }

    if (!res.ok) {
      let message = `Upload failed (${res.status})`
      try {
        const err = await res.json()
        if (err?.error) message = err.error
      } catch {
        // response wasn't JSON — keep the generic status message
      }
      throw new Error(`${file.name}: ${message}`)
    }

    try {
      return (await res.json()) as AttachmentData
    } catch {
      throw new Error(`${file.name}: server returned an invalid response.`)
    }
  }

  async function handleFilesSelected(files: File[]) {
    if (files.length === 0) return

    const room = MAX_ATTACHMENTS - attachments.length - uploadingCount
    if (room <= 0) {
      toast.add({
        title: 'ERROR',
        description: `Maximum ${MAX_ATTACHMENTS} attachments per message.`,
      })
      return
    }

    const batch = files.slice(0, room)
    if (files.length > room) {
      toast.add({
        title: 'INFO',
        description: `Only the first ${room} file(s) were added (limit ${MAX_ATTACHMENTS}).`,
      })
    }

    setUploadingCount((c) => c + batch.length)
    try {
      // allSettled keeps selection order and lets one failure not sink the rest
      const results = await Promise.allSettled(batch.map(uploadOne))
      const ok: AttachmentData[] = []
      for (const r of results) {
        if (r.status === 'fulfilled') {
          ok.push(r.value)
        } else {
          toast.add({
            title: 'ERROR',
            description: (r.reason as Error)?.message ?? 'Upload failed',
          })
        }
      }
      if (ok.length) onAttachmentsChange((prev) => [...prev, ...ok])
    } finally {
      setUploadingCount((c) => c - batch.length)
    }
  }

  function removeAttachment(url: string) {
    onAttachmentsChange((prev) => prev.filter((a) => a.url !== url))
    // Pending files were never sent, so clean up the orphan on disk
    const name = url.split('?')[0].split('/').pop()
    if (name) {
      fetch(`/api/file/management/${name}`, { method: 'DELETE' }).catch(() => {})
    }
  }

  // Copy the FileList BEFORE resetting value: clearing the input empties the live FileList
  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    void handleFilesSelected(files)
  }

  return (
    <div className="p-4 w-full" style={{ backgroundColor: 'var(--gray3)' }}>
      {/* Hidden native pickers */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.csv,.zip"
        multiple
        className="hidden"
        onChange={onPick}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {/* Pending attachments preview */}
      {(attachments.length > 0 || uploading) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((att) => {
            const isImage = att.fileType === 'image'
            return (
              <Attachment key={att.url} size="default" className="max-w-xs">
                {isImage ? (
                  <>
                    <AttachmentTrigger
                      onClick={() => setPreviewTarget(att)}
                      className="hover:bg-white/10 rounded-2xl"
                      aria-label={`Open preview of ${att.fileName}`}
                    />
                    <AttachmentMedia variant="image">
                      <Image
                        src={att.url}
                        alt={att.fileName}
                        fill
                        sizes="192px"
                        onLoad={(e) => {
                          const { naturalWidth, naturalHeight } = e.currentTarget
                          if (naturalWidth && naturalHeight) {
                            setRatios((r) => ({ ...r, [att.url]: naturalWidth / naturalHeight }))
                          }
                        }}
                      />
                    </AttachmentMedia>
                  </>
                ) : (
                  <AttachmentMedia variant="icon">
                    {att.fileType === 'audio' ? <Music /> : <FileText />}
                  </AttachmentMedia>
                )}
                <AttachmentContent>
                  <AttachmentTitle>{att.fileName}</AttachmentTitle>
                  <AttachmentDescription>
                    {formatFileSize(att.size)}
                    {!isImage && ` · ${(att.mimeType.split('/')[1] || 'file').toUpperCase()}`}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={`Remove ${att.fileName}`}
                    onClick={() => removeAttachment(att.url)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <X />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            )
          })}

          {Array.from({ length: uploadingCount }).map((_, i) => (
            <Attachment key={`uploading-${i}`} state="uploading" size="sm" className="max-w-xs">
              <AttachmentMedia variant="icon">
                <FileText />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>Uploading…</AttachmentTitle>
              </AttachmentContent>
            </Attachment>
          ))}
        </div>
      )}

      {/* Full-size image preview dialog */}
      {previewTarget && (
        <ImagePreviewDialog
          attachment={previewTarget}
          imageRatio={ratios[previewTarget.url] ?? 1}
          open
          onOpenChange={(open) => {
            if (!open) setPreviewTarget(null)
          }}
        />
      )}

      {/* Context usage indicator */}
      {(isNearLimit || isOverLimit) && (
        <div
          className={cn(
            "mb-1.5 text-xs flex items-center gap-1.5",
            isOverLimit ? "text-red-400" : "text-yellow-400"
          )}
        >
          <span>
            ~{usage.used.toLocaleString()} / {numCtx.toLocaleString()} tokens
            {' '}({Math.round(usage.ratio * 100)}%)
          </span>
          <span>
            {isOverLimit
              ? "— over context limit, reply will likely truncate mid-response"
              : "— approaching context limit"}
          </span>
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
              Upload Images
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => docInputRef.current?.click()}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Documents
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
              disabled={(!input.trim() && attachments.length === 0) || uploading}
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

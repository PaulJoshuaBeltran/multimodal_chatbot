// src/components/main/MessageBubble.tsx
'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Copy, RotateCcw, FileText, Music, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { HastNode } from '@/src/types/hast_nodes'
import type { Attachment } from '@/src/types/msg_conversation_model'

function rehypeHighlightQuery({ query }: { query?: string }) {
  return (tree: HastNode): void => {
    if (!query || !query.trim()) return
    const activeQuery: string = query

    function walk(node: HastNode): void {
      if (!node.children) return
      const classes = node.properties?.className
      const isProtected =
        node.tagName === 'code' ||
        node.tagName === 'pre' ||
        (Array.isArray(classes)
          ? classes.some((c) => typeof c === 'string' && (c.includes('math') || c.includes('katex')))
          : typeof classes === 'string' && (classes.includes('math') || classes.includes('katex')))
      if (isProtected) return

      const nextChildren: HastNode[] = []
      for (const child of node.children) {
        if (child.type === 'text') {
          const text = child.value || ''
          const escapedKeyword = activeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
          for (const part of parts) {
            if (part.toLowerCase() === activeQuery.toLowerCase()) {
              nextChildren.push({
                type: 'element',
                tagName: 'mark',
                properties: { style: 'background-color: #ffeb3b; padding: 0 2px; border-radius: 2px; color: #000;' },
                children: [{ type: 'text', value: part }],
              })
            } else if (part) {
              nextChildren.push({ type: 'text', value: part })
            }
          }
        } else {
          walk(child)
          nextChildren.push(child)
        }
      }
      node.children = nextChildren
    }
    walk(tree)
  }
}

function highlightLiveText(text: string, keyword?: string): React.JSX.Element {
  if (!keyword || !keyword.trim()) return <>{text}</>
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escapedKeyword})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <mark key={i} style={{ backgroundColor: 'var(--yellow2)', padding: '0 2px', borderRadius: 2, color: '#000' }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function escapePercentInMath(text: string): string {
  // Escape unescaped % inside $...$ and $$...$$ blocks
  return text.replace(/\$\$([\s\S]*?)\$\$|\$([^\$\n]*?)\$/g, (match, block, inline) => {
    const inner = block ?? inline
    const escaped = inner.replace(/(?<!\\)%/g, '\\%')
    return block !== undefined ? `$$${escaped}$$` : `$${escaped}$`
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AttachmentView({ att, isUserMessage }: { att: Attachment; isUserMessage?: boolean }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
        isUserMessage ? "bg-white/20 text-white" : "bg-red-500/10 text-red-600"
      )}>
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="truncate max-w-[200px]">Couldn&apos;t load {att.fileName}</span>
      </div>
    )
  }

  if (att.fileType === 'image') {
    return (
      <div className="relative w-48 rounded-lg overflow-hidden" style={{ height: 200 }}>
        <Image
          src={att.url}
          alt={att.fileName}
          fill
          sizes="192px"
          className="object-contain rounded-lg"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  if (att.fileType === 'audio') {
    return (
      <div className={cn(
        "flex flex-col gap-1 px-3 py-2 rounded-lg max-w-xs",
        isUserMessage ? "bg-white/20" : "bg-black/5"
      )}>
        <div className={cn(
          "flex items-center gap-2 text-xs",
          isUserMessage ? "text-white/80" : "text-black/60"
        )}>
          <Music className="w-4 h-4 shrink-0" />
          <span className="truncate">{att.fileName}</span>
        </div>
        <audio
          controls
          src={att.url}
          className="w-full h-8"
          onError={() => setFailed(true)}
        >
          Your browser doesn&apos;t support audio playback.
        </audio>
      </div>
    )
  }

  // document - show filename, size, and format on separate lines
  return (
    <a
      href={att.url}
      download={att.fileName}
      className={cn(
        "flex flex-col gap-1 px-3 py-2 rounded-lg transition",
        isUserMessage 
          ? "bg-white/20 hover:bg-white/30 text-white" 
          : "bg-black/5 hover:bg-black/10 text-black"
      )}
      onClick={async (e) => {
        e.preventDefault()
        try {
          const res = await fetch(att.url, { method: 'HEAD' })
          if (!res.ok) throw new Error()
          window.location.href = att.url
        } catch {
          setFailed(true)
        }
      }}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 shrink-0" />
        <span className={cn("text-xs truncate", isUserMessage ? "text-white" : "text-black")}>
          {att.fileName}
        </span>
      </div>
      <span className={cn(
        "text-xs ml-6",
        isUserMessage ? "text-white/80" : "text-black/60"
      )}>
        {formatFileSize(att.size)}
      </span>
      <span className={cn(
        "text-xs ml-6",
        isUserMessage ? "text-white/60" : "text-black/40"
      )}>
        {(att.mimeType.split('/')[1] || 'file').toUpperCase()}
      </span>
    </a>
  )
}

export default function MessageBubble({
  role,
  id,
  content,
  onEdit,
  onDelete,
  highlightQuery,
  onRegenerate,
  attachments
}: {
  role: 'user' | 'assistant'
  id?: string
  content: string
  onEdit?: () => void
  onDelete?: () => void
  highlightQuery?: string
  onRegenerate?: () => void
  attachments?: Attachment[] | null
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const isUser = role === 'user'
  const hasAttachments = attachments && attachments.length > 0

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      toast.info('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    }
  }

  return (
    <>
      <div
        id={id ? `msg-${id}` : undefined}
        className={cn(
          'flex flex-col mb-2 max-w-[80%]',
          isUser ? 'items-end ml-auto' : 'items-start mr-auto'
        )}
        style={{ alignSelf: isUser ? 'flex-end' : 'flex-start' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          .markdown-content p { margin: 0 0 0.6em 0; }
          .markdown-content p:last-child { margin-bottom: 0; }
          .markdown-content ul, .markdown-content ol { margin: 0 0 0.6em 0; padding-left: 1.25em; }
          .markdown-content li { margin-bottom: 0.25em; }
          .markdown-content h1 { font-size: 1.35rem; font-weight: 700; margin: 1em 0 0.4em; }
          .markdown-content h2 { font-size: 1.15rem; font-weight: 600; margin: 0.9em 0 0.35em; }
          .markdown-content h3 { font-size: 1rem; font-weight: 600; margin: 0.8em 0 0.3em; }
          .markdown-content code { background: rgba(0,0,0,0.08); padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.875em; }
          .markdown-content pre { background: #1e1e1e; color: #d4d4d4; padding: 12px 14px; border-radius: 8px; overflow-x: auto; margin: 0.6em 0; }
          .markdown-content pre code { background: none; padding: 0; color: inherit; font-size: 0.8125rem; }
          .markdown-content table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 0.875rem; }
          .markdown-content th, .markdown-content td { border: 1px solid rgba(0,0,0,0.15); padding: 6px 10px; text-align: left; }
          .markdown-content th { background: rgba(0,0,0,0.05); font-weight: 600; }
          .markdown-content blockquote { border-left: 3px solid rgba(0,0,0,0.2); margin: 0.5em 0; padding: 0.25em 0.75em; color: rgba(0,0,0,0.65); }
          .message-actions { opacity: 0; transition: opacity 0.15s; }
          .message-row:hover .message-actions { opacity: 1; }
        ` }} />

        <div className="message-row relative flex items-center gap-1">
          {/* Action menu — positioned to the left for user messages */}
          {isUser && (
            <div className="message-actions flex-shrink-0">
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end" className="w-28"
                  style={{ backgroundColor: 'var(--gray3)' }}
                >
                  <DropdownMenuItem
                    onClick={() => { setMenuOpen(false); handleCopy() }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  >
                    <Copy className="w-3.5 h-3.5 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => { setMenuOpen(false); onEdit() }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => { setMenuOpen(false); onDelete() }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={cn(
              'px-4 py-2.5 rounded-2xl text-sm leading-relaxed overflow-x-auto min-h-[38px] flex flex-col',
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-sm border border-white'
                : 'bg-white text-black border rounded-bl-sm'
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap">{highlightLiveText(content, highlightQuery)}</div>
            ) : (
              <div className="markdown-content w-full">
                {content.trim() ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex, [rehypeHighlightQuery, { query: highlightQuery }]]}
                  >
                    {escapePercentInMath(content)}
                  </ReactMarkdown>
                ) : (
                  /* Instant visual placeholder matching line height while thinking */
                  <div className="flex items-center gap-1 py-0.5">
                    <span className="w-1.5 h-1.5 bg-black/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-black/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-black/40 rounded-full animate-bounce" />
                  </div>
                )}
              </div>
            )}
            
            {/* Attachments inside bubble for user messages */}
            {isUser && hasAttachments && (
              <div className="flex flex-col gap-2 mt-2">
                {attachments!.map((att, i) => (
                  <AttachmentView key={i} att={att} isUserMessage={isUser} />
                ))}
              </div>
            )}
          </div>

          {!isUser && (
            <div className="message-actions flex-shrink-0 flex gap-1">
              {onRegenerate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={onRegenerate}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                  aria-label="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full"
                onClick={handleCopy}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                aria-label="Copy message"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Attachments displayed below message for assistant */}
        {!isUser && hasAttachments && (
          <div className="flex flex-col gap-2 mt-2 w-full">
            {attachments!.map((att, i) => (
              <AttachmentView key={i} att={att} isUserMessage={isUser} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
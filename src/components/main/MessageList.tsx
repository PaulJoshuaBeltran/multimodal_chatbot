// src/components/main/MessageList.tsx
'use client'

import React, { useEffect, useState, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from '@/src/types/msg_conversation_model'
import { toast } from 'sonner'
import { DeleteMessageDialog, EditMessageDialog } from '../dialogs/OtherDialogs'

function formatDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function groupMessagesByDate(messages: Message[]) {
  const groups: { label: string; items: Message[] }[] = []
  for (const m of messages) {
    const ts = m.createdAt ?? new Date().toISOString()
    const label = formatDateLabel(new Date(ts))
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(m)
    } else {
      groups.push({ label, items: [m] })
    }
  }
  return groups
}

export default function MessageList({
  messages,
  streaming,
  isThinking,
  onEdit,
  onDelete,
  highlightQuery,
  onRegenerate,
}: {
  messages: Message[]
  streaming?: boolean
  isThinking?: boolean
  onEdit?: (id: string, content: string) => void
  onDelete?: (id: string) => void
  highlightQuery?: string
  onRegenerate?: (index: number) => void
}) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<{ id: string; content: string } | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [buttonPos, setButtonPos] = useState<{ left: number; bottom: number } | null>(null)

  // Callback ref: Runs as soon as the container div is mounted in the DOM
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      setScrollEl(null)
      return
    }

    // 1. Check for Radix ScrollArea or custom viewports
    const radixViewport = el.closest<HTMLElement>('[data-radix-scroll-area-viewport]')
    if (radixViewport) {
      setScrollEl(radixViewport)
      return
    }

    // 2. Walk up to find an element configured with scroll/auto overflow
    let node: HTMLElement | null = el.parentElement
    while (node && node !== document.body) {
      const style = getComputedStyle(node)
      const overflowY = style.overflowY || style.overflow
      if (/(auto|scroll|overlay)/.test(overflowY)) {
        break
      }
      node = node.parentElement
    }

    setScrollEl(node && node !== document.body ? node : document.documentElement)
  }, [])

  // Track scroll position and calculate button position
  useEffect(() => {
    if (!scrollEl) return
    const BOTTOM_THRESHOLD = 48

    function update() {
      if (!scrollEl) return

      const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight
      const atBottom =
        !canScroll ||
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < BOTTOM_THRESHOLD

      setIsAtBottom(atBottom)

      const rect = scrollEl.getBoundingClientRect()
      const calculatedBottom = window.innerHeight - rect.bottom + 16
      const safeBottom = Math.max(16, calculatedBottom)

      setButtonPos({
        left: rect.left + rect.width / 2,
        bottom: safeBottom,
      })
    }

    update()
    scrollEl.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(scrollEl)

    return () => {
      scrollEl.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      resizeObserver.disconnect()
    }
  }, [scrollEl, messages.length, streaming])

  function scrollToBottom() {
    scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' })
  }

  function openEdit(id: string, content: string) {
    setEditTarget({ id, content })
    setEditDraft(content)
    setEditDialogOpen(true)
  }

  function confirmEdit() {
    if (editTarget && onEdit) {
      onEdit(editTarget.id, editDraft || editTarget.content)
      toast.info('Message updated')
    }
    setEditDialogOpen(false)
    setEditTarget(null)
  }

  function openDelete(id: string) {
    setDeleteTargetId(id)
    setDeleteDialogOpen(true)
  }

  function confirmDelete() {
    if (deleteTargetId && onDelete) {
      onDelete(deleteTargetId)
      toast.info('Message deleted')
    }
    setDeleteDialogOpen(false)
    setDeleteTargetId(null)
  }

  if (messages.length === 0 && !streaming && !isThinking) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24 px-8 gap-3">
        <p className="text-muted-foreground text-sm">No messages yet. Send one to get started.</p>
      </div>
    )
  }

  const groups = groupMessagesByDate(messages)
  const lastMessage = messages[messages.length - 1]
  let flatIndex = -1

  return (
    <>
      <div ref={containerRef} className="flex flex-col gap-2 p-4 min-h-full">
        {groups.map(({ label, items }, groupIdx) => (
          <div key={`${label}-${groupIdx}`}>
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-xs text-muted-foreground/60 font-medium select-none px-1">
                {label}
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {items.map((m: Message) => {
              flatIndex++
              const currentIndex = flatIndex
              const isUser = m.role === 'user'

              type AttachmentItem = NonNullable<Message['attachments']>[number]
              type LegacyMessage = Message & { attachment?: AttachmentItem }
              const msg = m as LegacyMessage
              const attachmentArray = msg.attachment ? [msg.attachment] : msg.attachments
              return (
                <MessageBubble
                  key={m.id ?? `msg-${currentIndex}`}
                  id={m.id}
                  role={m.role as 'user' | 'assistant'}
                  content={m.content}
                  attachments={attachmentArray}
                  highlightQuery={highlightQuery}
                  onEdit={isUser && m.id && onEdit ? () => openEdit(m.id!, m.content) : undefined}
                  onDelete={isUser && m.id && onDelete ? () => openDelete(m.id!) : undefined}
                  onRegenerate={
                    m.role === 'assistant' && onRegenerate ? () => onRegenerate(currentIndex) : undefined
                  }
                />
              )
            })}
          </div>
        ))}

        {isThinking && streaming && lastMessage?.role === 'user' && (
          <MessageBubble role="assistant" content="" />
        )}
      </div>

      {/* Button to autoscroll to last contents */}
      {!isAtBottom && buttonPos && (
        <button
          type="button"
          onClick={scrollToBottom}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
          aria-label="Scroll to bottom"
          style={{ position: 'fixed', left: buttonPos.left, bottom: buttonPos.bottom, transform: 'translateX(-50%)' }}
          className="z-50 flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-background/90 text-foreground shadow-md backdrop-blur transition hover:bg-accent"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
          </svg>
        </button>
      )}

      {editDialogOpen && (
        <EditMessageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editDraft={editDraft}
          setEditDraft={setEditDraft}
          confirmEdit={confirmEdit}
        />
      )}

      {deleteDialogOpen && (
        <DeleteMessageDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          confirmDelete={confirmDelete}
        />
      )}
    </>
  )
}
// src/components/sidebar/ConversationList.tsx
'use client'

import React, { useState } from 'react'
import type { Conversation } from '@/src/types/msg_conversation_model'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from "@/src/components/ui/toast"
import { MoreVertical, Edit2, Trash2, Check, X, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { DeleteConversationDialog } from '../dialogs/ConversationDialog'
import { DateGroup, DateGroupLabel } from '@/src/types/date_group'

function getGroupLabel(date: Date, now: Date): DateGroupLabel {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const startOf7DaysAgo = new Date(startOfToday)
  startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 7)

  const startOf30DaysAgo = new Date(startOfToday)
  startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30)

  if (date >= startOfToday) return 'Today'
  if (date >= startOfYesterday) return 'Yesterday'
  if (date >= startOf7DaysAgo) return 'Previous 7 days'
  if (date >= startOf30DaysAgo) return 'Previous 30 days'

  // Older: group by "Month Year"
  return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

const GROUP_ORDER: DateGroupLabel[] = [
  'Today',
  'Yesterday',
  'Previous 7 days',
  'Previous 30 days',
]

function groupByDate<T extends { updatedAt?: string | Date | null }>(
  items: T[],
  ascendingSort: boolean = false
): DateGroup<T>[] {
  const now = new Date()
  const buckets = new Map<DateGroupLabel, T[]>()

  for (const item of items) {
    if (!item.updatedAt) continue
    const date = new Date(item.updatedAt)
    const label = getGroupLabel(date, now)
    if (!buckets.has(label)) buckets.set(label, [])
    buckets.get(label)!.push(item)
  }

  // Sort items within each bucket (newest first for descending)
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => {
      const ta = new Date(a.updatedAt!).getTime()
      const tb = new Date(b.updatedAt!).getTime()
      return ascendingSort ? ta - tb : tb - ta
    })
  }

  const sortedKeys = [...buckets.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a)
    const bi = GROUP_ORDER.indexOf(b)

    // Case 1: Both keys are named relative groups (Today, Yesterday, etc.)
    if (ai !== -1 && bi !== -1) {
      return ascendingSort ? bi - ai : ai - bi
    }

    // Case 2: One key is a named group, the other is a Month-Year string
    if (ai !== -1) return ascendingSort ? 1 : -1
    if (bi !== -1) return ascendingSort ? -1 : 1

    // Case 3: Both keys are Month-Year strings (compare most recent item timestamps)
    const timeA = new Date(buckets.get(a)![0].updatedAt!).getTime()
    const timeB = new Date(buckets.get(b)![0].updatedAt!).getTime()
    return ascendingSort ? timeA - timeB : timeB - timeA
  })

  return sortedKeys.map((label) => ({ label, items: buckets.get(label)! }))
}

export default function ConversationList({
  conversations,
  selectedConvId,
  onSelect,
  onUpdate,
  token,
}: {
  conversations: Conversation[]
  selectedConvId: string | null
  onSelect: (id: string) => void
  onUpdate: () => void
  token?: string | null
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  async function renameConversation(id: string) {
    if (!editTitle.trim()) return
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: editTitle }),
    })
    if (res.ok) {
      setEditingId(null)
      onUpdate()
      toast.add({
        title: "SUCCESS",
        description: 'Conversation renamed',
      })
    } else {
      toast.add({
        title: "ERROR",
        description: 'Rename failed',
      })
    }
  }

  async function deleteConversation(id: string) {
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      onUpdate()
      toast.add({
        title: "SUCCESS",
        description: 'Conversation deleted',
      })
    } else {
      toast.add({
        title: "ERROR",
        description: 'Delete failed',
      })
    }
    setDeleteTargetId(null)
  }

  const deleteTarget = conversations.find((c) => c.id === deleteTargetId)
  const groups = groupByDate(conversations, false)

  return (
    <div className="flex flex-col gap-0.5 pb-2">
      {conversations.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-3 text-center">
          No conversations yet. Create one to get started.
        </p>
      )}

      {groups.map(({ label, items }) => (
        <div key={label}>
          {/* Group header */}
          <p className="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider select-none">
            {label}
          </p>

          {items.map((c: Conversation) => {
            const isSelected = selectedConvId === c.id
            const isEditing = editingId === c.id

            return (
              <div
                key={c.id}
                className={cn(
                  'group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isSelected
                    ? 'bg-accent bg-[var(--gray1)]'
                    : 'hover:bg-muted/60'
                )}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameConversation(c.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="h-6 text-xs px-1.5 flex-1"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0"
                      onClick={() => renameConversation(c.id)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 flex-shrink-0"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                    <span
                      className="flex-1 truncate text-sm cursor-pointer"
                      onClick={() => onSelect(c.id)}
                    >
                      {c.title}
                    </span>

                    {/* 3-Dots Menu for Rename and Delete */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32" style={{ backgroundColor: 'var(--gray3)' }}>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingId(c.id)
                            setEditTitle(c.title)
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        >
                          <Edit2 className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTargetId(c.id)
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Delete confirmation */}
      <DeleteConversationDialog
        open={!!deleteTargetId}
        title={deleteTarget?.title}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        onConfirm={() => deleteTargetId && deleteConversation(deleteTargetId)}
      />
    </div>
  )
}

// src/components/sidebar/ConversationList.tsx
'use client'

import React, { useState } from 'react'
import type { Conversation } from '@/src/types/msg_conversation_model'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from 'sonner'
import { MoreVertical, Edit2, Trash2, Check, X, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { groupByDate } from '@/lib/dateGroups'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { DeleteConversationDialog } from '../dialogs/OtherDialogs'

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title: editTitle }),
    })
    if (res.ok) {
      setEditingId(null)
      onUpdate()
      toast.success('Conversation renamed')
    } else {
      toast.error('Rename failed')
    }
  }

  async function deleteConversation(id: string) {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE', headers })
    if (res.ok || res.status === 204) {
      onUpdate()
      toast.success('Conversation deleted')
    } else {
      toast.error('Delete failed')
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
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted/60 text-foreground/80'
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

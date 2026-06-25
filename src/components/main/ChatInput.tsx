// src/components/main/ChatInput.tsx
'use client'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Square, MessageSquarePlus, Plus, ImageIcon, FileText, Settings } from 'lucide-react'
import { ChatInputProps } from '@/src/types/props'

export function ChatInput({
  input,
  streaming,
  onInputChange,
  onSend,
  onStop,
  onOpenSystemPrompt,
}: ChatInputProps) {
  return (
    <div className="p-4 w-full" style={{ backgroundColor: 'var(--gray3)' }}>
      <div className="flex items-end gap-2 mx-auto">

        {/* Plus / attachment menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full h-10 w-10 text-white hover:text-white hover:bg-white/10"
              style={{
                backgroundColor: 'var(--gray2)',
                borderColor: 'var(--gray2)',
                transform: 'translateY(-2px)',
              }}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-48 mb-2"
            style={{ backgroundColor: 'var(--gray3)' }}
          >
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {}}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload Image
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {}}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload Document
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

        {/* Textarea + send/stop button */}
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
            <Button
              size="icon"
              variant="destructive"
              onClick={onStop}
              className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-xl animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              disabled={!input.trim()}
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

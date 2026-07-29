// src/components/sidebar/ChatSidebar.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import ConversationList from '@/src/components/sidebar/ConversationList'
import ModelSelect from '@/src/components/dialogs/ModelSelect'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  MessageSquarePlus,
  Search,
  Settings,
  Bot,
  LogOut,
  UserX,
  MoreVertical,
  Wrench,
} from 'lucide-react'
import { ChatSidebarProps } from '@/src/types/props'
import { SettingsDialog } from '@/src/components/dialogs/SettingsDialog'

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

export function ChatSidebar({
  conversations,
  selectedConv,
  currentView,
  selectedModel,
  modelsRefresh,
  onSelectConversation,
  onNewConversation,
  onSearch,
  onViewTools,
  onModelChange,
  onManageModels,
  onRefreshConversations,
  onLogout,
  onDeactivate,
}: Omit<ChatSidebarProps, 'token'>) {

  const [settingsOpen, setSettingsOpen] = useState(false)
  const { user } = useUser()
  const userName = user?.fullName || user?.firstName || 'User Account'

  return (
    <aside
      className="w-72 flex flex-col h-full flex-shrink-0"
      style={{ backgroundColor: 'var(--gray2)', color: 'white' }}
    >
      {/* Logo / title */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
          <Bot className="w-6 h-6" />
        </div>
        <span className="font-bold text-lg truncate">Multimodal Chatbot</span>
      </div>

      <Separator />

      {/* Nav actions */}
      <div className="flex flex-col gap-1 p-2">
        <Button
          variant="ghost"
          className="justify-start gap-2 text-sm font-normal text-white hover:text-white"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          onClick={onNewConversation}
        >
          <MessageSquarePlus className="w-4 h-4" />
          New conversation
        </Button>

        <Button
          variant="ghost"
          className="justify-start gap-2 text-sm font-normal text-white hover:text-white"
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          onClick={onSearch}
        >
          <Search className="w-4 h-4" />
          Search messages
        </Button>

        <Button
          variant="ghost"
          className="justify-start gap-2 text-sm font-normal text-white hover:text-white"
          style={currentView === 'tools' ? { backgroundColor: 'var(--gray1)' } : {}}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
          onMouseLeave={(e) => {
            if (currentView !== 'tools') e.currentTarget.style.backgroundColor = ''
          }}
          onClick={onViewTools}
        >
          <Wrench className="w-4 h-4" />
          Tools
        </Button>
      </div>

      <Separator />

      {/* Model selector */}
      <div className="px-3 py-2">
        <ModelSelect
          value={selectedModel?.id ?? null}
          onChange={onModelChange}
          onManage={onManageModels}
          refreshToken={modelsRefresh}
        />
      </div>

      <Separator />

      {/* Conversation list */}
      <ScrollArea type="auto" className="flex-1 px-2 min-h-0">
        <p
          className="text-xs font-medium px-2 py-2 uppercase tracking-wide"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Conversations
        </p>
        <ConversationList
          selectedConvId={selectedConv}
          onSelect={onSelectConversation}
          onUpdate={onRefreshConversations}
          conversations={conversations}
        />
      </ScrollArea>

      <Separator />

      {/* Footer: Settings + Account */}
      <div className="p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm font-normal text-white hover:text-white"
          onClick={() => setSettingsOpen(true)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
            <Settings className="w-4 h-6 mr-2" style={{ transform: 'translateX(5px)' }} />
          </div>
          <span className="truncate min-w-0">Settings</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm font-normal text-white hover:text-white"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {getInitials(userName)}
              </div>
              <span className="truncate min-w-0">{userName}</span>
              <MoreVertical className="w-4 h-4 ml-auto flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-52"
            style={{ backgroundColor: 'var(--gray3)' }}
          >
            <DropdownMenuItem
              onClick={onLogout}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDeactivate}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
              <UserX className="w-4 h-4 mr-2" />
              Deactivate account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  )
}
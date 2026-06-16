// src/components/ChatSidebar.tsx
'use client'

import React from 'react'
import ModelSelect from './ModelSelect'
import ConversationList from './ConversationList'
import type { Conversation, AiModel } from '@/src/types/msg_conversation_model'

interface ChatSidebarProps {
  token?: string | null;
  conversations: Conversation[];
  selectedConvId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onLogout: () => void;
  onManage: () => void;
  selectedModelId?: string | null;
  onModelChange?: (m: AiModel | null) => void;
  modelsRefresh?: number;
}

export default function ChatSidebar({
  token,
  conversations,
  selectedConvId,
  onSelect,
  onCreate,
  onUpdate,
  onLogout,
  onManage,
  selectedModelId,
  onModelChange,
  modelsRefresh
}: ChatSidebarProps) {
  return (
    <aside style={{ width: 300 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {/* ?? null explicitly prevents 'undefined' from being passed */}
        <ModelSelect 
          token={token ?? null} 
          value={selectedModelId ?? null} 
          onChange={onModelChange ?? (() => {})} 
          onManage={onManage} 
          refreshToken={modelsRefresh ?? 0} 
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Conversations</h3>
          {token ? <button onClick={onLogout}>Logout</button> : null}
        </div>
      </div>

      {/* Added missing selectedConvId and onUpdate props */}
      <ConversationList 
        selectedConvId={selectedConvId}
        onSelect={onSelect} 
        onCreate={onCreate} 
        onUpdate={onUpdate}
        token={token} 
        conversations={conversations} 
      />
    </aside>
  )
}
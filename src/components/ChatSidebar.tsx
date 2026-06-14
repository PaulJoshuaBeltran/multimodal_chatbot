// src/components/ChatSidebar.tsx
'use client'

import React from 'react'
import ModelSelect from './ModelSelect'
import ConversationList from './ConversationList'
import type { Conversation, AiModel } from '@/src/types/msg_conversation_model'

export default function ChatSidebar({ token, conversations, onSelect, onCreate, onLogout, onManage, selectedModelId, onModelChange, modelsRefresh }: { token?: string | null; conversations: Conversation[]; onSelect: (id: string) => void; onCreate: () => void; onLogout: () => void; onManage: () => void; selectedModelId?: string | null; onModelChange?: (m: AiModel | null) => void; modelsRefresh?: number }) {
  return (
    <aside style={{ width: 300 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        <ModelSelect token={token} value={selectedModelId ?? null} onChange={onModelChange ?? (() => {})} onManage={onManage} refreshToken={modelsRefresh} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Conversations</h3>
          {token ? <button onClick={onLogout}>Logout</button> : null}
        </div>
      </div>

      <ConversationList onSelect={onSelect} onCreate={onCreate} token={token} conversations={conversations} />
    </aside>
  )
}

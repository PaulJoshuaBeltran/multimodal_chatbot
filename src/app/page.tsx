// src/app/page.tsx
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, useClerk } from '@clerk/nextjs'
import MessageList from '@/src/components/tabs/MessageList'
import ModelManager from '@/src/components/sidebar/ModelManager'
import SearchDialog from '@/src/components/dialogs/SearchDialog'
import { ScrollArea } from '../components/ui/scroll-area'
import { toast } from "@/src/components/ui/toast"
import type {
  Conversation,
  Message as ChatMessage,
  AiModel,
  OllamaPayload,
  Attachment,
  Visualization,
} from '@/src/types/msg_conversation_model'
import type { StreamEvent, ChatPart } from '@/src/types/chat_parts'

import { ChatSidebar } from '../components/sidebar/ChatSidebar'
import { ChatInput } from '../components/main/ChatInput'
import { RAGList } from '../components/tabs/KnowledgeManagement'
import { ToolList } from '../components/tabs/ToolList'
import { HttpError } from '../models/http_error'
import { LoginSignup } from '../components/main/LoginSignup'
import { AddModelDialog, DeactivateAlertDialog } from '../components/dialogs/OtherDialogs'
import { NewConversationDialog } from '../components/dialogs/ConversationDialog'

// Main function
export default function Page() {
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState('account')
  function openSettings(tab: string) {
    setSettingsTab(tab)
    setSettingsOpen(true)
  }

  // AI generation parameters
  const [temperature, setTemperature] = useState(0.3)
  const [topP, setTopP] = useState(0.5)
  const [topK, setTopK] = useState(5)
  const [numCtx, setNumCtx] = useState(8192)
  const [numPredict, setNumPredict] = useState(2048)

  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [modelsRefresh, setModelsRefresh] = useState(0)
  const [showModelManager, setShowModelManager] = useState(false)
  const [showAddModelOpen, setShowAddModelOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'rag' | 'tools' | 'toolcall'>('chat')

  // Dialog open states
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [deactivateAlertOpen, setDeactivateAlertOpen] = useState(false)

  // Data fetching
  const fetchConversations = useCallback(async (q?: string) => {
    const url = q ? `/api/conversations?q=${encodeURIComponent(q)}` : '/api/conversations'
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setConversations(data)

      const convId: string = data[0]?.id
      setCurrentView('chat')
      setSelectedConv(convId)
      const res1 = await fetch(`/api/messages?conversationId=${convId}`)
      if (res1.ok) setMessages(await res1.json())
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) return
    let active = true
    ;(async () => {
      const res = await fetch('/api/conversations')
      if (!active) return
      if (res.ok) setConversations(await res.json())
    })()
    return () => {
      active = false
    }
  }, [isSignedIn])

  // Helper functions: message saved and stream includes messages (successful or error) & attachments
  function normalizeAttachments(a: unknown): Attachment[] {
    if (!a) return []
    if (typeof a === 'string') {
      try {
        const parsed = JSON.parse(a)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return Array.isArray(a) ? (a as Attachment[]) : []
  }
  function toContext(msgs: ChatMessage[]) {
    return msgs
      .filter((m) => !m.isError)
      .map((m) => ({
        role: m.role,
        content: m.content,
        attachments: normalizeAttachments(m.attachments),
      }))
  }
  const STREAM_ERR = /\n\n\[Error: ([\s\S]+)\]$/

  // Message loading
  async function loadMessages(convId: string) {
    setCurrentView('chat')
    setSelectedConv(convId)
    const res = await fetch(`/api/messages?conversationId=${convId}`)
    if (res.ok) setMessages(await res.json())
  }

  async function handleSelectSearchResult(conversationId: string, messageId?: string) {
    setCurrentView('chat')
    setSelectedConv(conversationId)
    const res = await fetch(`/api/messages?conversationId=${conversationId}`)
    if (res.ok) {
      setMessages(await res.json())
      if (messageId) {
        setTimeout(() => {
          const element = document.getElementById(`msg-${messageId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.style.outline = '2px solid #ffeb3b'
            setTimeout(() => {
              element.style.outline = 'none'
            }, 2000)
          }
        }, 300)
      }
    }
  }

  // AI generation
  async function generateAssistantReply(params: {
    messages: ChatMessage[]
    conversationId: string | null
    systemPrompt?: string
    temperature?: number
    topP?: number
    topK?: number
    numCtx?: number
    numPredict?: number
    onEvent: (ev: StreamEvent) => void
    signal: AbortSignal
  }): Promise<{ parts: ChatPart[]; error?: string }> {
    if (!selectedModel?.modelId) {
      toast.add({
        title: "ERROR",
        description: "No model selected",
      })
      setShowModelManager(true)
      throw new Error('No model selected')
    }

    const payload: OllamaPayload & {
      system?: string
      temperature?: number
      top_p?: number
      top_k?: number
      num_ctx?: number
      num_predict?: number
    } = {
      messages: params.messages,
      model: selectedModel.modelId,
    }

    if (params.systemPrompt?.trim()) payload.system = params.systemPrompt.trim()
    if (params.temperature !== undefined) payload.temperature = params.temperature
    if (params.topP !== undefined) payload.top_p = params.topP
    if (params.topK !== undefined) payload.top_k = params.topK
    if (params.numCtx !== undefined) payload.num_ctx = params.numCtx
    if (params.numPredict !== undefined) payload.num_predict = params.numPredict

    const res = await fetch('/api/chat/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new HttpError(errText || `HTTP ${res.status}`, res.status, errText)
    }

    const reader = res.body!.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let parts: ChatPart[] = []
    let error: string | undefined

    const handle = (line: string) => {
      if (!line.trim()) return
      let ev: StreamEvent
      try { ev = JSON.parse(line) } catch { return }
      if (ev.type === 'done') parts = ev.parts
      else if (ev.type === 'error') error = ev.message
      params.onEvent(ev)
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? '' // keep the partial trailing line for the next chunk
      lines.forEach(handle)
    }
    handle(buf)

    return { parts, error }
  }

  async function persistAssistant(
    convId: string,
    content: string,
    isError: boolean,
    attachments: Attachment[],
    visualizations: Visualization[],
  ): Promise<ChatMessage | null> {
    try {
      const r = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, role: 'assistant', content, attachments, visualizations, isError }),
      })
      return r.ok ? await r.json() : null
    } catch {
      return null
    }
  }

  async function runGeneration(convId: string, history: ChatMessage[]) {
    const controller = new AbortController()
    abortRef.current = controller
    const assistantIndex = history.length

    setIsThinking(true)
    setStreaming(true)
    setMessages([...history, { role: 'assistant', content: '', createdAt: new Date().toISOString() }])

    const patchAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
      setMessages((prev) => {
        const copy = [...prev]
        if (copy[assistantIndex]) copy[assistantIndex] = fn(copy[assistantIndex])
        return copy
      })

    let streamed = ''
    const visualizations: Visualization[] = []
    const attachments: Attachment[] = []
    let errorText: string | null = null

    try {
      const result = await generateAssistantReply({
        messages: toContext(history),
        conversationId: convId,
        systemPrompt, temperature, topP, topK, numCtx, numPredict,
        signal: controller.signal,
        onEvent: (ev) => {
          setIsThinking(false)
          switch (ev.type) {
            case 'text':
              streamed += ev.text
              patchAssistant((m) => ({ ...m, content: (m.content ?? '') + ev.text }))
              break
            case 'visualization':
              visualizations.push({ name: ev.name, args: ev.args })
              patchAssistant((m) => ({ ...m, visualizations: [...visualizations] }))
              break
            case 'image':
            case 'document':
              attachments.push({
                url: ev.url, fileName: ev.fileName, mimeType: ev.mimeType, size: ev.size, fileType: ev.type,
              } as Attachment)
              patchAssistant((m) => ({ ...m, attachments: [...attachments] }))
              break
          }
        },
      })
      if (result.error) errorText = result.error
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        errorText = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    const isError = errorText !== null
    const content = isError
      ? streamed ? `${streamed}\n\n⚠️ Ollama: ${errorText}` : `⚠️ Ollama: ${errorText}`
      : streamed

    setIsThinking(false)
    setStreaming(false)

    if (!content.trim() && !visualizations.length && !attachments.length) {
      setMessages((prev) => prev.slice(0, assistantIndex)) // aborted before anything arrived
      return
    }

    patchAssistant((m) => ({ ...m, role: 'assistant', content, isError }))

    if (isError) {
      toast.add({ title: 'ERROR', description: errorText ?? 'Generation failed' })
    }

    const saved = await persistAssistant(convId, content, isError, attachments, visualizations)
    if (saved) {
      setMessages((prev) => {
        const copy = [...prev]
        const cur = copy[assistantIndex]
        if (cur && !cur.id && cur.content === content) copy[assistantIndex] = saved
        return copy
      })
    }
  }

  // Regenerate
  async function handleRegenerateFromIndex(index: number) {
    if (!selectedConv || streaming) return
    if (!selectedModel?.modelId) {
      toast.add({ title: 'ERROR', description: 'No model selected' })
      setShowModelManager(true)
      return
    }

    // remove the old assistant row(s) from the DB so they don't reappear on reload
    const stale = messages.slice(index).filter((m) => m.id)
    await Promise.all(
      stale.map((m) => fetch(`/api/messages/${m.id}`, { method: 'DELETE' }))
    )

    await runGeneration(selectedConv, messages.slice(0, index))
  }

  // Send
  async function send() {
    if ((!input.trim() && pendingAttachments.length === 0) || streaming) return
    if (!selectedConv) {
      toast.add({ title: 'ERROR', description: 'No conversation selected' })
      return
    }
    if (!selectedModel?.modelId) {
      toast.add({ title: 'ERROR', description: 'No model selected' })
      setShowModelManager(true)
      return
    }

    const convId = selectedConv
    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      attachments: pendingAttachments.length ? pendingAttachments : undefined,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setPendingAttachments([])
    setIsThinking(true)

    let userForHistory: ChatMessage = userMsg
    try {
      const saveRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: convId,
          role: 'user',
          content: userMsg.content,
          attachments: userMsg.attachments ?? [],
        }),
      })
      if (saveRes.ok) {
        const savedMsg: ChatMessage = await saveRes.json()
        // Never let the server response clobber the attachment we know we sent
        const savedAtt = normalizeAttachments(savedMsg.attachments)
        userForHistory = {
          ...savedMsg,
          attachments: savedAtt.length ? savedAtt : userMsg.attachments,
        }
      }
    } catch (err) {
      console.error('Failed to persist user message', err)
    }

    await runGeneration(convId, [...messages, userForHistory])
  }

  // Edit
  async function handleEditMessage(id: string, content: string) {
    if (!selectedModel?.modelId) {
      toast.add({
        title: 'ERROR',
        description: 'No model selected: Please add or select an AI model first.',
      })
      setCurrentView('chat')
      setShowModelManager(true)
      return
    }
    if (!selectedConv || streaming) return

    const editedIndex = messages.findIndex((m) => m.id === id)
    if (editedIndex === -1) return

    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    const toDelete = messages.slice(editedIndex + 1).filter((m) => m.id)
    await Promise.all(
      toDelete.map((m) => fetch(`/api/messages/${m.id}`, { method: 'DELETE' }))
    )

    const updated = messages
      .slice(0, editedIndex + 1)
      .map((m) => (m.id === id ? { ...m, content } : m))

    await runGeneration(selectedConv, updated)
  }

  function stop() { abortRef.current?.abort(); setIsThinking(false); setStreaming(false) }

  async function handleDeactivate() {
    const res = await fetch('/api/account/deactivate', { method: 'DELETE' })
    if (res.ok) {
      toast.add({
        title: "SUCCESS",
        description: "Account deactivated: Your account and all data have been removed.",
      })
      await signOut()
      setConversations([])
      setMessages([])
      setCurrentView('chat')
    } else {
      toast.add({
        title: "ERROR",
        description: "Deactivation failed: Please try again.",
      })
    }
    setDeactivateAlertOpen(false)
  }

  // Unauthenticated landing
  if (isLoaded && !isSignedIn) {
    return <LoginSignup />
  }

  if (!isLoaded) return null // or a loading skeleton

  // Authenticated layout
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        selectedConv={selectedConv}
        currentView={currentView}
        selectedModel={selectedModel}
        modelsRefresh={modelsRefresh}
        onSelectConversation={loadMessages}
        onNewConversation={() => { setNewConvOpen(true); setCurrentView('chat') }}
        onSearch={() => { setIsSearchOpen(true); setCurrentView('chat') }}
        onViewRAG={() => setCurrentView('rag')}
        onViewTools={() => setCurrentView('tools')}
        onModelChange={(model) => setSelectedModel(model)}
        onManageModels={() => { setShowModelManager(true); setCurrentView('chat') }}
        onRefreshConversations={() => { fetchConversations(); setMessages([]); }}
        onLogout={() => {signOut(); setMessages([]); }}
        onDeactivate={() => setDeactivateAlertOpen(true)}
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        settingsTab={settingsTab}
        onOpenSettings={openSettings}
        temperature={temperature}
        setTemperature={setTemperature}
        topP={topP}
        setTopP={setTopP}
        topK={topK}
        setTopK={setTopK}
        numCtx={numCtx}
        setNumCtx={setNumCtx}
        numPredict={numPredict}
        setNumPredict={setNumPredict}
      />

      {/* Main content */}
      <main
        className="flex-1 flex flex-col min-w-0 min-h-0 relative"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        {currentView === 'chat' && (
          <>
            <ScrollArea
              type="auto"
              className="flex-1 min-h-0"
              style={{ backgroundColor: 'var(--gray3)' }}
            >
              <MessageList
                messages={messages}
                streaming={streaming}
                isThinking={isThinking}
                onEdit={handleEditMessage}
                onDelete={async (id: string) => {
                  await fetch(`/api/messages/${id}`, { method: 'DELETE' })
                  setMessages((prev) => prev.filter((m) => m.id !== id))
                  toast.add({
                    title: "SUCCESS",
                    description: "Message deleted",
                  })
                }}
                onRegenerate={handleRegenerateFromIndex}
              />
            </ScrollArea>

            <ChatInput
              input={input}
              streaming={streaming}
              onInputChange={setInput}
              onSend={send}
              onStop={stop}
              onOpenSystemPrompt={() => openSettings('system_prompt')}
              attachments={pendingAttachments}
              onAttachmentsChange={setPendingAttachments}
              numCtx={numCtx}
              numPredict={numPredict}
              historyMessages={messages}
            />
          </>
        )}
        {currentView === 'rag' && (
          <RAGList/>
        )}
        {currentView === 'tools' && (
          <ToolList/>
        )}
      </main>

      {/* Modals & dialogs */}
      <AddModelDialog
        open={showAddModelOpen}
        onOpenChange={(open) => {
          setShowAddModelOpen(open)
          if (!open) setShowModelManager(true)
        }}
        onAdded={() => setModelsRefresh((x) => x + 1)}
      />

      <DeactivateAlertDialog
        open={deactivateAlertOpen}
        onOpenChange={setDeactivateAlertOpen}
        onConfirm={handleDeactivate}
      />

      {showModelManager && (
        <ModelManager
          onClose={() => { setShowModelManager(false); setModelsRefresh((x) => x + 1) }}
          onUpdated={() => setModelsRefresh((x) => x + 1)}
          onOpenAddModel={() => {
            setShowModelManager(false)
            setShowAddModelOpen(true)
          }}
        />
      )}

      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
        onCreated={fetchConversations}
      />

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />
    </div>
  )
}
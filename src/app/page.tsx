// src/app/page.tsx
'use client'

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import MessageList from '@/src/components/main/MessageList'
import ModelManager from '@/src/components/dialogs/ModelManager'
import SearchDialog from '@/src/components/dialogs/SearchDialog'
import { ScrollArea } from '../components/ui/scroll-area'
import { toast } from 'sonner'
import type {
  Conversation,
  Message as ChatMessage,
  AiModel,
  OllamaPayload,
  Attachment,
} from '@/src/types/msg_conversation_model'

import { ChatSidebar } from '../components/sidebar/ChatSidebar'
import { ChatInput } from '../components/main/ChatInput'
import { ToolList } from '../components/main/ToolList'
import { AuthDialog, NewConversationDialog, DeactivateAlertDialog, AddModelDialog } from '../components/dialogs/OtherDialogs'
import { SystemPromptDialog } from '../components/dialogs/SystemPromptDialog'
import { HttpError } from '../models/http_error'
import { LoginSignup } from '../components/main/LoginSignup'

// Page
export default function Page() {
  const [auth, dispatch] = useReducer(
    (
      _: { token: string | null; ready: boolean },
      action: { token: string | null; ready: boolean }
    ) => action,
    { token: null, ready: false }
  )

  useEffect(() => {
    const stored = localStorage.getItem('token')
    dispatch({ token: stored, ready: true })
  }, [])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')

  // AI generation params
  const [temperature, setTemperature] = useState([0.3])
  const [topP, setTopP] = useState([0.5])
  const [topK, setTopK] = useState(5)

  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [modelsRefresh, setModelsRefresh] = useState(0)
  const [showModelManager, setShowModelManager] = useState(false)
  const [showAddModelOpen, setShowAddModelOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'tools'>('chat')

  // Dialog open states
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'signup'>('login')
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [systemPromptOpen, setSystemPromptOpen] = useState(false)
  const [deactivateAlertOpen, setDeactivateAlertOpen] = useState(false)

  // Data fetching
  const fetchConversations = useCallback(
    async (q?: string) => {
      const url = q
        ? `/api/conversations?q=${encodeURIComponent(q)}`
        : '/api/conversations'
      const res = await fetch(url, {
        headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      })
      if (res.ok) setConversations(await res.json())
    },
    [auth.token]
  )

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch('/api/conversations', {
        headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
      })
      if (!active) return
      if (res.ok) setConversations(await res.json())
    })()
    return () => {
      active = false
    }
  }, [auth.token])

  // Message loading
  async function loadMessages(convId: string) {
    setCurrentView('chat')
    setSelectedConv(convId)
    const res = await fetch(`/api/messages?conversationId=${convId}`, {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
    })
    if (res.ok) setMessages(await res.json())
  }

  async function handleSelectSearchResult(conversationId: string, messageId?: string) {
    setCurrentView('chat')
    setSelectedConv(conversationId)
    const res = await fetch(`/api/messages?conversationId=${conversationId}`, {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
    })
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
    onToken: (text: string) => void
    signal: AbortSignal
  }): Promise<string> {
    if (!selectedModel?.modelId) {
      toast.error('No model selected')
      setShowModelManager(true)
      throw new Error('No model selected')
    }

    const payload: OllamaPayload & {
      system?: string
      temperature?: number
      top_p?: number
      top_k?: number
    } = {
      messages: params.messages,
      model: selectedModel.modelId,
    }

    if (params.systemPrompt?.trim()) payload.system = params.systemPrompt.trim()
    if (params.temperature !== undefined) payload.temperature = params.temperature
    if (params.topP !== undefined) payload.top_p = params.topP
    if (params.topK !== undefined) payload.top_k = params.topK

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
    let full = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = dec.decode(value)
      full += chunk
      params.onToken(chunk)
    }

    return full
  }

  // Regenerate
  async function handleRegenerateFromIndex(index: number) {
    const controller = new AbortController()
    abortRef.current = controller
    if (!selectedConv) return

    const context = messages.slice(0, index).map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }))
    setIsThinking(true)
    setStreaming(true)

    let assistantIndex = index

    setMessages((prev) => {
      const copy = prev.slice(0, index) // drop the old (possibly errored) assistant message
      copy.push({ role: 'assistant', content: '', createdAt: new Date().toISOString() })
      assistantIndex = copy.length - 1
      return copy
    })

    try {
      await generateAssistantReply({
        messages: context,
        conversationId: selectedConv,
        systemPrompt,
        temperature: temperature[0],
        topP: topP[0],
        topK,
        signal: controller.signal,
        onToken: (text) => {
          setIsThinking(false)
          setMessages((prev) => {
            const copy = [...prev]
            const existing = copy[assistantIndex]
            copy[assistantIndex] = {
              role: 'assistant',
              content: (existing?.content ?? '') + text, // accumulate, don't overwrite
              createdAt: existing?.createdAt ?? new Date().toISOString(),
            }
            return copy
          })
        },
      })
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev]
        copy[assistantIndex] = {
          role: 'assistant',
          content: `Ollama failed to regenerate:\n\n${String(err)}`,
          createdAt: copy[assistantIndex]?.createdAt ?? new Date().toISOString(),
        }
        return copy
      })
    } finally {
      setIsThinking(false)
      setStreaming(false)
    }
  }

  async function send() {
    const controller = new AbortController()
    abortRef.current = controller
    if (!input.trim() || streaming) return

    if (!selectedConv) { toast.error('No conversation selected'); return }
    if (!selectedModel?.modelId) { toast.error('No model selected'); setShowModelManager(true); return }

    const nowIso = new Date().toISOString()
    const userMsg: ChatMessage & { createdAt?: string; attachments?: Attachment[] | null } = {
      role: 'user',
      content: input,
      attachments: pendingAttachment ? [pendingAttachment] : undefined,
      createdAt: nowIso,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setPendingAttachment(null)
    setIsThinking(true)

    const saveHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth.token) saveHeaders.Authorization = `Bearer ${auth.token}`
    const saveRes = await fetch('/api/messages', {
      method: 'POST',
      headers: saveHeaders,
      body: JSON.stringify({
        conversationId: selectedConv,
        role: 'user',
        content: userMsg.content,
        attachments: userMsg.attachments ?? [],
      }),
    })
    if (saveRes.ok) {
      const savedMsg = await saveRes.json()
      setMessages((prev) => prev.map((m) => (m === userMsg ? savedMsg : m)))
    }

    setStreaming(true)

    const contextMessages: ChatMessage[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }))

    let reply = ''

    try {
      reply = await generateAssistantReply({
        messages: contextMessages,
        conversationId: selectedConv,
        systemPrompt,
        temperature: temperature[0],
        topP: topP[0],
        topK,
        signal: controller.signal,
        onToken: (chunk) => {
          setIsThinking(false)
          setMessages((prev) => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') {
              copy[copy.length - 1] = { role: 'assistant', content: last.content + chunk, createdAt: last.createdAt }
            } else {
              copy.push({ role: 'assistant', content: chunk, createdAt: new Date().toISOString() })
            }
            return copy
          })
        },
      })
    } catch (err) {
      const errorText =
        err instanceof Error ? `âš ï¸ Ollama ${err.message}` : 'âš ï¸ Ollama Unknown error'
      setMessages((prev) => {
        const copy = [...prev]
        if (copy.length && copy[copy.length - 1].role === 'assistant') {
          copy[copy.length - 1] = { role: 'assistant', content: errorText }
        } else {
          copy.push({ role: 'assistant', content: errorText })
        }
        return copy
      })
      toast.error(errorText)
    } finally {
      setIsThinking(false)
      setStreaming(false)
      if (reply) {
        const h: Record<string, string> = { 'Content-Type': 'application/json' }
        if (auth.token) h.Authorization = `Bearer ${auth.token}`
        const r = await fetch('/api/messages', {
          method: 'POST',
          headers: h,
          body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply, attachments: [] }),
        })
        if (r.ok) {
          const saved = await r.json()
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = saved
            return copy
          })
        }
      }
    }
  }

  // Edit message
  async function handleEditMessage(id: string, content: string) {
    if (!selectedModel?.modelId) {
      toast.error('No model selected: Please add or select an AI model first.')
      setCurrentView('chat')
      setShowModelManager(true)
      return
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`
    await fetch(`/api/messages/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ content }) })

    const editedIndex = messages.findIndex((m) => m.id === id)
    if (editedIndex === -1) return

    const updatedMessages = messages
      .slice(0, editedIndex + 1)
      .map((m) => (m.id === id ? { ...m, content } : m))
    setMessages(updatedMessages)

    const toDelete = messages.slice(editedIndex + 1).filter((m) => m.id)
    await Promise.all(
      toDelete.map((m) =>
        fetch(`/api/messages/${m.id}`, {
          method: 'DELETE',
          headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
        })
      )
    )

    if (!selectedConv) return
    setIsThinking(true)
    setStreaming(true)
    abortRef.current = new AbortController()
    const context = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments,
    }))

    let reply = ''
    try {
      reply = await generateAssistantReply({
        messages: context,
        conversationId: selectedConv,
        systemPrompt,
        temperature: temperature[0],
        topP: topP[0],
        topK,
        signal: abortRef.current.signal,
        onToken: (chunk) => {
          setIsThinking(false)
          setMessages((prev) => {
            const copy = [...prev]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') {
              copy[copy.length - 1] = { role: 'assistant', content: last.content + chunk }
            } else {
              copy.push({ role: 'assistant', content: chunk })
            }
            return copy
          })
        },
      })
    } catch (e: unknown) {
      const err = e as Error
      if (err.name !== 'AbortError') {
        reply = `Error connecting to model: ${err.message}`
        setMessages((prev) => {
          const copy = [...prev]
          if (copy.length > 0 && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === '') {
            copy[copy.length - 1] = { role: 'assistant', content: reply }
          } else {
            copy.push({ role: 'assistant', content: reply })
          }
          return copy
        })
      }
    } finally {
      setIsThinking(false)
      setStreaming(false)
      if (reply) {
        const h: Record<string, string> = { 'Content-Type': 'application/json' }
        if (auth.token) h.Authorization = `Bearer ${auth.token}`
        await fetch('/api/messages', {
          method: 'POST',
          headers: h,
          body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }),
        })
      }
    }
  }

  // Auth helpers
  function stop() { abortRef.current?.abort(); setIsThinking(false); setStreaming(false) }

  function handleLogin(tokenValue: string) {
    localStorage.setItem('token', tokenValue)
    dispatch({ token: tokenValue, ready: true })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    dispatch({ token: null, ready: true })
    setConversations([])
    setMessages([])
    setCurrentView('chat')
    toast.success('Signed out successfully')
  }

  async function handleDeactivate() {
    const res = await fetch('/api/auth/deactivate', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${auth.token}` },
    })
    if (res.ok) {
      toast.success('Account deactivated: Your account and all data have been removed.')
      handleLogout()
    } else {
      toast.error('Deactivation failed: Please try again.')
    }
    setDeactivateAlertOpen(false)
  }

  // Unauthenticated landing
  if (auth.ready && !auth.token) {
    return (
      <LoginSignup
        authDialogOpen={authDialogOpen}
        authDialogMode={authDialogMode}
        setAuthDialogOpen={setAuthDialogOpen}
        setAuthDialogMode={setAuthDialogMode}
        handleLogin={handleLogin}
      >
      </LoginSignup>
    )
  }

  // Authenticated layout
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* Sidebar */}
      <ChatSidebar
        token={auth.token}
        conversations={conversations}
        selectedConv={selectedConv}
        currentView={currentView}
        selectedModel={selectedModel}
        modelsRefresh={modelsRefresh}
        onSelectConversation={loadMessages}
        onNewConversation={() => { setNewConvOpen(true); setCurrentView('chat') }}
        onSearch={() => { setIsSearchOpen(true); setCurrentView('chat') }}
        onViewTools={() => setCurrentView('tools')}
        onModelChange={(m) => setSelectedModel(m)}
        onManageModels={() => { setShowModelManager(true); setCurrentView('chat') }}
        onRefreshConversations={() => fetchConversations()}
        onLogout={handleLogout}
        onDeactivate={() => setDeactivateAlertOpen(true)}
      />

      {/* Main content */}
      <main
        className="flex-1 flex flex-col min-w-0 min-h-0 relative"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        {currentView === 'chat' ? (
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
                  const headers: Record<string, string> = {}
                  if (auth.token) headers.Authorization = `Bearer ${auth.token}`
                  await fetch(`/api/messages/${id}`, { method: 'DELETE', headers })
                  setMessages((prev) => prev.filter((m) => m.id !== id))
                  toast.success('Message deleted')
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
              onOpenSystemPrompt={() => setSystemPromptOpen(true)}
              attachment={pendingAttachment}
              onAttachmentChange={setPendingAttachment}
              token={auth.token}
            />
          </>
        ) : (
          <ToolList />
        )}
      </main>

      {/* Modals & dialogs */}
      <AddModelDialog
        open={showAddModelOpen}
        onOpenChange={(open) => {
          setShowAddModelOpen(open)
          if (!open) setShowModelManager(true)
        }}
        token={auth.token}
        onAdded={() => setModelsRefresh((x) => x + 1)}
      />

      <AuthDialog
        open={authDialogOpen}
        mode={authDialogMode}
        onOpenChange={setAuthDialogOpen}
        onLogin={handleLogin}
      />

      <DeactivateAlertDialog
        open={deactivateAlertOpen}
        onOpenChange={setDeactivateAlertOpen}
        onConfirm={handleDeactivate}
      />

      {showModelManager && (
        <ModelManager
          token={auth.token}
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
        token={auth.token}
        onCreated={fetchConversations}
      />

      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        token={auth.token}
        onSelectResult={handleSelectSearchResult}
      />

      <SystemPromptDialog
        key={systemPromptOpen ? 'open' : 'closed'}
        open={systemPromptOpen}
        onOpenChange={setSystemPromptOpen}
        value={systemPrompt}
        onChange={setSystemPrompt}
        temperature={temperature}
        setTemperature={setTemperature}
        topP={topP}
        setTopP={setTopP}
        topK={topK}
        setTopK={setTopK}
      />
    </div>
  )
}

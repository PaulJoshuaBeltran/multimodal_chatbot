// src/app/page.tsx
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth, useClerk } from '@clerk/nextjs'
import MessageList from '@/src/components/main/MessageList'
import ModelManager from '@/src/components/dialogs/ModelManager'
import SearchDialog from '@/src/components/dialogs/SearchDialog'
import { ScrollArea } from '../components/ui/scroll-area'
import { toast } from "@/src/components/ui/toast"
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
import { NewConversationDialog, DeactivateAlertDialog, AddModelDialog } from '../components/dialogs/OtherDialogs'
import { SystemPromptDialog } from '../components/dialogs/SystemPromptDialog'
import { HttpError } from '../models/http_error'
import { LoginSignup } from '../components/main/LoginSignup'

// Page
export default function Page() {
  const { isLoaded, isSignedIn } = useAuth()
  const { signOut } = useClerk()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')

  // AI generation paramaters
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
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [systemPromptOpen, setSystemPromptOpen] = useState(false)
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
    onToken: (text: string) => void
    signal: AbortSignal
  }): Promise<string> {
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
      const copy = prev.slice(0, index)
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
              content: (existing?.content ?? '') + text,
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

    if (!selectedConv) {
      toast.add({
        title: "ERROR",
        description: "No conversation selected"
      })
      return
    }
    if (!selectedModel?.modelId) {
      toast.add({
        title: "ERROR",
        description: "No model selected",
      })
      setShowModelManager(true)
      return
    }

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

    const saveRes = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
        err instanceof Error ? `⚠️ Ollama ${err.message}` : '⚠️ Ollama Unknown error'
      setMessages((prev) => {
        const copy = [...prev]
        if (copy.length && copy[copy.length - 1].role === 'assistant') {
          copy[copy.length - 1] = { role: 'assistant', content: errorText }
        } else {
          copy.push({ role: 'assistant', content: errorText })
        }
        return copy
      })
      toast.add({
        title: "ERROR",
        description: errorText,
      })  
    } finally {
      setIsThinking(false)
      setStreaming(false)
      if (reply) {
        const r = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      // toast.error('No model selected: Please add or select an AI model first.')
      toast.add({
        title: "ERROR",
        description: "No model selected: Please add or select an AI model first.",
      })
      setCurrentView('chat')
      setShowModelManager(true)
      return
    }
    await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    const editedIndex = messages.findIndex((m) => m.id === id)
    if (editedIndex === -1) return

    const updatedMessages = messages
      .slice(0, editedIndex + 1)
      .map((m) => (m.id === id ? { ...m, content } : m))
    setMessages(updatedMessages)

    const toDelete = messages.slice(editedIndex + 1).filter((m) => m.id)
    await Promise.all(
      toDelete.map((m) => fetch(`/api/messages/${m.id}`, { method: 'DELETE' }))
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
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }),
        })
      }
    }
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
        onViewTools={() => setCurrentView('tools')}
        onModelChange={(model) => setSelectedModel(model)}
        onManageModels={() => { setShowModelManager(true); setCurrentView('chat') }}
        onRefreshConversations={() => fetchConversations()}
        onLogout={() => {signOut(); setMessages([]); }}
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
              onOpenSystemPrompt={() => setSystemPromptOpen(true)}
              attachment={pendingAttachment}
              onAttachmentChange={setPendingAttachment}
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
// src/app/page.tsx
'use client'

import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import ConversationList from '@/src/components/ConversationList'
import MessageList from '@/src/components/MessageList'
import ModelSelect from '@/src/components/ModelSelect'
import ModelManager from '@/src/components/ModelManager'
import SearchDialog from '@/src/components/SearchDialog'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'
import { Separator } from '../components/ui/separator'
import { Textarea } from '../components/ui/textarea'
import { ScrollArea } from '../components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Checkbox } from '../components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { toast } from 'sonner'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Square, MessageSquarePlus, Search, Settings, Bot, Plus, Image, FileText, LogOut, UserX, MoreVertical, Wrench, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Conversation, Message as ChatMessage, AiModel, ChatMessagePayload, OllamaPayload, RetryContext } from '@/src/types/msg_conversation_model'

class HttpError extends Error {
  status: number
  body?: string

  constructor(message: string, status: number, body?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

const MOCK_TOOLS = [
  { id: 'tool-1', name: 'Web Search', description: 'Queries search engines for live web information.', version: 'v1.0.2', category: 'Information' },
  { id: 'tool-2', name: 'Python Sandbox', description: 'Executes untrusted mathematical and algorithmic scripts securely.', version: 'v2.1.0', category: 'Runtime' },
  { id: 'tool-3', name: 'Document Parser', description: 'Extracts structural semantics from text, PDF, and CSV payloads.', version: 'v1.4.0', category: 'Data' },
  { id: 'tool-4', name: 'Image Vectorizer', description: 'Translates pixel layouts into relational coordinate systems.', version: 'v0.9.1', category: 'Vision' },
  { id: 'tool-5', name: 'Time-Zone Engine', description: 'Normalizes chronological structures across spatial zones.', version: 'v1.1.1', category: 'Utility' },
  { id: 'tool-6', name: 'Currency Evaluator', description: 'Fetches real-time financial conversions and spot prices.', version: 'v2.0.4', category: 'Finance' },
]

function getUserNameFromToken(token: string | null): string {
  if (!token) return 'Account'
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
    return JSON.parse(jsonPayload).name || 'User Account'
  } catch {
    return 'User Account'
  }
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

function AuthDialog({ open, mode, onOpenChange, onLogin }: {
  open: boolean; mode: 'login' | 'signup'; onOpenChange: (open: boolean) => void; onLogin: (token: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const body = mode === 'login' ? { email, password } : { name, email, password }
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const data = await res.json()
        if (data?.token) { onLogin(data.token); onOpenChange(false); toast.success(mode === 'login' ? 'Welcome back!' : 'Account created! You are now logged in.') }
        else toast.error('Authentication failed: Missing token in response.')
      } else toast.error('Authentication failed: Please check your credentials.')
    } catch (err) { toast.error('An error occurred while processing your request: ' + String(err)) }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Sign in' : 'Create account'}</DialogTitle>
          <DialogDescription>{mode === 'login' ? 'Enter your credentials to continue.' : 'Fill in the details below to get started.'}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {mode === 'signup' && <div className="flex flex-col gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} /></div>}
          <div className="flex flex-col gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} onKeyDown={(e) => e.key === 'Enter' && submit()} /></div>
          <Button onClick={submit} disabled={loading} className="w-full">{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewConversationDialog({ open, onOpenChange, token, onCreated }: {
  open: boolean; onOpenChange: (open: boolean) => void; token: string | null; onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!title.trim()) return
    if (!token) { toast.error('Not logged in: Please sign in to create a conversation.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title }) })
      if (res.ok) { setTitle(''); onCreated(); onOpenChange(false); toast.success('Conversation created') }
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>New conversation
          </DialogTitle>
          <DialogDescription>
            Give your conversation a title to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conv-title">Title</Label>
            <Input
              id="conv-title"
              placeholder="e.g. Research notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              disabled={loading} autoFocus
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            />
          </div>
          <Button
            onClick={create}
            disabled={loading || !title.trim()}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SystemPromptDialog({ open, onOpenChange, value, onChange }: {
  open: boolean; onOpenChange: (open: boolean) => void; value: string; onChange: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        style={{ backgroundColor: 'var(--gray3)' }}
      >
        <DialogHeader>
          <DialogTitle>
            AI Settings
          </DialogTitle>
          <DialogDescription>
            Set a custom system prompt & settings to guide the assistant behaviour.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="system-prompt">System settings</Label>
          <Textarea id="system-prompt" rows={6} placeholder="You are a helpful assistant…" value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => { onChange(draft); onOpenChange(false) }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
            Save
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            >
            Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Page() {
  const [auth, dispatch] = useReducer(
    (_: { token: string | null; ready: boolean }, action: { token: string | null; ready: boolean }) => action,
    { token: null, ready: false }
  )

  useEffect(() => {
    const stored = localStorage.getItem('token')
    dispatch({ token: stored, ready: true })
  }, [])

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null)
  const [modelsRefresh, setModelsRefresh] = useState(0)
  const [showModelManager, setShowModelManager] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentView, setCurrentView] = useState<'chat' | 'tools'>('chat')
  const [selectedTools, setSelectedTools] = useState<Record<string, boolean>>({ 'tool-1': true, 'tool-3': true })
  const [toolPage, setToolPage] = useState(1)
  const toolsPerPage = 4
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'signup'>('login')
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [systemPromptOpen, setSystemPromptOpen] = useState(false)
  const [deactivateAlertOpen, setDeactivateAlertOpen] = useState(false)

  const fetchConversations = useCallback(async (q?: string) => {
    const url = q ? `/api/conversations?q=${encodeURIComponent(q)}` : '/api/conversations'
    const res = await fetch(url, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
    if (res.ok) setConversations(await res.json())
  }, [auth.token])

  useEffect(() => {
    let active = true
    ;(async () => {
      const res = await fetch('/api/conversations', { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
      if (!active) return
      if (res.ok) setConversations(await res.json())
    })()
    return () => { active = false }
  }, [auth.token])

  async function loadMessages(convId: string) {
    setCurrentView('chat')
    setSelectedConv(convId)
    const res = await fetch(`/api/messages?conversationId=${convId}`, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
    if (res.ok) setMessages(await res.json())
  }

  async function handleSelectSearchResult(conversationId: string, messageId?: string) {
    setCurrentView('chat')
    setSelectedConv(conversationId)
    const res = await fetch(`/api/messages?conversationId=${conversationId}`, { headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })
    if (res.ok) {
      setMessages(await res.json())
      if (messageId) {
        setTimeout(() => {
          const element = document.getElementById(`msg-${messageId}`)
          if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.style.outline = '2px solid #ffeb3b'; setTimeout(() => { element.style.outline = 'none' }, 2000) }
        }, 300)
      }
    }
  }

  async function generateAssistantReply(
    params: {
      messages: ChatMessagePayload[]
      conversationId: string | null
      systemPrompt?: string
      onToken: (text: string) => void
      signal: AbortSignal
    }
  ): Promise<string> {
    if (!selectedModel?.modelId) {
      toast.error('No model selected')
      setShowModelManager(true)
      throw new Error('No model selected')
    }
    const payload: OllamaPayload & { system?: string } = {
      messages: params.messages,
      model: selectedModel.modelId,
    }

    if (params.systemPrompt?.trim()) {
      payload.system = params.systemPrompt.trim()
    }

    const res = await fetch('/api/chat/ollama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: params.signal,
    })

    if (!res.ok) {
      const errText = await res.text()

      throw new HttpError(
        errText || `HTTP ${res.status}`,
        res.status,
        errText
      )
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
  async function handleRegenerateFromIndex(index: number) {
    const controller = new AbortController()
    abortRef.current = controller
    
    if (!selectedConv) return

    const context = messages.slice(0, index).map(m => ({
      role: m.role,
      content: m.content,
    }))

    setStreaming(true)

    let assistantIndex = index + 1

    setMessages((prev) => {
      const copy = prev.slice(0, index + 1)
      copy.push({ role: 'assistant', content: '' })
      assistantIndex = copy.length - 1
      return copy
    })

    // let reply = '';

    try {
      await generateAssistantReply({
        messages: context,
        conversationId: selectedConv,
        systemPrompt,
        signal: controller.signal,
        onToken: (text) => {
          setMessages((prev) => {
            const copy = [...prev]
            copy[assistantIndex] = { role: 'assistant', content: text }
            return copy
          })
        },
      })
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev]
        copy[assistantIndex] = {
          role: 'assistant',
          content: `⚠️ Ollama failed to regenerate:\n${String(err)}`,
        }
        return copy
      })
    } finally {
      setStreaming(false)
    }
  }

  async function send() {
    const controller = new AbortController()
    abortRef.current = controller
    if (!input.trim() || streaming) return

    if (!selectedConv) {
      toast.error('No conversation selected')
      return
    }

    if (!selectedModel?.modelId) {
      toast.error('No model selected')
      setShowModelManager(true)
      return
    }

    const userMsg: ChatMessagePayload = {
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')

    const saveHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth.token) saveHeaders.Authorization = `Bearer ${auth.token}`
    const saveRes = await fetch('/api/messages', { method: 'POST', headers: saveHeaders, body: JSON.stringify({ conversationId: selectedConv, role: 'user', content: userMsg.content }) })
    if (saveRes.ok) { const savedMsg = await saveRes.json(); setMessages((prev) => prev.map((m) => (m === userMsg ? savedMsg : m))) }

    setStreaming(true)

    const contextMessages: ChatMessagePayload[] = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }))

    // build payload safely (no invalid typing tricks)
    const payload: OllamaPayload & { system?: string } = {
      messages: contextMessages,
      model: selectedModel.modelId,
    }

    if (systemPrompt.trim()) {
      payload.system = systemPrompt.trim()
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    let reply = '';

    try {
     reply = await generateAssistantReply({
      messages: [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      })),
      conversationId: selectedConv,
      systemPrompt,
      signal: controller.signal,
      onToken: (chunk) => {
        setMessages((prev) => {
          const copy = [...prev]
          const idx = copy.length - 1
          copy[idx] = {
            role: 'assistant',
            content: (copy[idx].content || '') + chunk,
          }
          return copy
        })
      }
    })
    } catch (err) {
      const errorText =
        err instanceof Error ? `⚠️ Ollama ${err.message}` : '⚠️ Ollama Unknown error'

      setMessages((prev) => {
        const copy = [...prev]

        // if assistant placeholder exists, replace it
        if (copy.length && copy[copy.length - 1].role === 'assistant') {
          copy[copy.length - 1] = {
            role: 'assistant',
            content: errorText,
          }
        } else {
          copy.push({
            role: 'assistant',
            content: errorText,
          })
        }

        return copy
      })

      toast.error(errorText)
    } finally {
      setStreaming(false)
      if (reply) {
        const h: Record<string, string> = { 'Content-Type': 'application/json' }
        if (auth.token) h.Authorization = `Bearer ${auth.token}`
        const r = await fetch('/api/messages', { method: 'POST', headers: h, body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }) })
        if (r.ok) { const saved = await r.json(); setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = saved; return copy }) }
      }
    }
  }

  function stop() { abortRef.current?.abort(); setStreaming(false) }

  function handleLogin(tokenValue: string) { localStorage.setItem('token', tokenValue); dispatch({ token: tokenValue, ready: true }) }

  function handleLogout() { localStorage.removeItem('token'); dispatch({ token: null, ready: true }); setConversations([]); setMessages([]); setCurrentView('chat'); toast.success('Signed out successfully') }

  async function handleDeactivate() {
    const res = await fetch('/api/auth/deactivate', { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } })
    if (res.ok) { toast.success('Account deactivated: Your account and all data have been removed.'); handleLogout() }
    else toast.error('Deactivation failed: Please try again.')
    setDeactivateAlertOpen(false)
  }

  async function handleEditMessage(id: string, content: string) {
    if (!selectedModel?.modelId) { toast.error('No model selected: Please add or select an AI model first.'); setCurrentView('chat'); setShowModelManager(true); return }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`
    await fetch(`/api/messages/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ content }) })
    const editedIndex = messages.findIndex((m) => m.id === id)
    if (editedIndex === -1) return
    const updatedMessages = messages.slice(0, editedIndex + 1).map((m) => (m.id === id ? { ...m, content } : m))
    setMessages(updatedMessages)
    const toDelete = messages.slice(editedIndex + 1).filter((m) => m.id)
    await Promise.all(toDelete.map((m) => fetch(`/api/messages/${m.id}`, { method: 'DELETE', headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined })))
    if (!selectedConv) return
    setStreaming(true)
    abortRef.current = new AbortController()
    const context = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
    const payload: { messages: { role: 'user' | 'assistant'; content: string }[]; model?: string; system?: string } = { messages: context, model: selectedModel.modelId }
    if (systemPrompt.trim()) payload.system = systemPrompt
    let reply = ''
    try {
      const res = await fetch('/api/chat/ollama', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: abortRef.current.signal })
      if (!res.ok) { const errText = await res.text(); throw new Error(errText || `HTTP status ${res.status}`) }
      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        setMessages((prev) => { const copy = [...prev]; copy[copy.length - 1] = { role: 'assistant', content: reply }; return copy })
      }
    } catch (e: unknown) {
      const err = e as Error
      if (err.name !== 'AbortError') {
        reply = `Error connecting to model: ${err.message}`
        setMessages((prev) => { const copy = [...prev]; if (copy.length > 0 && copy[copy.length - 1].role === 'assistant' && copy[copy.length - 1].content === '') { copy[copy.length - 1] = { role: 'assistant', content: reply } } else { copy.push({ role: 'assistant', content: reply }) }; return copy })
      }
    } finally {
      setStreaming(false)
      if (reply) {
        const h: Record<string, string> = { 'Content-Type': 'application/json' }
        if (auth.token) h.Authorization = `Bearer ${auth.token}`
        await fetch('/api/messages', { method: 'POST', headers: h, body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }) })
      }
    }
  }

  const toggleTool = (toolId: string) => setSelectedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }))
  const totalPages = Math.ceil(MOCK_TOOLS.length / toolsPerPage)
  const paginatedTools = MOCK_TOOLS.slice((toolPage - 1) * toolsPerPage, toolPage * toolsPerPage)
  const userName = getUserNameFromToken(auth.token)

  if (auth.ready && !auth.token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted"><Bot className="w-8 h-8 text-muted-foreground" /></div>
          <div><h1 className="text-2xl font-semibold tracking-tight">Welcome</h1><p className="text-sm text-muted-foreground mt-1">Sign in to start chatting with your AI assistant.</p></div>
          <div className="flex gap-3 w-full">
            <Button className="flex-1" onClick={() => { setAuthDialogMode('login'); setAuthDialogOpen(true) }}>Sign in</Button>
            <Button variant="outline" className="flex-1" onClick={() => { setAuthDialogMode('signup'); setAuthDialogOpen(true) }}>Create account</Button>
          </div>
        </div>
        <AuthDialog open={authDialogOpen} mode={authDialogMode} onOpenChange={setAuthDialogOpen} onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">

      {/* ── Sidebar: gray2 bg, white text ── */}
      <aside className="w-72 flex flex-col h-full flex-shrink-0" style={{ backgroundColor: 'var(--gray2)', color: 'white' }}>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0"><Bot className="w-6 h-6" /></div>
          <span className="font-bold text-lg truncate">Multimodal Chatbot</span>
        </div>
        <Separator />
        <div className="flex flex-col gap-1 p-2">
          <Button
            variant="ghost"
            className="justify-start gap-2 text-sm font-normal text-white hover:text-white"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            onClick={() => { setNewConvOpen(true); setCurrentView('chat') }}
          >
            <MessageSquarePlus className="w-4 h-4" />New conversation
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2 text-sm font-normal text-white hover:text-white"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
            onClick={() => { setIsSearchOpen(true); setCurrentView('chat') }}
          >
            <Search className="w-4 h-4" />Search messages
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-2 text-sm font-normal text-white hover:text-white"
            style={currentView === 'tools' ? { backgroundColor: 'var(--gray1)' } : {}}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')}
            onMouseLeave={(e) => { if (currentView !== 'tools') e.currentTarget.style.backgroundColor = '' }}
            onClick={() => setCurrentView('tools')}
          >
            <Wrench className="w-4 h-4" />Tools
          </Button>
        </div>
        <Separator />
        <div className="px-3 py-2">
          <ModelSelect
            token={auth.token}
            value={selectedModel?.id ?? null}
            onChange={(m) => setSelectedModel(m)}
            onManage={() => { setShowModelManager(true); setCurrentView('chat') }}
            refreshToken={modelsRefresh}
          />
        </div>
        <Separator />
        <ScrollArea type="auto" className="flex-1 px-2 min-h-0">
          <p className="text-xs font-medium px-2 py-2 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.6)' }}>Conversations</p>
          <ConversationList selectedConvId={selectedConv} onSelect={loadMessages} onCreate={() => fetchConversations()} onUpdate={() => fetchConversations()} token={auth.token} conversations={conversations} />
        </ScrollArea>
        <Separator />
        <div className="p-2">
          <Button variant="ghost" className="w-full justify-start gap-2 text-sm font-normal text-white hover:text-white" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              <Settings
                className="w-4 h-6 mr-2"
                style={{ transform: 'translateX(5px)' }}
              />
            </div>
            <span className="truncate min-w-0">Settings</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm font-normal text-white hover:text-white" onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray1)')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">{getInitials(userName)}</div>
                <span className="truncate min-w-0">{userName}</span>
                <MoreVertical className="w-4 h-4 ml-auto flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" style={{ backgroundColor: 'var(--gray3)' }}>
              <DropdownMenuItem
                onClick={handleLogout}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeactivateAlertOpen(true)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
              >
                <UserX className="w-4 h-4 mr-2" />Deactivate account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative" style={{ backgroundColor: 'var(--gray3)' }}>
        {currentView === 'chat' ? (
          <>
            {/* Message list */}
            <ScrollArea type="auto" className="flex-1 min-h-0" style={{ backgroundColor: 'var(--gray3)' }}>
              <MessageList
                messages={messages}
                streaming={streaming}
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

            {/* ── Chat input bar ── */}
            <div className="p-4 w-full" style={{ backgroundColor: 'var(--gray3)' }}>
              <div className="flex items-end gap-2 mx-auto">

                {/* Plus button: transparent bg, white border + icon */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0 rounded-full h-10 w-10 text-white hover:text-white hover:bg-white/10"
                      style={{ backgroundColor: 'var(--gray2)', borderColor: 'var(--gray2)', transform: 'translateY(-2px)' }}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="top" align="start" className="w-48 mb-2" style={{ backgroundColor: 'var(--gray3)' }}>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {}}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Image className="w-4 h-4 mr-2" />Upload Image
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {}}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <FileText className="w-4 h-4 mr-2" />Upload Document
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => setSystemPromptOpen(true)}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
                    >
                      <Settings className="w-4 h-4 mr-2" />System Settings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Textarea wrapper: transparent — no bg leaking outside rounded corners */}
                <div className="flex-1 relative" style={{ backgroundColor: 'transparent' }}>
                  <Textarea
                    placeholder="Message AI..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    className="min-h-[44px] max-h-32 resize-none rounded-2xl py-3 px-4 pr-12 text-white placeholder:text-white/40"
                    style={{ backgroundColor: 'var(--gray2)', borderColor: 'var(--gray2)' }}
                    rows={1}
                  />

                  {streaming ? (
                    <Button size="icon" variant="destructive" onClick={stop} className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-xl animate-pulse">
                      <Square className="w-4 h-4 fill-current" />
                    </Button>
                  ) : (
                    /* Send button: no filled background, white icon */
                    <Button
                      size="icon"
                      disabled={!input.trim()}
                      onClick={send}
                      className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-xl text-white disabled:text-white/25"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Tools view */
          <div className="flex-1 flex flex-col min-h-0 p-8 overflow-hidden max-w-5xl w-full mx-auto justify-start">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Wrench className="w-5 h-5 text-primary" />Available Capabilities & Tools</h1>
              <p className="text-sm text-muted-foreground mt-1">Enable or disable specialized modular execution plug-ins contextually accessible by active models.</p>
            </div>
            <ScrollArea type="auto" className="flex-1 min-h-0 border border-border rounded-xl bg-card">
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Active Status</TableHead>
                    <TableHead className="w-[200px] font-medium">Tool Name</TableHead>
                    <TableHead>Functional Description</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[100px] text-right">Build Release</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTools.map((tool) => (
                    <TableRow key={tool.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="align-middle py-4"><Checkbox id={tool.id} checked={!!selectedTools[tool.id]} onCheckedChange={() => toggleTool(tool.id)} /></TableCell>
                      <TableCell className="font-semibold text-foreground align-middle py-4"><label htmlFor={tool.id} className="cursor-pointer block">{tool.name}</label></TableCell>
                      <TableCell className="text-muted-foreground align-middle py-4">{tool.description}</TableCell>
                      <TableCell className="align-middle py-4"><span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">{tool.category}</span></TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono align-middle py-4">{tool.version}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex items-center justify-between border-t border-border pt-4 mt-4" style={{ backgroundColor: 'var(--gray3)' }}>
              <span className="text-sm text-muted-foreground">Showing Page <strong>{toolPage}</strong> of {totalPages} ({MOCK_TOOLS.length} elements total)</span>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setToolPage((p) => Math.max(p - 1, 1))} disabled={toolPage === 1} style={{ backgroundColor: 'var(--gray3)' }}><ChevronLeft className="h-4 w-4 mr-1" />Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setToolPage((p) => Math.min(p + 1, totalPages))} disabled={toolPage === totalPages} style={{ backgroundColor: 'var(--gray3)' }}>Next<ChevronRight className="h-4 w-4 ml-1" /></Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showModelManager &&
        <ModelManager
          token={auth.token}
          onClose={() => { setShowModelManager(false); setModelsRefresh((x) => x + 1) }}
          onUpdated={() => setModelsRefresh((x) => x + 1)}
      />}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        token={auth.token}
        onSelectResult={handleSelectSearchResult}
      />
      <NewConversationDialog
        open={newConvOpen}
        onOpenChange={setNewConvOpen}
        token={auth.token}
        onCreated={fetchConversations}
      />
      <SystemPromptDialog
        open={systemPromptOpen}
        onOpenChange={setSystemPromptOpen}
        value={systemPrompt}
        onChange={setSystemPrompt}
      />
      <AuthDialog
        open={authDialogOpen}
        mode={authDialogMode}
        onOpenChange={setAuthDialogOpen}
        onLogin={handleLogin}
      />

      <AlertDialog open={deactivateAlertOpen} onOpenChange={setDeactivateAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?
            </AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete your profile, conversations, models, and messages. This action cannot be undone.
              </AlertDialogDescription>
              </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeactivate}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
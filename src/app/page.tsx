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
import { MessageSquarePlus, Search, Settings, Bot, Plus, Image, FileText, LogOut, UserX, MoreVertical } from 'lucide-react'
import type { Conversation, Message as ChatMessage, AiModel } from '@/src/types/msg_conversation_model'

// ── helpers ───────────────────────────────────────────────────────────────────
function getUserNameFromToken(token: string | null): string {
  if (!token) return 'Account'
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload).name || 'User Account'
  } catch {
    return 'User Account'
  }
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}

// ── Auth Dialog Component ─────────────────────────────────────────────────────
function AuthDialog({
  open,
  mode,
  onOpenChange,
  onLogin,
}: {
  open: boolean
  mode: 'login' | 'signup'
  onOpenChange: (open: boolean) => void
  onLogin: (token: string) => void
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
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.token) {
          onLogin(data.token)
          onOpenChange(false)
          // toast({ title: mode === 'login' ? 'Welcome back!' : 'Account created!', description: 'You are now logged in.' })
          toast.success(mode === 'login' ? 'Welcome back!' : 'Account created! You are now logged in.')
        } else {
          // toast({ title: 'Authentication failed', description: 'Missing token in response.', variant: 'destructive' })
          toast.error('Authentication failed: Missing token in response.')
        }
      } else {
        // toast({ title: 'Authentication failed', description: 'Please check your credentials.', variant: 'destructive' })
        toast.error('Authentication failed: Please check your credentials.')
      }
    } catch (err) {
      // toast({ title: 'Error', description: String(err), variant: 'destructive' })
      toast.error('An error occurred while processing your request: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'login' ? 'Sign in' : 'Create account'}</DialogTitle>
          <DialogDescription>
            {mode === 'login' ? 'Enter your credentials to continue.' : 'Fill in the details below to get started.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── New Conversation Dialog ────────────────────────────────────────────────────
function NewConversationDialog({
  open,
  onOpenChange,
  token,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string | null
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function create() {
    if (!title.trim()) return
    if (!token) {
      // toast({ title: 'Not logged in', description: 'Please sign in to create a conversation.', variant: 'destructive' })
      toast.error('Not logged in: Please sign in to create a conversation.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setTitle('')
        onCreated()
        onOpenChange(false)
        // toast({ title: 'Conversation created' })
        toast.success('Conversation created')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Give your conversation a title to get started.</DialogDescription>
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
              disabled={loading}
              autoFocus
            />
          </div>
          <Button onClick={create} disabled={loading || !title.trim()}>
            {loading ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── System Prompt Dialog ──────────────────────────────────────────────────────
function SystemPromptDialog({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onChange: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>AI system prompt</DialogTitle>
          <DialogDescription>Set a custom system prompt to guide the assistant behaviour.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label htmlFor="system-prompt">System prompt</Label>
          <Textarea
            id="system-prompt"
            rows={6}
            placeholder="You are a helpful assistant…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => { onChange(draft); onOpenChange(false) }}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────
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

  // Dialog states
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authDialogMode, setAuthDialogMode] = useState<'login' | 'signup'>('login')
  const [newConvOpen, setNewConvOpen] = useState(false)
  const [systemPromptOpen, setSystemPromptOpen] = useState(false)
  const [deactivateAlertOpen, setDeactivateAlertOpen] = useState(false)

  // const { toast } = useToast()

  const fetchConversations = useCallback(
    async (q?: string) => {
      const url = q ? `/api/conversations?q=${encodeURIComponent(q)}` : '/api/conversations'
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
    return () => { active = false }
  }, [auth.token])

  async function loadMessages(convId: string) {
    setSelectedConv(convId)
    const res = await fetch(`/api/messages?conversationId=${convId}`, {
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : undefined,
    })
    if (res.ok) setMessages(await res.json())
  }

  async function handleSelectSearchResult(conversationId: string, messageId?: string) {
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
            setTimeout(() => { element.style.outline = 'none' }, 2000)
          }
        }, 300)
      }
    }
  }

  async function send() {
    if (!input.trim() || streaming) return
    if (!selectedConv) {
      // toast({ title: 'No conversation selected', description: 'Select or create a conversation first.', variant: 'destructive' })
      toast.error('No conversation selected: Please select or create a conversation first.')
      return
    }
    if (!selectedModel?.modelId) {
      // toast({ title: 'No model selected', description: 'Please add or select an AI model first.', variant: 'destructive' })
      toast.error('No model selected: Please add or select an AI model first.')  
      setShowModelManager(true)
      return
    }

    const userMsg = { role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (auth.token) headers.Authorization = `Bearer ${auth.token}`
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ conversationId: selectedConv, role: 'user', content: userMsg.content }),
      })
      if (response.ok) {
        const savedMsg = await response.json()
        setMessages((prev) => prev.map((m) => (m === userMsg ? savedMsg : m)))
      }
    }

    setStreaming(true)
    abortRef.current = new AbortController()

    const contextMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
    const payload: { messages: { role: 'user' | 'assistant'; content: string }[]; model?: string; system?: string } = {
      messages: contextMessages,
      model: selectedModel.modelId,
    }
    if (systemPrompt.trim()) payload.system = systemPrompt

    let reply = ''

    try {
      const res = await fetch('/api/chat/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP status ${res.status}`)
      }

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: reply }
          return copy
        })
      }
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
      setStreaming(false)
      if (reply) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (auth.token) headers.Authorization = `Bearer ${auth.token}`
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers,
          body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }),
        })
        if (response.ok) {
          const savedAssistantMsg = await response.json()
          setMessages((prev) => {
            const copy = [...prev]
            copy[copy.length - 1] = savedAssistantMsg
            return copy
          })
        }
      }
    }
  }

  function stop() {
    abortRef.current?.abort()
    setStreaming(false)
  }

  function handleLogin(tokenValue: string) {
    localStorage.setItem('token', tokenValue)
    dispatch({ token: tokenValue, ready: true })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    dispatch({ token: null, ready: true })
    setConversations([])
    setMessages([])
    // toast({ title: 'Signed out successfully' })
    toast.success('Signed out successfully')
  }

  async function handleDeactivate() {
    const headers: Record<string, string> = { Authorization: `Bearer ${auth.token}` }
    const res = await fetch('/api/auth/deactivate', { method: 'DELETE', headers })
    if (res.ok) {
      // toast({ title: 'Account deactivated', description: 'Your account and all data have been removed.' })
      toast.success('Account deactivated: Your account and all data have been removed.')
      handleLogout()
    } else {
      // toast({ title: 'Deactivation failed', description: 'Please try again.', variant: 'destructive' })
      toast.error('Deactivation failed: Please try again.')
    }
    setDeactivateAlertOpen(false)
  }

  async function handleEditMessage(id: string, content: string) {
    if (!selectedModel?.modelId) {
      // toast({ title: 'No model selected', description: 'Please add or select an AI model first.', variant: 'destructive' })
      toast.error('No model selected: Please add or select an AI model first.')
      setShowModelManager(true)
      return
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth.token) headers.Authorization = `Bearer ${auth.token}`

    await fetch(`/api/messages/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ content }) })

    const editedIndex = messages.findIndex((m) => m.id === id)
    if (editedIndex === -1) return

    const updatedMessages = messages.slice(0, editedIndex + 1).map((m) => (m.id === id ? { ...m, content } : m))
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
    setStreaming(true)
    abortRef.current = new AbortController()

    const context = updatedMessages.map((m) => ({ role: m.role, content: m.content }))
    const payload: { messages: { role: 'user' | 'assistant'; content: string }[]; model?: string; system?: string } = {
      messages: context,
      model: selectedModel.modelId,
    }
    if (systemPrompt.trim()) payload.system = systemPrompt

    let reply = ''

    try {
      const res = await fetch('/api/chat/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(errText || `HTTP status ${res.status}`)
      }

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: reply }
          return copy
        })
      }
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
      setStreaming(false)
      if (reply) {
        const saveHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
        if (auth.token) saveHeaders.Authorization = `Bearer ${auth.token}`
        await fetch('/api/messages', {
          method: 'POST',
          headers: saveHeaders,
          body: JSON.stringify({ conversationId: selectedConv, role: 'assistant', content: reply }),
        })
      }
    }
  }

  const userName = getUserNameFromToken(auth.token)

  // ── Not-logged-in state: no sidebar ──────────────────────────────────────────
  if (auth.ready && !auth.token) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 text-center max-w-sm px-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to start chatting with your AI assistant.</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              className="flex-1"
              onClick={() => { setAuthDialogMode('login'); setAuthDialogOpen(true) }}
            >
              Sign in
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setAuthDialogMode('signup'); setAuthDialogOpen(true) }}
            >
              Create account
            </Button>
          </div>
        </div>

        <AuthDialog
          open={authDialogOpen}
          mode={authDialogMode}
          onOpenChange={setAuthDialogOpen}
          onLogin={handleLogin}
        />
      </div>
    )
  }

  // ── Logged-in state ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-72 flex flex-col h-full border-r border-border flex-shrink-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg truncate">Multimodal Chatbot</span>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col gap-1 p-2">
          <Button variant="ghost" className="justify-start gap-2 text-sm font-normal" onClick={() => setNewConvOpen(true)}>
            <MessageSquarePlus className="w-4 h-4" />
            New conversation
          </Button>
          <Button variant="ghost" className="justify-start gap-2 text-sm font-normal" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-4 h-4" />
            Search messages
          </Button>
          <Button variant="ghost" className="justify-start gap-2 text-sm font-normal" onClick={() => setShowModelManager(true)}>
            <Bot className="w-4 h-4" />
            Models
          </Button>
        </div>

        <Separator />

        {/* Model selector */}
        <div className="px-3 py-2">
          <ModelSelect
            token={auth.token}
            value={selectedModel?.id ?? null}
            onChange={(m) => setSelectedModel(m)}
            onManage={() => setShowModelManager(true)}
            refreshToken={modelsRefresh}
          />
        </div>

        <Separator />

        {/* Conversation list */}
        <ScrollArea className="flex-1 px-2 min-h-0">
          <p className="text-xs font-medium text-muted-foreground px-2 py-2 uppercase tracking-wide">Conversations</p>
          <ConversationList
            selectedConvId={selectedConv}
            onSelect={loadMessages}
            onCreate={() => fetchConversations()}
            onUpdate={() => fetchConversations()}
            token={auth.token}
            conversations={conversations}
          />
        </ScrollArea>
        <Separator />

        {/* Account management */}
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm font-normal">
                <div className="w-6 h-6 border-white rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(userName)}
                </div>
                {/* min-w-0 ensures truncation works perfectly alongside ml-auto */}
                <span className="truncate min-w-0">{userName}</span>
                
                <MoreVertical className="w-4 h-4 ml-auto flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeactivateAlertOpen(true)}
              >
                <UserX className="w-4 h-4 mr-2" />
                Deactivate account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main chat area ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        <ScrollArea className="flex-1">
          <MessageList
            messages={messages}
            streaming={streaming}
            onEdit={handleEditMessage}
            onDelete={async (id: string) => {
              const headers: Record<string, string> = {}
              if (auth.token) headers.Authorization = `Bearer ${auth.token}`
              await fetch(`/api/messages/${id}`, { method: 'DELETE', headers })
              setMessages((prev) => prev.filter((m) => m.id !== id))
              // toast({ title: 'Message deleted' })
              toast.success('Message deleted')
            }}
          />
        </ScrollArea>

      {/* Chat Input Container */}
      <div className="p-4 bg-background border-t">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          
          {/* TODO 6: The compilation of Document, Image, and Settings behind a '+' button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 rounded-full h-10 w-10">
                <Plus className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48 mb-2">
              <DropdownMenuItem onClick={() => {/* Handle Image */}} className="cursor-pointer">
                <Image className="w-4 h-4 mr-2" />
                Upload Image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* Handle Document */}} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Upload Document
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSystemPromptOpen(true)} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                System Prompt
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 relative">
            <Textarea
              placeholder="Message AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              className="min-h-[44px] max-h-32 resize-none rounded-2xl py-3 px-4 pr-12"
              rows={1}
            />
            {/* Send Button overlapping textarea */}
            <Button 
              size="icon" 
              disabled={!input.trim() || streaming}
              onClick={send} 
              className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-xl"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </div>
    </main>

      {/* ── Models ── */}
      {showModelManager && (
        <ModelManager
          token={auth.token}
          onClose={() => {
            setShowModelManager(false)
            setModelsRefresh((x) => x + 1)
          }}
          onUpdated={() => setModelsRefresh((x) => x + 1)}
        />
      )}

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

      {/* Deactivate account alert */}
      <AlertDialog open={deactivateAlertOpen} onOpenChange={setDeactivateAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your profile, conversations, models, and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeactivate}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

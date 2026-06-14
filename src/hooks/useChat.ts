// src/hooks/useChat.ts
import { useCallback, useRef, useState } from 'react'
import type { Message } from '@/src/types/msg_conversation_model'
import { fetchJson } from '@/src/utils/api'

export default function useChat(token?: string | null) {
  const [messages, _setMessages] = useState<Message[]>([])
  const messagesRef = useRef<Message[]>([])

  const setMessages = (next: Message[] | ((prev: Message[]) => Message[])) => {
    if (typeof next === 'function') {
      const fn = next as (prev: Message[]) => Message[]
      _setMessages(prev => {
        const n = fn(prev)
        messagesRef.current = n
        return n
      })
    } else {
      messagesRef.current = next
      _setMessages(next)
    }
  }

  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await fetchJson<Message[]>(`/api/messages?conversationId=${conversationId}`, {}, token)
      setMessages(data ?? [])
    } catch (err) {
      console.error(err)
    }
  }, [token])

  const sendMessage = useCallback(async (conversationId: string, content: string, modelId?: string) => {
    if (!conversationId) throw new Error('missing conversation id')
    const userMsg: Message = { role: 'user', content }

    // optimistic local append
    const afterUser = [...messagesRef.current, userMsg]
    setMessages(afterUser)

    // persist user message (best-effort)
    try {
      await fetchJson('/api/messages', { method: 'POST', body: JSON.stringify({ conversationId, role: 'user', content }) }, token)
    } catch (err) {
      console.error('failed to persist user message', err)
    }

    setStreaming(true)
    abortRef.current = new AbortController()

    const context = messagesRef.current.map(m => ({ role: m.role, content: m.content }))
    type ChatPayload = { messages: { role: Message['role']; content: string }[]; model?: string }
    const payload: ChatPayload = { messages: context }
    if (modelId) payload.model = modelId

    try {
      const res = await fetch('/api/chat/ollama', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: abortRef.current.signal })
      if (!res.ok) {
        const text = await res.text()
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + text }])
        return
      }

      const reader = res.body!.getReader()
      const dec = new TextDecoder()
      let reply = ''

      // optimistic assistant
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += dec.decode(value)
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content: reply }
          return next
        })
      }

      // persist assistant
      try {
        await fetchJson('/api/messages', { method: 'POST', body: JSON.stringify({ conversationId, role: 'assistant', content: reply }) }, token)
      } catch (err) {
        console.error('failed to persist assistant message', err)
      }
    } catch (err) {
      const maybeErr = err as unknown as { name?: string }
      if (maybeErr.name === 'AbortError') {
        console.log('chat stream aborted')
      } else {
        console.error(err)
      }
    } finally {
      setStreaming(false)
    }
  }, [token])

  const editMessage = useCallback(async (id: string, content: string) => {
    try {
      await fetchJson(`/api/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }, token)
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, content } : m)))
    } catch (err) {
      console.error(err)
    }
  }, [token])

  const deleteMessage = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/messages/${id}`, { method: 'DELETE' }, token)
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error(err)
    }
  }, [token])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setStreaming(false)
  }, [])

  return { messages, streaming, loadMessages, sendMessage, editMessage, deleteMessage, stop, setMessages }
}

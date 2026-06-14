// src/hooks/useConversations.ts
import { useCallback, useEffect, useState } from 'react'
import type { Conversation } from '@/src/types/msg_conversation_model'
import { fetchJson } from '@/src/utils/api'

export default function useConversations(token?: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = useCallback(async (q?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = q ? `/api/conversations?q=${encodeURIComponent(q)}` : '/api/conversations'
      const data = await fetchJson<Conversation[]>(url, {}, token)
      setConversations(data ?? [])
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    // initial load with mounted guard
    let mounted = true
    ;(async () => {
      try {
        const data = await fetchJson<Conversation[]>('/api/conversations', {}, token)
        if (!mounted) return
        setConversations(data ?? [])
      } catch (err) {
        if (!mounted) return
        setError(String(err))
      }
    })()
    return () => { mounted = false }
  }, [token])

  const createConversation = useCallback(async (title?: string) => {
    const body = { title }
    const res = await fetchJson<Conversation>('/api/conversations', { method: 'POST', body: JSON.stringify(body) }, token)
    // refresh
    await loadConversations()
    return res
  }, [token, loadConversations])

  return { conversations, loading, error, loadConversations, createConversation }
}

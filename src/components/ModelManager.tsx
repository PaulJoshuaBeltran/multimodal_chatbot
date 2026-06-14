// src/components/ModelManager.tsx
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'

export default function ModelManager({ token, onClose, onUpdated }: { token?: string | null; onClose: () => void; onUpdated?: () => void }) {
  const [models, setModels] = useState<AiModel[]>([])
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [modelId, setModelId] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (q?: string): Promise<AiModel[]> => {
    const url = q ? `/api/models?q=${encodeURIComponent(q)}` : '/api/models'
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
    if (!res.ok) return [] as AiModel[]
    const data = await res.json()
    return data as AiModel[]
  }, [token])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await load()
        if (!mounted) return
        // schedule state update asynchronously to avoid cascading renders
        queueMicrotask(() => { if (mounted) setModels(data) })
      } catch (e) {
        console.error('Failed to load models:', e)
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [load])

  async function createModel(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('/api/models', { method: 'POST', headers, body: JSON.stringify({ name, modelId, description }) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown' }))
        alert('Create failed: ' + (err?.error || JSON.stringify(err)))
        return
      }
      setName('')
      setModelId('')
      setDescription('')
      const newModels = await load()
      setModels(newModels)
      onUpdated?.()
    } finally { setLoading(false) }
  }

  async function editModel(m: AiModel) {
    const newName = prompt('Name', m.name) || m.name
    const newModelId = prompt('Model identifier', m.modelId) || m.modelId
    const newDesc = prompt('Description', m.description || '') || m.description
    const headers: Record<string,string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/models/${m.id}`, { method: 'PATCH', headers, body: JSON.stringify({ name: newName, modelId: newModelId, description: newDesc }) })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      alert('Update failed: ' + (err?.error || JSON.stringify(err)))
      return
    }
    const newModels = await load()
    setModels(newModels)
    onUpdated?.()
  }

  async function deleteModel(m: AiModel) {
    if (!confirm('Delete model "' + m.name + '"?')) return
    const headers: Record<string,string> = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/models/${m.id}`, { method: 'DELETE', headers })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      alert('Delete failed: ' + (err?.error || JSON.stringify(err)))
      return
    }
    const newModels = await load()
    setModels(newModels)
    onUpdated?.()
  }

  return (
    <div style={{ position: 'fixed', inset: 20, background: '#fff', border: '1px solid #ddd', padding: 12, borderRadius: 8, zIndex: 1000, overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Model manager</h3>
        <div>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <input placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        <button onClick={() => load(q)} style={{ marginLeft: 8 }}>Search</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <form onSubmit={createModel} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Model identifier (eg. gemma4:e4b)" value={modelId} onChange={e => setModelId(e.target.value)} />
          <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          <button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add'}</button>
        </form>
      </div>

      <div style={{ marginTop: 12 }}>
        {models.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', padding: '8px 0' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.name} {m.isValid ? '' : '(invalid)'}</div>
              <div style={{ color: '#666', fontSize: 13 }}>{m.modelId} {m.description ? '— ' + m.description : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => editModel(m)}>Edit</button>
              <button onClick={() => deleteModel(m)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
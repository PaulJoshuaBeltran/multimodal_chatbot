// src/components/ModelManager.tsx
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'

const btnBase: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 13,
  borderRadius: 6,
  cursor: 'pointer',
}

const inputBase: React.CSSProperties = {
  padding: '6px 10px',
  fontSize: 13,
  borderRadius: 6,
}

export default function ModelManager({
  token,
  onClose,
  onUpdated,
}: {
  token?: string | null
  onClose: () => void
  onUpdated?: () => void
}) {
  const [models, setModels] = useState<AiModel[]>([])
  const [q, setQ] = useState('')
  const [name, setName] = useState('')
  const [modelId, setModelId] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState({ name: '', modelId: '', description: '' })

  const load = useCallback(
    async (query?: string): Promise<AiModel[]> => {
      const url = query ? `/api/models?q=${encodeURIComponent(query)}` : '/api/models'
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) return []
      return res.json()
    },
    [token]
  )

  useEffect(() => {
    let mounted = true
    load().then(async (data) => {
      if (!mounted) return
      
      // Auto-add gemma4:e4b if database is completely empty
      if (data.length === 0) {
        try {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' }
          if (token) headers.Authorization = `Bearer ${token}`
          await fetch('/api/models', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'Gemma 4', modelId: 'gemma4:e4b', description: 'System Default Model' }),
          })
          const freshData = await load()
          if (mounted) setModels(freshData)
        } catch (err) {
          console.error("Failed to seed default model", err)
        }
      } else {
        setModels(data)
      }
    })
    return () => {
      mounted = false
    }
  }, [load, token])

  async function handleSearch() {
    const data = await load(q)
    setModels(data)
  }

  async function createModel(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    if (!name.trim() || !modelId.trim()) {
      return alert('Error: Display Name and Model ID are required.')
    }
    if (models.some(m => m.modelId.toLowerCase() === modelId.trim().toLowerCase())) {
      return alert('Error: A model with this Model ID already exists.')
    }

    setLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('/api/models', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, modelId, description }),
      })
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
    } finally {
      setLoading(false)
    }
  }

  function startEdit(m: AiModel) {
    setEditingId(m.id)
    setEditFields({ name: m.name, modelId: m.modelId, description: m.description || '' })
  }

  async function saveEdit(m: AiModel) {
    // Validation
    if (!editFields.name.trim() || !editFields.modelId.trim()) {
      return alert('Error: Display Name and Model ID are required.')
    }
    if (models.some(mod => mod.id !== m.id && mod.modelId.toLowerCase() === editFields.modelId.trim().toLowerCase())) {
      return alert('Error: This Model ID is already in use by another model.')
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`/api/models/${m.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(editFields),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown' }))
      alert('Update failed: ' + (err?.error || JSON.stringify(err)))
      return
    }
    setEditingId(null)
    const newModels = await load()
    setModels(newModels)
    onUpdated?.()
  }

  async function deleteModel(m: AiModel) {
    if (!confirm(`Delete model "${m.name}"?`)) return
    const headers: Record<string, string> = {}
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
    // Backdrop
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Dialog */}
      <div
        style={{
          backgroundColor: '#000',
          color: '#fff',
          border: '1px solid #333',
          width: 580,
          maxWidth: '95vw',
          maxHeight: '85vh',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #222',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>
            Manage Models
          </h3>
          <button
            className="hover-ui"
            onClick={onClose}
            style={{
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 8px',
              borderRadius: 4,
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Search */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="hover-ui"
              placeholder="Search models…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{ ...inputBase, flex: 1 }}
            />
            <button className="hover-ui" onClick={handleSearch} style={btnBase}>
              Search
            </button>
          </div>

          {/* Add new model */}
          <div style={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: 8, padding: 14 }}>
            <p style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 600, color: '#ccc' }}>
              Add new model
            </p>
            <form onSubmit={createModel} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="hover-ui"
                  placeholder="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ ...inputBase, flex: 1 }}
                  required
                />
                <input
                  className="hover-ui"
                  placeholder="Model ID (e.g. gemma4:e4b)"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  style={{ ...inputBase, flex: 1 }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="hover-ui"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputBase, flex: 1 }}
                />
                <button
                  className="hover-ui"
                  type="submit"
                  disabled={loading}
                  style={{
                    ...btnBase,
                    padding: '6px 16px',
                  }}
                >
                  {loading ? 'Adding…' : '+ Add'}
                </button>
              </div>
            </form>
          </div>

          {/* Model list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {models.length === 0 && (
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No models yet.</p>
            )}
            {models.map((m, i) => (
              <div
                key={m.id}
                style={{
                  borderBottom: i < models.length - 1 ? '1px solid #222' : 'none',
                  padding: '12px 0',
                }}
              >
                {editingId === m.id ? (
                  // Inline edit form
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="hover-ui"
                        value={editFields.name}
                        onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                        style={{ ...inputBase, flex: 1 }}
                        placeholder="Display name"
                      />
                      <input
                        className="hover-ui"
                        value={editFields.modelId}
                        onChange={(e) => setEditFields((f) => ({ ...f, modelId: e.target.value }))}
                        style={{ ...inputBase, flex: 1 }}
                        placeholder="Model ID"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="hover-ui"
                        value={editFields.description}
                        onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                        style={{ ...inputBase, flex: 1 }}
                        placeholder="Description"
                      />
                      <button className="hover-ui" onClick={() => saveEdit(m)} style={btnBase}>
                        Save
                      </button>
                      <button className="hover-ui" onClick={() => setEditingId(null)} style={btnBase}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Read-only view
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{m.modelId}</div>
                      {m.description && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{m.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="hover-ui" onClick={() => startEdit(m)} style={btnBase}>
                        Edit
                      </button>
                      <button className="hover-ui" onClick={() => deleteModel(m)} style={{ ...btnBase, color: '#ff4444' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
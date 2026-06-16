// src/components/ModelSelect.tsx
'use client'

import React, { useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'

interface ModelSelectProps {
  token: string | null
  value: string | null
  onChange: (model: AiModel | null) => void
  onManage: () => void
  refreshToken: number
}

export default function ModelSelect({ token, value, onChange, onManage, refreshToken }: ModelSelectProps) {
  const [models, setModels] = useState<AiModel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    async function fetchModels() {
      setLoading(true)
      try {
        const res = await fetch('/api/models', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (res.ok && active) {
          const data = await res.json()
          setModels(data)
          // If a model was selected but deleted, or no model is selected and we have options, update state
          if (data.length > 0 && (!value || !data.find((m: AiModel) => m.id === value))) {
            onChange(data[0])
          } else if (data.length === 0) {
            onChange(null)
          }
        }
      } catch (err) {
        console.error("Failed to fetch models", err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchModels()
    return () => { active = false }
  }, [token, refreshToken, value, onChange])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#666' }}>AI Model</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select
          value={value || ''}
          onChange={(e) => {
            const selected = models.find((m) => m.id === e.target.value) || null
            onChange(selected)
          }}
          disabled={loading || models.length === 0}
          style={{
            flex: 1,
            padding: '6px 1px',
            borderRadius: 6,
            border: '1px solid #ccc',
            fontSize: 13,
            backgroundColor: '#000000',
            outline: 'none',
            cursor: models.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {models.length === 0 ? (
            <option value="" disabled>No models available</option>
          ) : (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.modelId})
              </option>
            ))
          )}
        </select>
        <button
          onClick={onManage}
          style={{
            padding: '6px 6px',
            fontSize: 13,
            borderRadius: 6,
            border: '1px solid #ccc',
            backgroundColor: '#000000',
            cursor: 'pointer',
          }}
        > ⚙️ </button>
      </div>
      {models.length === 0 && !loading && (
        <span style={{ fontSize: 11, color: '#d32f2f' }}>Please add or select a model to chat.</span>
      )}
    </div>
  )
}
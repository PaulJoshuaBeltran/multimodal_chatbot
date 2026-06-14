// src/components/ModelSelect.tsx
'use client'

import React, { useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'

export default function ModelSelect({ token, value, onChange, onManage, refreshToken }: { token?: string | null; value?: string | null; onChange: (m: AiModel | null) => void; onManage?: () => void; refreshToken?: number }) {
  const [models, setModels] = useState<AiModel[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      const res = await fetch('/api/models', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
      if (!mounted) return
      if (res.ok) setModels(await res.json())
    }
    load()
    return () => { mounted = false }
  }, [token, refreshToken])

  // builtin default model option
  const builtinId = 'builtin:gemma4:e4b'
  const builtinModel = {
    id: builtinId,
    name: 'gemma4:e4b (builtin)',
    modelId: 'gemma4:e4b',
    description: 'Built-in default model',
  } as unknown as AiModel

  useEffect(() => {
    // keep parent in sync when models list changes
    if (!value && models.length > 0) return
    const m = models.find(x => x.id === value) ?? (value === builtinId ? builtinModel : null)
    onChange(m)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models])

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    if (val === builtinId) return onChange(builtinModel)
    const m = models.find(m => m.id === val) ?? null
    onChange(m)
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select value={value ?? ''} onChange={handleChange} style={{ flex: 1 }}>
        <option value={builtinId}>{builtinModel.name} ({builtinModel.modelId})</option>
        <option value="">Select model</option>
        {models.map(m => (
          <option key={m.id} value={m.id}>{m.name} ({m.modelId})</option>
        ))}
      </select>
      <button onClick={onManage} style={{ padding: '6px 8px' }}>Manage</button>
    </div>
  )
}
// src/components/ModelSelect.tsx
'use client'

import React, { useEffect, useState } from 'react'
import type { AiModel } from '@/src/types/msg_conversation_model'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Settings2 } from 'lucide-react'

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
          if (data.length > 0 && (!value || !data.find((m: AiModel) => m.id === value))) {
            onChange(data[0])
          } else if (data.length === 0) {
            onChange(null)
          }
        }
      } catch (err) {
        console.error('Failed to fetch models', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchModels()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshToken])

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground font-medium">AI Model</Label>
      <div className="flex gap-1.5 items-center">
        <Select
          value={value || ''}
          onValueChange={(val) => {
            const selected = models.find((m) => m.id === val) || null
            onChange(selected)
          }}
          disabled={loading || models.length === 0}
        >
          <SelectTrigger className="flex-1 h-8 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <SelectValue placeholder={loading ? 'Loading…' : 'No models available'} />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.id} className="text-xs">
                <span className="font-medium">{m.name}</span>
                {/* <span className="font-medium">({m.modelId})</span> */}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onManage}
          title="Manage models"
        >
          <Settings2 className="w-4 h-4" />
        </Button>
      </div>
      {models.length === 0 && !loading && (
        <p className="text-xs text-destructive">Please add a model to start chatting.</p>
      )}
    </div>
  )
}

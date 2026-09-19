// src/lib/pineconeMongo/knowledgeApi.ts
import { KnowledgeDocument } from '@/src/types/knowledge'

async function parseError(res: Response, fallback: string) {
  const err = await res.json().catch(() => ({ error: fallback }))
  return err?.error || fallback
}

export async function fetchKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  const res = await fetch('/api/knowledge/all')
  if (!res.ok) throw new Error(await parseError(res, `Failed to load knowledge (${res.status})`))
  const data = await res.json()
  return (data.documents ?? []) as KnowledgeDocument[]
}

export async function createKnowledgeDocument(kbId: string, title: string, text: string) {
  const res = await fetch(`/api/knowledge/${encodeURIComponent(kbId)}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, text }),
  })
  if (!res.ok) throw new Error(await parseError(res, `Create failed (${res.status})`))
  return res.json()
}

export async function updateKnowledgeDocument(kbId: string, docId: string, title: string, text: string) {
  const res = await fetch(`/api/knowledge/${encodeURIComponent(kbId)}/documents/${docId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, text }),
  })
  if (!res.ok) throw new Error(await parseError(res, `Update failed (${res.status})`))
  return res.json()
}

export async function deleteKnowledgeDocument(kbId: string, docId: string) {
  const res = await fetch(`/api/knowledge/${encodeURIComponent(kbId)}/documents/${docId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await parseError(res, `Delete failed (${res.status})`))
  return res.json()
}
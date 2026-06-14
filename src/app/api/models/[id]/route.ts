// src/app/api/models/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ollama } from '@/lib/ollama'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  const { name, modelId, description } = body
  const m = await prisma.aiModel.findUnique({ where: { id } })
  if (!m) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  if (m.userId !== payload.userId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })

  if (modelId && modelId !== m.modelId) {
    try {
      await ollama.chat({ model: modelId, messages: [{ role: 'user', content: 'ping' }], stream: false })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Model validation failed', detail: String(err) }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
  }

  const updated = await prisma.aiModel.update({ where: { id }, data: { name: name ?? m.name, modelId: modelId ?? m.modelId, description: description ?? m.description } })
  return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const { id } = await params
  const m = await prisma.aiModel.findUnique({ where: { id } })
  if (!m) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  if (m.userId !== payload.userId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  await prisma.aiModel.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
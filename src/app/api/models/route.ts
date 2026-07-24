// src/app/api/models/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ollama } from '@/lib/ollama'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim() || undefined
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })

  const models = await prisma.aiModel.findMany({
    where: { userId: payload.userId },
    orderBy: { updatedAt: 'desc' },
  })

  const filtered = q
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(q.toLowerCase()) ||
          m.modelId.toLowerCase().includes(q.toLowerCase())
      )
    : models

  return new Response(JSON.stringify(filtered), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: Request) {
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const body = await req.json().catch(() => null)
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  const { name, modelId, description } = body
  if (!name || !modelId) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  // validate model with Ollama
  try {
    await ollama.chat({ model: modelId, messages: [{ role: 'user', content: 'ping' }], stream: false })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Model validation failed', detail: String(err) }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const model = await prisma.aiModel.create({ data: { name, modelId, description, userId: payload.userId } })
  return new Response(JSON.stringify(model), { status: 201, headers: { 'Content-Type': 'application/json' } })
}
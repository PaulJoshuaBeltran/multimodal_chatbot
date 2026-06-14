// src/app/api/models/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { ollama } from '@/lib/ollama'
import type { Prisma } from '@/src/app/generated/prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || undefined
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
  const where: Prisma.AiModelWhereInput = { userId: payload.userId }
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { modelId: { contains: q, mode: 'insensitive' } }]
  const models = await prisma.aiModel.findMany({ where, orderBy: { updatedAt: 'desc' } })
  return new Response(JSON.stringify(models), { status: 200, headers: { 'Content-Type': 'application/json' } })
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
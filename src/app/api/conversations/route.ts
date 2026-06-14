// src/app/api/conversations/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { getAuthToken } from '@/lib/auth'
import type { Prisma } from '@/src/app/generated/prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || undefined
  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null
  if (!payload) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })
  const where: Prisma.ConversationWhereInput = { userId: payload.userId }
  if (q) where.title = { contains: q, mode: 'insensitive' }
  const convs = await prisma.conversation.findMany({ where, orderBy: { updatedAt: 'desc' } })
  return new Response(JSON.stringify(convs), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: Request) {
  // debug request headers/token when 401 occurs
  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null
  if (!payload) {
    console.log('Unauthorized: missing or invalid token')
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }
  const { title } = await req.json()
  const conv = await prisma.conversation.create({ data: { title: title || 'Untitled', userId: payload.userId } })
  return new Response(JSON.stringify(conv), { status: 201, headers: { 'Content-Type': 'application/json' } })
}
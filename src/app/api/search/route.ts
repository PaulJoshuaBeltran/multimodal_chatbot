// src/app/api/search/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken, getAuthToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const token = getAuthToken(req)
  const payload = token ? verifyToken(token) : null

  if (!payload || !q.trim()) {
    return new Response(JSON.stringify({ conversations: [], messages: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // 1. Search conversation titles matching the substring keyword
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: payload.userId,
      title: { contains: q, mode: 'insensitive' },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // 2. Search message contents matching the substring keyword across user's conversations
  const messages = await prisma.message.findMany({
    where: {
      conversation: { userId: payload.userId },
      content: { contains: q, mode: 'insensitive' },
    },
    include: {
      conversation: {
        select: { title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return new Response(JSON.stringify({ conversations, messages }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
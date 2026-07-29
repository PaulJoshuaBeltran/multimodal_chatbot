// src/app/api/search/route.ts
import { prisma } from '@/lib/prisma'
import { getLocalUser } from '@/lib/get-local-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const user = await getLocalUser()

  if (!user || !q.trim()) {
    return new Response(JSON.stringify({ conversations: [], messages: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      title: { contains: q, mode: 'insensitive' },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const messages = await prisma.message.findMany({
    where: {
      conversation: { userId: user.id },
      content: { contains: q, mode: 'insensitive' },
    },
    include: {
      conversation: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return new Response(JSON.stringify({ conversations, messages }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
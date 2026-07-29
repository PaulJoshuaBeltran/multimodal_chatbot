// src/app/api/messages/route.ts
import { prisma } from '@/lib/prisma'
import { getLocalUser } from '@/lib/get-local-user'
import type { Prisma } from '@/src/app/generated/prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getLocalUser()
  if (!user) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })

  const url = new URL(req.url)
  const conversationId = url.searchParams.get('conversationId')
  const q = url.searchParams.get('q') || undefined

  if (conversationId) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conv || conv.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
  }

  const where: Prisma.MessageWhereInput = conversationId
    ? { conversationId }
    : { conversation: { userId: user.id } } // fallback: scope to this user's conversations only

  if (q) where.content = { contains: q, mode: 'insensitive' }
  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: 'asc' } })
  return new Response(JSON.stringify(messages), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: Request) {
  const user = await getLocalUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const { conversationId, role, content, attachments } = await req.json()
  if ((!content && (!attachments || attachments.length === 0)) || !role) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  let convId = conversationId
  if (!convId) {
    const conv = await prisma.conversation.create({ data: { title: 'New conversation', userId: user.id } })
    convId = conv.id
  } else {
    const conv = await prisma.conversation.findUnique({ where: { id: convId } })
    if (!conv || conv.userId !== user.id) return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  const attachment = attachments && attachments.length > 0 ? attachments[0] : undefined

  const message = await prisma.message.create({
    data: {
      conversationId: convId,
      role,
      content: content ?? '',
      ...(attachment ? { attachment } : {}),
    },
  })
  return new Response(JSON.stringify(message), { status: 201, headers: { 'Content-Type': 'application/json' } })
}
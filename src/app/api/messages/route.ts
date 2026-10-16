// src/app/api/messages/route.ts
import { prisma } from '@/src/lib/pineconeMongo/prisma'
import { getLocalUser } from '@/src/lib/getLocalUser'
import type { Prisma } from '@/src/app/generated/prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getLocalUser()
  if (!user) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } })

  const url = new URL(req.url)
  const rawConversationId = url.searchParams.get('conversationId')
  if (rawConversationId && !/^[a-f0-9]{24}$/i.test(rawConversationId)) {
    return new Response(JSON.stringify({ error: 'Invalid conversationId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const conversationId =
    rawConversationId && /^[a-f0-9]{24}$/i.test(rawConversationId) ? rawConversationId : null
  const q = url.searchParams.get('q') || undefined

  if (conversationId) {
    const conv = await prisma.conversation.findUnique({ where: { id: conversationId } })
    if (!conv || conv.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } })
    }
  }

  const where: Prisma.MessageWhereInput = conversationId
    ? { conversationId }
    : { conversation: { userId: user.id } } // fallback: scope to this user's conversations only

  if (q) where.content = { contains: q, mode: 'insensitive' }
  const withViz = { visualizations: { orderBy: { order: 'asc' as const } } }
  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: 'asc' }, include: withViz })
  return new Response(JSON.stringify(messages), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

function toAttachments(list: unknown) {
  if (!Array.isArray(list)) return []
  return list
    .filter((a) => a?.url && a?.fileName)
    .map((a) => ({
      url: a.url as string,
      fileName: a.fileName as string,
      fileType: a.fileType as string,
      mimeType: a.mimeType as string,
      size: a.size as number,
    }))
}
function toVisualizations(list: unknown) {
  if (!Array.isArray(list)) return []
  return list
    .filter((v) => typeof v?.name === 'string' && v.name.startsWith('visualize_') && v.args && typeof v.args === 'object')
    .map((v, i) => ({ name: v.name as string, args: v.args as Prisma.InputJsonObject, order: i }))
}

export async function POST(req: Request) {
  const user = await getLocalUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const { conversationId, role, content, attachments, visualizations, isError } = await req.json()
  const files = toAttachments(attachments)
  const viz = toVisualizations(visualizations)

  if ((!content && files.length === 0 && viz.length === 0) || !role) {
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

  const withViz = { visualizations: { orderBy: { order: 'asc' as const } } }
  const message = await prisma.message.create({
    data: {
      conversationId: convId,
      role,
      content: content ?? '',
      isError: Boolean(isError),
      attachments: files,
      visualizations: { create: viz },
    },
    include: withViz,
  })
  return new Response(JSON.stringify(message), { status: 201, headers: { 'Content-Type': 'application/json' } })
}
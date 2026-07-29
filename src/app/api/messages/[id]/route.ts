// src/app/api/messages/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { getLocalUser } from '@/lib/get-local-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const user = await getLocalUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const { id } = await params
  const { content } = await req.json()
  const m = await prisma.message.findUnique({ where: { id } })
  if (!m) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  const conv = await prisma.conversation.findUnique({ where: { id: m.conversationId } })
  if (!conv || conv.userId !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  const updated = await prisma.message.update({ where: { id }, data: { content } })
  return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const user = await getLocalUser()
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const { id } = await params
  const m = await prisma.message.findUnique({ where: { id } })
  if (!m) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  const conv = await prisma.conversation.findUnique({ where: { id: m.conversationId } })
  if (!conv || conv.userId !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  await prisma.message.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
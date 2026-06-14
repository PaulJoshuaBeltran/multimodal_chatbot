// src/app/api/conversations/[id]/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const { id } = await params
  const { title } = await req.json()
  const conv = await prisma.conversation.findUnique({ where: { id } })
  if (!conv || conv.userId !== payload.userId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  const updated = await prisma.conversation.update({ where: { id }, data: { title } })
  return new Response(JSON.stringify(updated), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

export async function DELETE(req: Request, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  const auth = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(auth)
  if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  const { id } = await params
  const conv = await prisma.conversation.findUnique({ where: { id } })
  if (!conv || conv.userId !== payload.userId) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  await prisma.message.deleteMany({ where: { conversationId: id } })
  await prisma.conversation.delete({ where: { id } })
  return new Response(null, { status: 204 })
}
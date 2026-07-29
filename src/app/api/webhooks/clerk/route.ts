// src/app/api/webhooks/clerk/route.ts
import { prisma } from '@/lib/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req)

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name } = evt.data
    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: first_name ?? null,
      },
    })
  }

  if (evt.type === 'user.deleted') {
    const clerkId = evt.data.id!
    const user = await prisma.user.findUnique({ where: { clerkId } })
    if (user) {
      const convIds = (await prisma.conversation.findMany({ where: { userId: user.id }, select: { id: true } })).map(c => c.id)
      if (convIds.length) await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } })
      await prisma.conversation.deleteMany({ where: { userId: user.id } })
      await prisma.aiModel.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    }
  }

  return new Response('ok', { status: 200 })
}
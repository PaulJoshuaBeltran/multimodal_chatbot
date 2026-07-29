// src/app/api/account/deactivate/route.ts
import { prisma } from '@/lib/prisma'
import { auth, clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE() {
  console.log('Deactivating user account...')
  const { userId } = await auth()
  console.log(`User ID: ${userId}`)
  if (!userId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })

  try {
    const convIds = (await prisma.conversation.findMany({ where: { userId: user.id }, select: { id: true } })).map(c => c.id)
    if (convIds.length) await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } })
    await prisma.conversation.deleteMany({ where: { userId: user.id } })
    await prisma.aiModel.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })

    const client = await clerkClient()
    await client.users.deleteUser(userId) // this will also fire user.deleted → webhook finds no local user, no-ops safely

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Deactivation failure:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 })
  }
}
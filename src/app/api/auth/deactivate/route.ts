// src/app/api/auth/deactivate/route.ts
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(req: Request) {
  const authHeader = req.headers.get('authorization')?.split(' ')[1]
  const payload = verifyToken(authHeader)

  if (!payload || !payload.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userId = payload.userId

  try {
    // 1. Find all conversations belonging to the user
    const userConversations = await prisma.conversation.findMany({
      where: { userId },
      select: { id: true },
    })
    const conversationIds = userConversations.map((c) => c.id)

    // 2. Delete all messages within those conversations
    if (conversationIds.length > 0) {
      await prisma.message.deleteMany({
        where: { conversationId: { in: conversationIds } },
      })
    }

    // 3. Delete the conversations themselves
    await prisma.conversation.deleteMany({
      where: { userId },
    })

    // 4. Delete user-configured AI Models
    await prisma.aiModel.deleteMany({
      where: { userId },
    })

    // 5. Finally, delete the User profile
    await prisma.user.delete({
      where: { id: userId },
    })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Deactivation failure:', err)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
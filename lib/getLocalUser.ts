// lib/get-local-user.ts
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getLocalUser() {
  const { userId: clerkId } = await auth()
  console.log('clerkId:', clerkId)
  if (!clerkId) return null
  const user = await prisma.user.findUnique({ where: { clerkId } })
  console.log('local user found:', !!user)
  return user
}
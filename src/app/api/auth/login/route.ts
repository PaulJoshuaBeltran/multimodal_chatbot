// src/app/api/auth/login/route.ts
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password)
    return new Response(JSON.stringify({ error: 'Missing fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user)
    return new Response(JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } })
  const ok = await verifyPassword(password, user.password)
  if (!ok)
    return new Response(JSON.stringify({ error: 'Invalid credentials' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } })
      
  // CHANGED: Added name to the token payload
  const token = signToken({ userId: user.id, name: user.name })
  
  return new Response(JSON.stringify({ token, user: { id: user.id, email: user.email, name: user.name } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } })
}
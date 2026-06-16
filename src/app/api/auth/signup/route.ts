// src/app/api/auth/signup/route.ts
import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  const { name, email, password } = body;
  if (!email || !password) return new Response(JSON.stringify({ error: 'Missing fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return new Response(JSON.stringify({ error: 'Email already in use' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, password: hashed } });
  
  const token = signToken({ userId: user.id, name: user.name });
  
  return new Response(JSON.stringify({ token, user: { id: user.id, name: user.name, email: user.email } }),
      { status: 201, headers: { 'Content-Type': 'application/json' } });
}
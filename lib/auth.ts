// lib/auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// 1. Update the payload type here to include name
export function signToken(payload: { userId: string; name?: string | null }) {
  const secret = process.env.JWT_SECRET || 'dev-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function getAuthToken(req: Request): string | null {
  const h = (req.headers.get('authorization') ?? '').trim()
  if (h) {
    const m = h.match(/^Bearer\s+(.+)$/i)
    if (m) return m[1]
    return h || null
  }
  const cookie = req.headers.get('cookie') ?? ''
  const c = cookie.match(/(?:^|;\s*)token\s*=\s*([^;]+)/)
  if (c) return decodeURIComponent(c[1])
  try { return new URL(req.url).searchParams.get('token') } catch { return null }
}

// 2. Update the type assertion here as well
export function verifyToken(token?: string) {
  if (!token) return null
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret'
    return jwt.verify(token, secret) as { userId: string; name?: string | null }
  } catch (err) {
    console.log('Token verification failed:', err)
    return null
  }
}
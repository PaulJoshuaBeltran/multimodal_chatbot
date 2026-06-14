// src/components/AuthBox.tsx
'use client'

import React, { useState } from 'react'
import { fetchJson } from '@/src/utils/api'

export default function AuthBox({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login'|'signup'>('login')
  const [loading, setLoading] = useState(false)

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login' ? { email, password } : { name, email, password }
      const data = await fetchJson<{ token: string }>(url, { method: 'POST', body: JSON.stringify(body) })
      if (data?.token) onLogin(data.token)
    } catch (err) {
      alert(String(err))
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {mode === 'signup' && <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>{loading ? 'Working...' : (mode === 'login' ? 'Login' : 'Sign up')}</button>
      <button type="button" onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Create account' : 'Have an account?'}</button>
    </form>
  )
}

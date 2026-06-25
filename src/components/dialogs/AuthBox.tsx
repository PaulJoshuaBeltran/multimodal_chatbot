// src/components/dialogs/AuthBox.tsx
'use client'

import { AuthBoxProps } from '@/src/types/props'
import React, { useState } from 'react'

export default function AuthBox({ onLogin }: AuthBoxProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 6,
    fontSize: 13,
  }

  const btnStyle: React.CSSProperties = {
    padding: '8px 14px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
    const body = mode === 'login' ? { email, password } : { name, email, password }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.token) {
          onLogin(data.token)
        } else {
          alert('Authentication failed: Missing token response.')
        }
      } else {
        alert('Authentication failed')
      }
    } catch (err) {
      alert(`Error: ${String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {mode === 'signup' && (
        <input
          className="hover-ui"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          disabled={loading}
        />
      )}
      <input
        className="hover-ui"
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
        disabled={loading}
      />
      <input
        className="hover-ui"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
        disabled={loading}
      />
      <button
        className="hover-ui"
        type="submit"
        disabled={loading}
        style={btnStyle}
      >
        {loading ? 'Working...' : mode === 'login' ? 'Login' : 'Sign up'}
      </button>
      <button
        className="hover-ui"
        type="button"
        onClick={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
        disabled={loading}
        style={btnStyle}
      >
        {mode === 'login' ? 'Create account' : 'Have an account?'}
      </button>
    </form>
  )
}
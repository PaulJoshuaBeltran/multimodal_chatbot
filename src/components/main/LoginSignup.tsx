// src/components/main/LoginSignup.tsx
import { SignIn, SignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Button } from '../ui/button'

export function LoginSignup() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center px-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
          <Bot className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to start chatting with your AI assistant.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant={'default'}
            onClick={() => setMode('login')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            Sign in
          </Button>
          <Button
            variant={'default'}
            onClick={() => setMode('signup')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--gray3)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
          >
            Create account
          </Button>
        </div>

        {mode === 'login' ? <SignIn routing="hash" /> : <SignUp routing="hash" />}
      </div>
    </div>
  )
}
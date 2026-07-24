'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha inválidos')
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <div className="w-full max-w-[360px] px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span style={{ color: 'var(--color-green-primary)' }}>Sym</span>
            <span style={{ color: 'var(--color-text-primary)' }}> Imóveis</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Acesso restrito à equipe
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 flex flex-col gap-4 shadow-2xl"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
              style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-green-primary)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition-all"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-green-primary)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center -mt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all mt-1 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'var(--color-green-primary)',
              color: '#fff',
            }}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  )
}

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { requestMagicLink } from '@/lib/api'
import { SITE_NAME } from '@/lib/constants'

export default function SignInPage() {
  const router = useRouter()
  const { setAuth, user } = useAuth()
  const [email,      setEmail]      = useState('')
  const [sent,       setSent]       = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  if (user) { router.replace('/profile'); return null }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      await requestMagicLink(email.trim())
      setSent(true)
    } catch {
      setError('Failed to send magic link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="bg-white rounded border-2 border-card-border p-8 shadow-card">
        <h1 className="text-xl font-semibold text-primary-blue mb-1">{SITE_NAME}</h1>
        <p className="text-sm text-text-muted mb-6">Sign in to save clinics and view your history.</p>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">📬</div>
            <p className="font-medium text-text-primary mb-1">Check your email</p>
            <p className="text-sm text-text-muted">We sent a sign-in link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} noValidate>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue mb-4"
              disabled={loading}
              autoFocus
            />
            {error && <p className="text-xs text-emergency-red mb-3" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}

        <p className="text-xs text-text-muted mt-6 text-center leading-relaxed">
          By continuing you agree to Findoc&apos;s Terms of Service. This platform provides health navigation guidance only — not medical advice.
        </p>
      </div>
    </div>
  )
}

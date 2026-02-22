'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getHistory, NavigationSession } from '@/lib/api'

const URGENCY_COLOURS: Record<string, string> = {
  low:       'bg-soft-green text-primary-green border-primary-green',
  medium:    'bg-status-medium-bg text-status-medium-text border-status-medium-border',
  high:      'bg-status-high-bg text-status-high-text border-status-high-border',
  emergency: 'bg-status-error-bg text-status-error-text border-emergency-red',
}

export default function HistoryPage() {
  const { token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<NavigationSession[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.replace('/auth/signin'); return }
    getHistory(token)
      .then(setSessions)
      .catch(() => setError('Failed to load history.'))
      .finally(() => setLoading(false))
  }, [token, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/profile" className="text-xs text-text-muted hover:text-text-primary transition-colors">← Profile</Link>
        <h1 className="text-2xl font-semibold text-primary-blue mt-2">Search history</h1>
      </div>

      {loading && <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mx-auto" />}
      {error   && <p className="text-sm text-emergency-red">{error}</p>}
      {!loading && !error && sessions.length === 0 && (
        <p className="text-text-muted text-sm">No searches yet. <Link href="/" className="text-primary-blue hover:underline">Try the navigator</Link>.</p>
      )}

      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.id} className="bg-white rounded border-2 border-card-border p-5 shadow-card hover:border-primary-blue transition-[border-color] duration-300">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-primary-blue">{s.recommended_specialist}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${URGENCY_COLOURS[s.urgency_level] ?? 'bg-surface-subtle text-text-muted border-brand-border'}`}>
                {s.urgency_level}
              </span>
            </div>
            <p className="text-sm text-text-muted italic line-clamp-2 mb-1">"{s.initial_symptoms}"</p>
            <p className="text-xs text-text-muted">{new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

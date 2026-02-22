'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getHistory, NavigationSession } from '@/lib/api'

const URGENCY_COLOURS: Record<string, string> = {
  low:       'bg-soft-green text-primary-green border-primary-green',
  medium:    'bg-yellow-50 text-yellow-800 border-yellow-400',
  high:      'bg-amber-50 text-amber-800 border-warning-amber',
  emergency: 'bg-red-50 text-red-700 border-emergency-red',
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
          <li key={s.id} className="bg-white rounded border-2 border-[#eef2f6] p-5 shadow-[0_4px_10px_rgba(67,95,113,0.08)] hover:border-primary-blue transition-[border-color] duration-300">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-primary-blue">{s.recommended_specialist}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${URGENCY_COLOURS[s.urgency_level] ?? 'bg-gray-50 text-gray-600 border-gray-300'}`}>
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getSavedPlaces, unsavePlace, SavedPlace } from '@/lib/api'

export default function SavedPage() {
  const { token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [saved,    setSaved]    = useState<SavedPlace[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.replace('/auth/signin'); return }
    getSavedPlaces(token)
      .then(setSaved)
      .catch(() => setError('Failed to load saved clinics.'))
      .finally(() => setLoading(false))
  }, [token, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUnsave(placeId: string) {
    if (!token) return
    await unsavePlace(placeId, token).catch(() => {})
    setSaved((prev) => prev.filter((s) => s.google_place_id !== placeId))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/profile" className="text-xs text-text-muted hover:text-text-primary transition-colors">← Profile</Link>
        <h1 className="text-2xl font-semibold text-primary-blue mt-2">Saved clinics</h1>
      </div>

      {loading && <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mx-auto" />}
      {error   && <p className="text-sm text-emergency-red">{error}</p>}
      {!loading && !error && saved.length === 0 && (
        <p className="text-text-muted text-sm">No saved clinics yet. Save clinics from search results.</p>
      )}

      <ul className="space-y-3">
        {saved.map((s) => (
          <li key={s.id} className="bg-white rounded border-2 border-card-border p-5 shadow-card flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-primary-blue text-sm truncate">{s.google_place_id}</p>
              {s.specialty && <p className="text-xs text-text-muted mt-0.5">{s.specialty}</p>}
              {s.notes     && <p className="text-xs text-text-muted mt-1 italic">{s.notes}</p>}
              <p className="text-xs text-text-muted mt-1">{new Date(s.saved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <button
              onClick={() => handleUnsave(s.google_place_id)}
              className="text-xs text-text-muted hover:text-emergency-red transition-colors flex-shrink-0"
              aria-label="Remove from saved"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

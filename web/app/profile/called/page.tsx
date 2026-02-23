'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { CalledPlace, getCalledPlaces } from '@/lib/api'
import { useAnalytics } from '@/hooks/useAnalytics'

function daysSince(isoDate: string): number {
  const timestamp = new Date(isoDate).getTime()
  if (Number.isNaN(timestamp)) return 0
  const diffMs = Date.now() - timestamp
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function mapDirectionsUrl(place: CalledPlace): string {
  if (place.maps_url) return place.maps_url
  if (place.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
  return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.google_place_id)}`
}

export default function CalledPage() {
  const { user, token, loading: authLoading } = useAuth()
  const { track } = useAnalytics()
  const router = useRouter()
  const [places, setPlaces] = useState<CalledPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCalledPlaces = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')

    try {
      const calledPlaces = await getCalledPlaces(token)
      setPlaces(calledPlaces)
      track('called_history_viewed', { total_called_places: calledPlaces.length })
    } catch {
      setError('Failed to load called clinics.')
    } finally {
      setLoading(false)
    }
  }, [token, track])

  useEffect(() => {
    if (authLoading) return
    if (!token) {
      router.replace('/auth/signin')
      return
    }

    loadCalledPlaces()
  }, [authLoading, token, router, loadCalledPlaces])

  const orderedPlaces = useMemo(
    () => [...places].sort((a, b) => Date.parse(b.last_called_at) - Date.parse(a.last_called_at)),
    [places]
  )

  if (!user && !authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-text-muted text-sm"><Link href="/auth/signin" className="text-primary-blue hover:underline">Sign in</Link> to see your call history.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/profile" className="text-xs text-text-muted hover:text-text-primary transition-colors">← Profile</Link>
        <h1 className="text-2xl font-semibold text-primary-blue mt-2">Called clinics</h1>
      </div>

      {loading && <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mx-auto" />}

      {!loading && error && (
        <div className="rounded border border-status-error-border bg-status-error-bg p-4">
          <p className="text-sm text-emergency-red mb-3">{error}</p>
          <button
            onClick={loadCalledPlaces}
            className="text-sm px-4 py-2 rounded bg-primary-blue text-white hover:bg-primary-blue-dark"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && orderedPlaces.length === 0 && (
        <div className="rounded border border-brand-border bg-surface-subtle p-5">
          <p className="text-sm text-text-muted mb-3">You have not called any clinics yet.</p>
          <Link href="/" className="text-sm px-4 py-2 rounded bg-primary-blue text-white hover:bg-primary-blue-dark inline-flex">
            Find clinics
          </Link>
        </div>
      )}

      {!loading && !error && orderedPlaces.length > 0 && (
        <ul className="space-y-3">
          {orderedPlaces.map((place) => (
            <li key={place.google_place_id} className="bg-white rounded border-2 border-card-border p-5 shadow-card">
              <p className="text-sm font-semibold text-primary-blue">{place.name || place.google_place_id}</p>
              <p className="text-sm text-text-muted mt-1">{place.address || 'Address unavailable'}</p>
              <p className="text-sm text-text-muted">{place.phone || 'Phone unavailable'}</p>

              <div className="mt-3 text-xs text-text-muted space-y-1">
                <p>Last called: {new Date(place.last_called_at).toLocaleDateString()}</p>
                <p>Times called: {place.times_called}</p>
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                {place.phone && (
                  <a
                    href={`tel:${place.phone}`}
                    onClick={() => track('called_history_call_again_clicked', {
                      google_place_id: place.google_place_id,
                      times_called: place.times_called,
                      days_since_last_call: daysSince(place.last_called_at),
                      specialty: place.specialty,
                      insurance: place.insurance,
                    })}
                    className="text-sm px-3 py-1.5 rounded bg-primary-blue text-white hover:bg-primary-blue-dark"
                  >
                    Call again
                  </a>
                )}
                <a
                  href={mapDirectionsUrl(place)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => track('called_history_directions_clicked', {
                    google_place_id: place.google_place_id,
                    times_called: place.times_called,
                    days_since_last_call: daysSince(place.last_called_at),
                    specialty: place.specialty,
                    insurance: place.insurance,
                  })}
                  className="text-sm px-3 py-1.5 rounded border border-brand-border hover:bg-surface-subtle"
                >
                  Get directions
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

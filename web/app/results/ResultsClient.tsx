'use client'

import { useState, useEffect } from 'react'
import { searchPlaces, trackEvent, Place } from '@/lib/api'
import DoctorCard from '@/components/DoctorCard'
import StaticMapPreview from '@/components/StaticMapPreview'
import UrgencyBanner from '@/components/UrgencyBanner'

interface ResultsClientProps {
  specialist: string
  lat?: string
  lng?: string
  insurance?: string
  urgency?: string
}

export default function ResultsClient({
  specialist,
  lat,
  lng,
  insurance,
  urgency,
}: ResultsClientProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPlaces() {
      setLoading(true)
      setError('')
      try {
        const data = await searchPlaces({ specialist, lat, lng, insurance })
        setPlaces(data)

        // Track views for all returned places
        data.forEach((place) => {
          trackEvent('view', { google_place_id: place.id, specialty: specialist })
        })
      } catch {
        setError('Unable to load clinics at this time. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaces()
  }, [specialist, lat, lng, insurance])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" aria-live="polite">
        <div
          className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mb-4"
          aria-hidden="true"
        />
        <p className="text-text-muted text-sm">Finding clinics near you&hellip;</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text"
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="rounded border border-card-border bg-white p-8 text-center">
        <p className="text-text-muted text-sm">
          No clinics found for your search criteria. Try adjusting your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {urgency && urgency !== 'low' && (
        <UrgencyBanner urgency={urgency} />
      )}

      {/* Static Maps API — multi-pin overview, top of results */}
      <StaticMapPreview places={places} userLat={lat} userLng={lng} />

      <p className="text-xs text-text-muted">
        {places.length} clinic{places.length !== 1 ? 's' : ''} found
        {insurance ? ` · filtered by ${insurance}` : ''}
      </p>

      <ul className="space-y-3" aria-label="Clinic results">
        {places.map((place) => (
          <li key={place.id}>
            <DoctorCard place={place} insurance={insurance} />
          </li>
        ))}
      </ul>

      <p className="text-xs text-text-muted pt-2 border-t border-card-border">
        Results are not ranked by quality. Sorted by proximity and rating only. Findoc does
        not endorse any clinic.
      </p>
    </div>
  )
}

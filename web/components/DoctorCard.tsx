'use client'

import { useState } from 'react'
import { Place, trackEvent, savePlace, unsavePlace } from '@/lib/api'
import { buildDirectionsUrl, buildEmbedUrl } from '@/lib/maps'
import { formatDistance, formatRating } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useAnalytics } from '@/hooks/useAnalytics'

interface DoctorCardProps {
  place:      Place
  insurance?: string
  specialty?: string
}

export default function DoctorCard({ place, insurance, specialty }: DoctorCardProps) {
  const { user, token } = useAuth()
  const { track }       = useAnalytics()
  const [showMap, setShowMap]   = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [saving,  setSaving]    = useState(false)

  const hasInsurance =
    insurance &&
    place.insurance_accepted.some((i) => i.toLowerCase() === insurance.toLowerCase())

  const directionsUrl = buildDirectionsUrl(place)
  const embedUrl      = buildEmbedUrl(place)

  const isPremium = user?.plan === 'premium'

  async function handleSave() {
    // Not signed in → go to sign-in with return-to
    if (!user || !token) {
      // Organic trigger: "Sign in to save your shortlist"
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/auth/signin?return_to=${returnTo}`
      return
    }

    // Signed in but not premium → show upgrade nudge (save is premium-only)
    if (!isPremium) {
      window.location.href = '/profile'
      return
    }

    setSaving(true)
    try {
      if (saved) {
        await unsavePlace(place.id, token)
        setSaved(false)
      } else {
        await savePlace(place.id, token, specialty)
        setSaved(true)
        track('doctor_saved', {
          specialist_type: specialty ?? null,
          emirate:         user.emirate ?? null,
        })
      }
    } catch {
      // Silent fail — saving is non-critical
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="bg-white rounded border-2 border-card-border p-5 shadow-card transition-[border-color] duration-300 hover:border-primary-blue">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="font-semibold text-primary-blue text-base truncate">{place.name}</h3>
          <p className="text-sm text-text-muted mt-0.5 truncate">{place.address}</p>
        </div>

        <div className="flex items-start gap-2 flex-shrink-0">
          <div className="text-right">
            {place.rating > 0 && (
              <p className="text-sm font-medium text-text-primary" aria-label={`Rating: ${formatRating(place.rating)} out of 5`}>
                ★ {formatRating(place.rating)}
              </p>
            )}
            <p className="text-xs text-text-muted mt-0.5">{formatDistance(place.distance)}</p>
          </div>

          {/* Save button — for premium users; nudges others to sign in / upgrade */}
          <button
            onClick={handleSave}
            disabled={saving}
            aria-label={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
            title={
              !user      ? 'Sign in to save doctors' :
              !isPremium ? 'Upgrade to Premium to save doctors' :
              saved      ? 'Remove from saved' : 'Save doctor'
            }
            className={`p-1.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-1 ${
              saved
                ? 'text-emergency-red hover:text-emergency-red/70'
                : 'text-text-muted hover:text-primary-blue'
            } ${saving ? 'opacity-50 cursor-wait' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
          </button>
        </div>
      </div>

      {hasInsurance && (
        <div className="mb-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-soft-green text-primary-green text-xs font-medium px-2.5 py-0.5"
            aria-label={`Accepts ${insurance} insurance`}
          >
            <span aria-hidden="true">✓</span> {insurance} accepted
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {/* Phone — never gated, no modal, connects immediately */}
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            onClick={() => trackEvent('phone_click', { google_place_id: place.id })}
            className="inline-flex items-center rounded bg-primary-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-blue-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
            aria-label={`Call ${place.name}`}
          >
            Call Clinic
          </a>
        )}

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('directions', { google_place_id: place.id })}
            className="inline-flex items-center rounded border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Get directions to ${place.name}`}
          >
            Get Directions
          </a>
        )}

        {embedUrl && (
          <button
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex items-center rounded border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-expanded={showMap}
            aria-label={showMap ? `Close map for ${place.name}` : `Open map for ${place.name}`}
          >
            {showMap ? 'Close Map' : 'Open Map'}
          </button>
        )}

        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('website', { google_place_id: place.id })}
            className="inline-flex items-center rounded border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-subtle transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Visit website of ${place.name}`}
          >
            Visit Website
          </a>
        )}
      </div>

      {showMap && embedUrl && (
        <div className="mt-4 -mx-5 -mb-5 border-t border-card-border overflow-hidden rounded-b">
          <iframe
            src={embedUrl}
            width="100%"
            height="260"
            className="block border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Map for ${place.name}`}
          />
        </div>
      )}
    </article>
  )
}

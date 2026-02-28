'use client'

import { useState } from 'react'
import { Place, clinicPlaceId, trackEvent, savePlace, unsavePlace } from '@/lib/api'
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
  const { track } = useAnalytics()
  const [showMap, setShowMap] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasInsurance =
    insurance &&
    place.insurance_accepted.some((i) => i.toLowerCase() === insurance.toLowerCase())

  const directionsUrl = buildDirectionsUrl(place)
  const embedUrl = buildEmbedUrl(place)

  const isPremium = user?.plan === 'premium'
  const placeId = clinicPlaceId(place)

  async function handleSave() {
    if (!user || !token) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = `/auth/signin?return_to=${returnTo}`
      return
    }

    if (!isPremium) {
      window.location.href = '/profile'
      return
    }

    setSaving(true)
    try {
      if (saved) {
        await unsavePlace(placeId, token)
        setSaved(false)
      } else {
        await savePlace(placeId, token, specialty)
        setSaved(true)
        track('doctor_saved', {
          specialist_type: specialty ?? null,
          emirate: user.emirate ?? null,
        })
      }
    } catch {
      // Silent fail — saving is non-critical
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-slate-900">{place.name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{place.address}</p>
        </div>

        <div className="flex flex-shrink-0 items-start gap-2">
          <div className="text-right">
            {place.rating > 0 && (
              <p className="text-sm font-semibold text-slate-800" aria-label={`Rating: ${formatRating(place.rating)} out of 5`}>
                ★ {formatRating(place.rating)}
              </p>
            )}
            <p className="mt-0.5 text-xs text-slate-500">{formatDistance(place.distance)}</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            aria-label={saved ? `Unsave ${place.name}` : `Save ${place.name}`}
            title={
              !user ? 'Sign in to save doctors' :
                !isPremium ? 'Upgrade to Premium to save doctors' :
                  saved ? 'Remove from saved' : 'Save doctor'
            }
            className={`rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1 ${
              saved
                ? 'text-red-500 hover:text-red-400'
                : 'text-slate-400 hover:text-slate-700'
            } ${saving ? 'cursor-wait opacity-50' : ''}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={saved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              className="h-4 w-4"
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

      <div className="mb-3 flex flex-wrap gap-2">
        {place.featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white" aria-label="Featured clinic">
            ★ Featured
          </span>
        )}

        {hasInsurance && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" aria-label={`Accepts ${insurance} insurance`}>
            <span aria-hidden="true">✓</span> {insurance} accepted
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2.5">
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            onClick={() => trackEvent('phone_click', { google_place_id: placeId })}
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            onClick={() => trackEvent('directions', { google_place_id: placeId })}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label={`Get directions to ${place.name}`}
          >
            Get Directions
          </a>
        )}

        {embedUrl && (
          <button
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
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
            onClick={() => trackEvent('website', { google_place_id: placeId })}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label={`Visit website of ${place.name}`}
          >
            Visit Website
          </a>
        )}
      </div>

      {showMap && embedUrl && (
        <div className="-mx-5 -mb-5 mt-4 overflow-hidden border-t border-slate-200">
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

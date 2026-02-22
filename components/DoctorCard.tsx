'use client'

import { useState } from 'react'
import { Place, TrackEventType, trackEvent } from '@/lib/api'
import { buildDirectionsUrl, buildEmbedUrl } from '@/lib/maps'
import { formatDistance, formatRating } from '@/lib/utils'

interface DoctorCardProps {
  place: Place
  insurance?: string
}

export default function DoctorCard({ place, insurance }: DoctorCardProps) {
  const [showMap, setShowMap] = useState(false)

  const hasInsurance =
    insurance &&
    place.insurance_accepted.some(
      (i) => i.toLowerCase() === insurance.toLowerCase()
    )

  const directionsUrl = buildDirectionsUrl(place)
  const embedUrl = buildEmbedUrl(place)

  async function handleTrack(type: TrackEventType) {
    await trackEvent(type, { place_id: place.id })
  }

  return (
    <article className="bg-white rounded border-2 border-[#eef2f6] p-5 shadow-[0_4px_10px_rgba(67,95,113,0.08)] transition-[border-color] duration-300 hover:border-primary-blue">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <h3 className="font-semibold text-primary-blue text-base truncate">
            {place.name}
          </h3>
          <p className="text-sm text-text-muted mt-0.5 truncate">{place.address}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          {place.rating > 0 && (
            <p
              className="text-sm font-medium text-text-primary"
              aria-label={`Rating: ${formatRating(place.rating)} out of 5`}
            >
              ★ {formatRating(place.rating)}
            </p>
          )}
          <p className="text-xs text-text-muted mt-0.5">
            {formatDistance(place.distance)}
          </p>
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
        {place.phone && (
          <a
            href={`tel:${place.phone}`}
            onClick={() => handleTrack('phone_click')}
            className="inline-flex items-center rounded bg-primary-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2"
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
            onClick={() => handleTrack('directions_click')}
            className="inline-flex items-center rounded border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Get directions to ${place.name}`}
          >
            Get Directions
          </a>
        )}

        {embedUrl && (
          <button
            onClick={() => setShowMap((v) => !v)}
            className="inline-flex items-center rounded border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
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
            onClick={() => handleTrack('website_click')}
            className="inline-flex items-center rounded border border-brand-border bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Visit website of ${place.name}`}
          >
            Visit Website
          </a>
        )}
      </div>

      {/* Maps Embed API iframe — shown on demand */}
      {showMap && embedUrl && (
        <div className="mt-4 -mx-5 -mb-5 border-t border-[#eef2f6] overflow-hidden rounded-b">
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

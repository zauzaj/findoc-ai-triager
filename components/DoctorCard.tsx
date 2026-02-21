'use client'

import { Place, TrackEventType, trackEvent } from '@/lib/api'
import { formatDistance, formatRating } from '@/lib/utils'

interface DoctorCardProps {
  place: Place
  insurance?: string
}

export default function DoctorCard({ place, insurance }: DoctorCardProps) {
  const hasInsurance =
    insurance &&
    place.insurance_accepted.some(
      (i) => i.toLowerCase() === insurance.toLowerCase()
    )

  async function handleTrack(type: TrackEventType) {
    await trackEvent(type, { place_id: place.id })
  }

  return (
    <article className="bg-white rounded border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-text-primary text-base truncate">
            {place.name}
          </h3>
          <p className="text-sm text-text-muted mt-0.5 truncate">{place.address}</p>
        </div>

        <div className="flex-shrink-0 text-right">
          {place.rating > 0 && (
            <p className="text-sm font-medium text-text-primary" aria-label={`Rating: ${formatRating(place.rating)} out of 5`}>
              ★ {formatRating(place.rating)}
            </p>
          )}
          <p className="text-xs text-text-muted mt-0.5">
            {formatDistance(place.distance)}
          </p>
        </div>
      </div>

      {hasInsurance && (
        <div className="mb-3">
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
            className="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Call ${place.name}`}
          >
            Call Clinic
          </a>
        )}

        {place.directions_url && (
          <a
            href={place.directions_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleTrack('directions_click')}
            className="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Get directions to ${place.name}`}
          >
            Get Directions
          </a>
        )}

        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleTrack('website_click')}
            className="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
            aria-label={`Visit website of ${place.name}`}
          >
            Visit Website
          </a>
        )}
      </div>
    </article>
  )
}

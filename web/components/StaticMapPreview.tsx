'use client'

import { useState } from 'react'
import type { Place } from '@/lib/api'
import { buildStaticMapUrl, buildEmbedUrl } from '@/lib/maps'

interface StaticMapPreviewProps {
  places: Place[]
  userLat?: string
  userLng?: string
}

/**
 * Renders a Google Static Maps image showing all clinic locations as numbered pins.
 * When a place has a place_id, a "Open Map" button reveals a Maps Embed API iframe
 * for that clinic.
 *
 * Returns null if no API key is configured or none of the places have coordinates.
 */
export default function StaticMapPreview({
  places,
  userLat,
  userLng,
}: StaticMapPreviewProps) {
  const [embedPlace, setEmbedPlace] = useState<Place | null>(null)

  const staticUrl = buildStaticMapUrl(places, userLat, userLng)
  if (!staticUrl) return null

  const embedUrl = embedPlace ? buildEmbedUrl(embedPlace) : ''

  return (
    <div className="rounded border border-gray-100 overflow-hidden mb-6">
      {/* Static multi-pin overview */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={staticUrl}
        alt="Map showing clinic locations"
        width={640}
        height={280}
        className="w-full h-auto block"
        loading="lazy"
      />

      {/* Maps Embed iframe — shown when user opens a specific clinic */}
      {embedUrl && (
        <div>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
            <span className="text-xs font-medium text-text-primary truncate max-w-[80%]">
              {embedPlace!.name}
            </span>
            <button
              onClick={() => setEmbedPlace(null)}
              className="text-xs text-text-muted hover:text-text-primary transition-colors flex-shrink-0 ml-2 focus:outline-none focus:ring-2 focus:ring-primary-blue rounded"
              aria-label="Close embedded map"
            >
              Close ✕
            </button>
          </div>
          <iframe
            src={embedUrl}
            width="100%"
            height="300"
            className="block border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Interactive map for ${embedPlace!.name}`}
          />
        </div>
      )}

      <p className="px-3 py-2 text-xs text-text-muted bg-gray-50 border-t border-gray-100">
        {places.filter((p) => p.lat != null).length} location
        {places.filter((p) => p.lat != null).length !== 1 ? 's' : ''} on map
      </p>
    </div>
  )
}

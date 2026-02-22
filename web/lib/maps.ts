import type { Place } from './api'

const KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? ''

// Marker labels: 1–9 then A–Z (Static Maps supports single alphanumeric chars)
const LABELS = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * Builds a Google Static Maps API URL with numbered markers for each place.
 * Returns an empty string when no API key is configured or no places have coordinates.
 *
 * Docs: https://developers.google.com/maps/documentation/maps-static/overview
 */
export function buildStaticMapUrl(
  places: Place[],
  userLat?: string,
  userLng?: string
): string {
  if (!KEY) return ''

  const locatedPlaces = places.filter((p) => p.lat != null && p.lng != null)
  if (locatedPlaces.length === 0) return ''

  const params = new URLSearchParams({
    size: '640x280',
    scale: '2',
    key: KEY,
  })

  // Optional: small red dot for the user's current location
  if (userLat && userLng) {
    params.append('markers', `color:red|size:small|${userLat},${userLng}`)
  }

  // Numbered blue pins for each clinic (max 35 — 9 digits + 26 letters)
  locatedPlaces.slice(0, LABELS.length).forEach((place, i) => {
    params.append(
      'markers',
      `color:0x2563EB|label:${LABELS[i]}|${place.lat},${place.lng}`
    )
  })

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

/**
 * Builds the Google Maps deep link for a single clinic using its Place ID.
 * Falls back to `directions_url` from the API if `place_id` is absent.
 *
 * Deep link format:
 *   https://www.google.com/maps/place/?q=place_id=ChIJ...
 */
export function buildDirectionsUrl(place: Place): string {
  if (place.place_id) {
    return `https://www.google.com/maps/place/?q=place_id=${place.place_id}`
  }
  return place.directions_url ?? ''
}

/**
 * Builds a Maps Embed API URL for rendering an interactive <iframe>.
 * Returns an empty string when no API key or place_id is available.
 *
 * Docs: https://developers.google.com/maps/documentation/embed/get-started
 */
export function buildEmbedUrl(place: Place): string {
  if (!KEY || !place.place_id) return ''
  return `https://www.google.com/maps/embed/v1/place?key=${KEY}&q=place_id:${place.place_id}`
}

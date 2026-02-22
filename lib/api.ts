// Internal Next.js API routes by default — they add caching + persistence.
// Override with NEXT_PUBLIC_API_BASE_URL only for testing against an external backend directly.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api'

export interface NavigateRequest {
  symptoms: string
  insurance?: string
}

export interface NavigateResponse {
  specialist: string
  urgency: string
  confidence: number
  explanation: string
}

export interface Place {
  id: string
  name: string
  rating: number
  address: string
  distance: number
  phone?: string
  website?: string
  /** Google Place ID — used to build directions deep links and Maps Embed URLs */
  place_id?: string
  /** WGS-84 latitude — required for Static Maps pin rendering */
  lat?: number
  /** WGS-84 longitude — required for Static Maps pin rendering */
  lng?: number
  /** Fallback directions URL when place_id is absent */
  directions_url?: string
  insurance_accepted: string[]
}

export interface PlacesSearchParams {
  specialist: string
  lat?: string
  lng?: string
  insurance?: string
}

export type TrackEventType =
  | 'view'
  | 'phone_click'
  | 'directions_click'
  | 'website_click'

export interface TrackEventPayload {
  place_id?: string
  specialist?: string
  [key: string]: string | undefined
}

export async function navigate(
  symptoms: string,
  insurance?: string
): Promise<NavigateResponse> {
  const body: NavigateRequest = { symptoms }
  if (insurance) body.insurance = insurance

  const res = await fetch(`${API_BASE_URL}/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Navigation request failed: ${res.status}`)
  }

  return res.json() as Promise<NavigateResponse>
}

export async function searchPlaces(params: PlacesSearchParams): Promise<Place[]> {
  const query = new URLSearchParams()
  if (params.specialist) query.set('specialist', params.specialist)
  if (params.lat) query.set('lat', params.lat)
  if (params.lng) query.set('lng', params.lng)
  if (params.insurance) query.set('insurance', params.insurance)

  const res = await fetch(`${API_BASE_URL}/places/search?${query.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Places search failed: ${res.status}`)
  }

  return res.json() as Promise<Place[]>
}

export async function trackEvent(
  type: TrackEventType,
  payload: TrackEventPayload
): Promise<void> {
  await fetch(`${API_BASE_URL}/tracking/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

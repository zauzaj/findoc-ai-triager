// All API calls go directly to the Rails API.
// In production set NEXT_PUBLIC_RAILS_API_URL to https://your-api.herokuapp.com/api/v1
const API = process.env.NEXT_PUBLIC_RAILS_API_URL ?? 'http://localhost:3001/api/v1'

function authHeaders(token?: string | null): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface NavigateRequest  { symptoms: string; insurance?: string }
export interface NavigateResponse {
  session_token: string
  specialist: string
  urgency: string
  confidence: number
  explanation: string
}

export interface Place {
  id: string
  place_id?: string
  name: string
  rating: number
  address: string
  distance: number
  phone?: string
  website?: string
  maps_url?: string
  lat?: number
  lng?: number
  directions_url?: string
  insurance_accepted: string[]
}

export interface PlacesSearchParams {
  specialist: string
  lat?: string
  lng?: string
  insurance?: string
}

export type TrackEventType = 'view' | 'phone_click' | 'directions' | 'website'

export interface TrackEventPayload {
  google_place_id: string
  session_id?: string
  specialty?: string
  insurance?: string
  source?: string
}

export interface AuthUser {
  id: number
  email: string
  name?: string
  avatar_url?: string
  plan: 'free' | 'premium'
  locale: 'en' | 'ar'
  insurance_provider?: string
  emirate?: string
  navigations_this_month?: number
  ls_subscription_status?: string
}

export interface NavigationSession {
  id: number
  session_token: string
  initial_symptoms: string
  recommended_specialist: string
  urgency_level: string
  explanation: string
  insurance_filter?: string
  created_at: string
}

export interface SavedPlace {
  id: number
  google_place_id: string
  specialty?: string
  notes?: string
  saved_at: string
}

export interface InsuranceProvider {
  id: number
  name: string
  slug: string
  full_name: string
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function signInWithGoogle(idToken: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API}/auth/google`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ id_token: idToken }),
  })
  if (!res.ok) throw new Error('Google sign-in failed')
  return res.json()
}

export async function requestMagicLink(email: string): Promise<void> {
  const res = await fetch(`${API}/auth/magic_link`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error('Failed to send magic link')
}

export async function verifyMagicLink(token: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API}/auth/magic_link_verify?token=${encodeURIComponent(token)}`)
  if (!res.ok) throw new Error('Invalid or expired magic link')
  return res.json()
}

export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${API}/auth/me`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Not authenticated')
  const data = await res.json()
  return data.user
}

// ── Navigation ────────────────────────────────────────────────────────────

export async function navigate(
  symptoms: string,
  insurance?: string,
  token?: string | null
): Promise<NavigateResponse> {
  const res = await fetch(`${API}/navigate`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ symptoms, insurance }),
  })
  if (!res.ok) throw new Error(`Navigation failed: ${res.status}`)
  return res.json()
}

export async function getHistory(token: string): Promise<NavigationSession[]> {
  const res = await fetch(`${API}/navigate/history`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch history')
  const data = await res.json()
  return data.history
}

// ── Places ────────────────────────────────────────────────────────────────

export async function searchPlaces(params: PlacesSearchParams, token?: string | null): Promise<Place[]> {
  const query = new URLSearchParams()
  if (params.specialist) query.set('specialist', params.specialist)
  if (params.lat)        query.set('lat', params.lat)
  if (params.lng)        query.set('lng', params.lng)
  if (params.insurance)  query.set('insurance', params.insurance)
  const res = await fetch(`${API}/places/search?${query}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Places search failed')
  const data = await res.json()
  return data.places
}

export async function savePlace(placeId: string, token: string, specialty?: string): Promise<SavedPlace> {
  const res = await fetch(`${API}/places/${placeId}/save`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ specialty }),
  })
  if (!res.ok) throw new Error('Failed to save place')
  const data = await res.json()
  return data.saved_place
}

export async function unsavePlace(placeId: string, token: string): Promise<void> {
  const res = await fetch(`${API}/places/${placeId}/save`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to remove saved place')
}

export async function getSavedPlaces(token: string): Promise<SavedPlace[]> {
  const res = await fetch(`${API}/saved_places`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch saved places')
  const data = await res.json()
  return data.saved_places
}

// ── Insurance ─────────────────────────────────────────────────────────────

export async function getInsuranceProviders(): Promise<InsuranceProvider[]> {
  const res = await fetch(`${API}/insurance_providers`)
  if (!res.ok) throw new Error('Failed to fetch insurance providers')
  const data = await res.json()
  return data.insurance_providers
}

// ── Tracking ──────────────────────────────────────────────────────────────

export async function trackEvent(
  type: TrackEventType,
  payload: TrackEventPayload,
  token?: string | null
): Promise<void> {
  const endpointMap: Record<TrackEventType, string> = {
    view:         'tracking/view',
    phone_click:  'tracking/phone_click',
    directions:   'tracking/directions',
    website:      'tracking/website',
  }
  await fetch(`${API}/${endpointMap[type]}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  }).catch(() => {}) // fire-and-forget, never throw
}

// ── Billing ────────────────────────────────────────────────────────────────

/** Creates a Lemon Squeezy hosted-checkout session and returns the redirect URL. */
export async function createCheckout(token: string): Promise<string> {
  const res = await fetch(`${API}/billing/checkout`, {
    method: 'POST',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to create checkout session')
  const data = await res.json()
  return data.checkout_url
}

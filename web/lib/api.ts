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
  /** Server-side navigation count after this navigation (signed-in users only) */
  navigations_this_month?: number
}

export interface Place {
  /** Backward compatible alias (same as place_id) */
  id: string
  /** Canonical clinic identifier from Google Places */
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
  featured?: boolean
}

export interface PlacesSearchParams {
  specialist: string
  lat?: string
  lng?: string
  insurance?: string
}

export type TrackEventType = 'view' | 'phone_click' | 'directions' | 'website'

export interface TrackEventPayload {
  /** Backward-compatible request field consumed by backend tracking endpoints */
  google_place_id: string
  session_id?: string
  specialty?: string
  insurance?: string
  source?: string
}

export interface PlanFeatures {
  /** Monthly navigation cap; 0 = unlimited */
  nav_limit_monthly:  number
  /** Clinic results shown per search; 0 = unlimited */
  result_limit:       number
  can_save_doctors:   boolean
  can_view_history:   boolean
  /** Monthly price in AED */
  price_aed:          number
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
  /** ISO timestamp when current billing period (or grace period) ends */
  subscription_ends_at?: string
  /** Server-driven plan limits — use these instead of hardcoded constants */
  plan_features?: PlanFeatures
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

export interface CalledPlace {
  google_place_id: string
  name?: string
  address?: string
  phone?: string
  maps_url?: string
  times_called: number
  last_called_at: string
  specialty?: string
  insurance?: string
  partial: boolean
}

export interface InsuranceProvider {
  id: number
  name: string
  slug: string
  full_name: string
}


export function clinicPlaceId(place: Pick<Place, 'id' | 'place_id'>): string {
  return place.place_id || place.id
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

export async function getCalledPlaces(token: string): Promise<CalledPlace[]> {
  const res = await fetch(`${API}/called_places`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch called places')
  const data = await res.json()
  return data.called_places
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

// ── Users ──────────────────────────────────────────────────────────────────

export async function updateProfile(
  token: string,
  data: { emirate?: string; insurance_provider?: string; locale?: string }
): Promise<AuthUser> {
  const res = await fetch(`${API}/users/me`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ user: data }),
  })
  if (!res.ok) throw new Error('Failed to update profile')
  const json = await res.json()
  return json.user
}

/**
 * Transfers the anonymous navigation count into the signed-in account.
 * Called immediately after sign-in when the anonymous count > 0.
 * The server takes max(current, anonymous_count).
 */
export async function mergeAnonymousCount(
  token: string,
  anonymous_count: number
): Promise<AuthUser> {
  const res = await fetch(`${API}/auth/merge_anonymous`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ anonymous_count }),
  })
  if (!res.ok) throw new Error('Failed to merge anonymous count')
  const json = await res.json()
  return json.user
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

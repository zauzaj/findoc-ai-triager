/**
 * Core analytics event system.
 *
 * Principles (from business spec):
 * - Every meaningful state change or conversion moment generates an event
 * - All events carry common context: anonymous_id, user_id, nav count, emirate, insurance, language
 * - Anonymous → signed-in continuity is preserved via anonymous_id transfer
 * - Fire-and-forget: tracking never blocks the user flow
 */

import { getOrCreateVisitorId, getStoredLocale } from './visitorTracking'

const API = process.env.NEXT_PUBLIC_RAILS_API_URL ?? 'http://localhost:3001/api/v1'

// ── Event catalog ────────────────────────────────────────────────────────────

export type AnalyticsEventName =
  // Navigation
  | 'navigation_completed'
  | 'premium_navigation_completed'
  // Result cap
  | 'result_cap_shown'
  | 'see_all_results_clicked'
  // Auth flow
  | 'auth_prompt_shown'
  | 'auth_prompt_dismissed'
  | 'auth_started'
  | 'auth_completed'
  // Upgrade flow
  | 'upgrade_modal_shown'
  | 'upgrade_modal_dismissed'
  | 'upgrade_modal_suppressed'
  | 'upgrade_cta_clicked'
  // Checkout
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_abandoned'
  // Subscription lifecycle (fired server-side but listed here for reference)
  | 'subscription_activated'
  | 'subscription_renewed'
  | 'subscription_canceled'
  | 'subscription_expired'
  | 'subscription_payment_failed'
  | 'subscription_reactivated'
  // Feature usage
  | 'doctor_saved'
  | 'navigation_history_viewed'
  | 'called_history_viewed'
  | 'called_history_call_again_clicked'
  | 'called_history_directions_clicked'
  // Counter transfer
  | 'navigation_counter_transferred'

// ── Common context ───────────────────────────────────────────────────────────

export interface AnalyticsContext {
  /** JWT token for authenticated requests */
  token?: string | null
  /** Signed-in user id (if known) */
  user_id?: number | null
  /** Navigation count this calendar month */
  navigation_count_this_month?: number
  /** User's emirate (if known) */
  emirate?: string | null
  /** Insurance selected during this session */
  insurance_selected?: string | null
}

// ── track() — the core function ──────────────────────────────────────────────

/**
 * Fire an analytics event. Never throws — failure is silently swallowed
 * so instrumentation never interrupts the user flow.
 */
export function track(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {},
  ctx: AnalyticsContext = {}
): void {
  try {
    const anonymous_id = getOrCreateVisitorId()
    const language     = getStoredLocale()
    const timestamp    = new Date().toISOString()

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (ctx.token) headers['Authorization'] = `Bearer ${ctx.token}`

    // Strip token from body — it's in the auth header
    const { token: _t, ...ctxWithoutToken } = ctx

    fetch(`${API}/analytics/event`, {
      method:  'POST',
      headers,
      body: JSON.stringify({
        event,
        anonymous_id,
        language,
        timestamp,
        ...ctxWithoutToken,
        ...properties,
      }),
    }).catch(() => {}) // fire-and-forget
  } catch {
    // Instrumentation must never throw
  }
}

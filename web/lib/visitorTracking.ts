/**
 * Anonymous visitor tracking — stored in localStorage only.
 * Resets on the 1st of each calendar month.
 * If the user clears cookies / goes incognito: counter resets — this is accepted.
 */

const VISITOR_KEY  = 'findoc_visitor_id'
const COUNT_KEY    = 'findoc_anon_count'
const MONTH_KEY    = 'findoc_anon_month'  // stored as "YYYY-MM"

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = `v-${crypto.randomUUID()}`
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

/** Reads raw anonymous nav count for this calendar month. */
export function getAnonNavCount(): number {
  if (typeof window === 'undefined') return 0
  const stored = localStorage.getItem(MONTH_KEY)
  if (stored !== currentMonthKey()) {
    // New month — reset
    localStorage.setItem(COUNT_KEY, '0')
    localStorage.setItem(MONTH_KEY, currentMonthKey())
    return 0
  }
  return parseInt(localStorage.getItem(COUNT_KEY) ?? '0', 10)
}

/** Increments and returns the new count. */
export function incrementAnonNavCount(): number {
  if (typeof window === 'undefined') return 1
  const next = getAnonNavCount() + 1
  localStorage.setItem(COUNT_KEY, String(next))
  localStorage.setItem(MONTH_KEY, currentMonthKey())
  return next
}

/** Returns the locale preference stored for anonymous visitors. */
export function getStoredLocale(): 'en' | 'ar' {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('findoc_locale') as 'en' | 'ar') ?? 'en'
}

export function setStoredLocale(locale: 'en' | 'ar'): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('findoc_locale', locale)
}

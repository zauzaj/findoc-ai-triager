import { UrgencyLevel, URGENCY_LEVELS } from './constants'

export function getUrgencyConfig(urgency: string) {
  const level = urgency?.toLowerCase() as UrgencyLevel
  return URGENCY_LEVELS[level] ?? URGENCY_LEVELS.low
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function buildSearchParams(params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, value)
    }
  }
  return searchParams.toString()
}

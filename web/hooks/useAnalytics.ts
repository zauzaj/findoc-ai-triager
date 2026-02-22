'use client'

/**
 * React hook that returns a `track()` function pre-populated with
 * the common event context (user, nav count, locale, emirate, insurance).
 *
 * Usage:
 *   const { track } = useAnalytics()
 *   track('upgrade_cta_clicked', { total_matching_results: 47 })
 */

import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { useLocale } from '@/hooks/useLocale'
import { track as rawTrack, AnalyticsEventName } from '@/lib/analytics'

export function useAnalytics() {
  const { user, token } = useAuth()
  const { navCount }    = useNavigation()
  const { locale }      = useLocale()

  const track = useCallback(
    (event: AnalyticsEventName, properties: Record<string, unknown> = {}) => {
      rawTrack(event, properties, {
        token,
        user_id:                    user?.id,
        navigation_count_this_month: navCount,
        emirate:                    user?.emirate,
        language:                   locale,
      } as Parameters<typeof rawTrack>[2])
    },
    [user, token, navCount, locale]
  )

  return { track }
}

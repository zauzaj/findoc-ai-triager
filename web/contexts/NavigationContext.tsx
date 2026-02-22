'use client'

/**
 * NavigationContext — tracks how many navigations the current visitor has
 * completed this month, and what banners/modals should be shown after results.
 *
 * Rules (from product spec):
 *   - Anonymous users: counter lives in localStorage, resets 1st of month
 *   - Signed-in free users: server counter (navigations_this_month) is truth
 *   - On sign-in: anonymous count merges into server count (never resets)
 *   - Premium users: unlimited — no banners, no modals
 *
 * The "increment" happens after results load — not when the user submits symptoms.
 */

import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react'
import { getAnonNavCount, incrementAnonNavCount } from '@/lib/visitorTracking'
import { FREE_NAV_LIMIT } from '@/lib/constants'

export type NavPromptVariant =
  | 'none'       // no prompt
  | 'auth-1'     // soft ask after nav #1
  | 'auth-2'     // warmer ask after nav #2
  | 'auth-3'     // strongest ask after nav #3
  | 'upgrade'    // upgrade modal after nav #4+

interface NavigationContextValue {
  /** Current nav count for this month (anon or server) */
  navCount: number
  /** Whether the user is on the premium plan */
  isPremium: boolean
  /** Which prompt variant to show right now (null = none) */
  activePrompt: NavPromptVariant
  /** Dismiss whatever prompt is currently showing */
  dismissPrompt: () => void
  /**
   * Call this AFTER a navigation result has loaded.
   * Increments the counter and sets the appropriate prompt.
   * Pass `isPremium` so the context doesn't need the full AuthContext.
   */
  recordNavigation: (opts: { isPremium: boolean; serverCount?: number }) => void
  /**
   * Called by AuthContext after sign-in to sync the server count.
   * Keeps whichever is higher (anonymous or server).
   */
  syncServerCount: (serverCount: number) => void
}

const NavigationContext = createContext<NavigationContextValue>({
  navCount: 0,
  isPremium: false,
  activePrompt: 'none',
  dismissPrompt: () => {},
  recordNavigation: () => {},
  syncServerCount: () => {},
})

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navCount,     setNavCount]     = useState(0)
  const [isPremium,    setIsPremium]    = useState(false)
  const [activePrompt, setActivePrompt] = useState<NavPromptVariant>('none')

  // Initialise from localStorage on mount (anonymous count)
  useEffect(() => {
    setNavCount(getAnonNavCount())
  }, [])

  const dismissPrompt = useCallback(() => {
    setActivePrompt('none')
  }, [])

  const syncServerCount = useCallback((serverCount: number) => {
    setNavCount((current) => Math.max(current, serverCount))
  }, [])

  const recordNavigation = useCallback(
    ({ isPremium: premium, serverCount }: { isPremium: boolean; serverCount?: number }) => {
      setIsPremium(premium)
      if (premium) {
        // Premium users: just keep the server count in sync, no prompts
        if (serverCount !== undefined) setNavCount(serverCount)
        return
      }

      // Determine new count
      let newCount: number
      if (serverCount !== undefined) {
        // Signed-in user: trust server count (already incremented server-side)
        newCount = serverCount
        setNavCount(newCount)
      } else {
        // Anonymous user: increment local counter
        newCount = incrementAnonNavCount()
        setNavCount(newCount)
      }

      // Determine which prompt to show
      if (newCount === 1) {
        setActivePrompt('auth-1')
      } else if (newCount === 2) {
        setActivePrompt('auth-2')
      } else if (newCount === FREE_NAV_LIMIT) {
        setActivePrompt('auth-3')
      } else if (newCount > FREE_NAV_LIMIT) {
        setActivePrompt('upgrade')
      } else {
        setActivePrompt('none')
      }
    },
    []
  )

  return (
    <NavigationContext.Provider
      value={{ navCount, isPremium, activePrompt, dismissPrompt, recordNavigation, syncServerCount }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => useContext(NavigationContext)

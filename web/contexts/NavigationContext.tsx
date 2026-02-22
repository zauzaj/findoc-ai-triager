'use client'

/**
 * NavigationContext — tracks nav count and which prompt to show after results.
 *
 * Rules:
 *   - Anonymous: counter in localStorage, resets 1st of month
 *   - Signed-in free: server counter is truth
 *   - Premium: no prompts, no limits
 *   - On sign-in: anonymous count merges into server (never resets)
 *   - 24h cooldown: after upgrade modal is dismissed, suppress it for 24 hours
 *     then fire 'upgrade_modal_suppressed' event (not 'upgrade')
 */

import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react'
import { getAnonNavCount, incrementAnonNavCount } from '@/lib/visitorTracking'
import { FREE_NAV_LIMIT } from '@/lib/constants'

const COOLDOWN_KEY    = 'findoc_upgrade_dismissed_at'
const COOLDOWN_MS     = 24 * 60 * 60 * 1000 // 24 hours

export type NavPromptVariant =
  | 'none'             // no prompt
  | 'auth-1'           // soft ask after nav #1  (anonymous only)
  | 'auth-2'           // warmer ask after nav #2 (anonymous only)
  | 'auth-3'           // strongest ask after nav #3 (anonymous only)
  | 'lapsed-premium'   // returning lapsed-premium user nudge after nav #3
  | 'upgrade'          // upgrade modal after nav #4+ (both anonymous + free signed-in)

function isUpgradeCoolingDown(): boolean {
  if (typeof window === 'undefined') return false
  const stored = localStorage.getItem(COOLDOWN_KEY)
  if (!stored) return false
  return Date.now() - parseInt(stored, 10) < COOLDOWN_MS
}

function setUpgradeCooldown(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
}

interface RecordNavOptions {
  isPremium:       boolean
  isLapsed?:       boolean   // free user who previously had premium
  isAuthenticated?: boolean
  serverCount?:    number
}

interface NavigationContextValue {
  navCount:     number
  isPremium:    boolean
  activePrompt: NavPromptVariant
  /** True after upgrade modal was dismissed within the 24h cooldown window */
  upgradeModalSuppressed: boolean
  dismissPrompt:          () => void
  recordNavigation:       (opts: RecordNavOptions) => void
  syncServerCount:        (serverCount: number) => void
}

const NavigationContext = createContext<NavigationContextValue>({
  navCount: 0,
  isPremium: false,
  activePrompt: 'none',
  upgradeModalSuppressed: false,
  dismissPrompt: () => {},
  recordNavigation: () => {},
  syncServerCount: () => {},
})

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navCount,              setNavCount]              = useState(0)
  const [isPremium,             setIsPremium]             = useState(false)
  const [activePrompt,          setActivePrompt]          = useState<NavPromptVariant>('none')
  const [upgradeModalSuppressed, setUpgradeModalSuppressed] = useState(false)

  useEffect(() => {
    setNavCount(getAnonNavCount())
  }, [])

  const dismissPrompt = useCallback(() => {
    if (activePrompt === 'upgrade') {
      setUpgradeCooldown()
    }
    setActivePrompt('none')
  }, [activePrompt])

  const syncServerCount = useCallback((serverCount: number) => {
    setNavCount((current) => Math.max(current, serverCount))
  }, [])

  const recordNavigation = useCallback(
    ({ isPremium: premium, isLapsed = false, isAuthenticated = false, serverCount }: RecordNavOptions) => {
      setIsPremium(premium)
      if (premium) {
        if (serverCount !== undefined) setNavCount(serverCount)
        return
      }

      // Determine new count
      let newCount: number
      if (serverCount !== undefined) {
        newCount = serverCount
        setNavCount(newCount)
      } else {
        newCount = incrementAnonNavCount()
        setNavCount(newCount)
      }

      // Determine which prompt to show
      if (newCount > FREE_NAV_LIMIT) {
        // Check 24h cooldown
        if (isUpgradeCoolingDown()) {
          setActivePrompt('none')
          setUpgradeModalSuppressed(true)
          return
        }
        setUpgradeModalSuppressed(false)
        setActivePrompt('upgrade')
      } else if (newCount === FREE_NAV_LIMIT) {
        if (isLapsed) {
          setActivePrompt('lapsed-premium')
        } else if (!isAuthenticated) {
          setActivePrompt('auth-3')
        } else {
          setActivePrompt('none')
        }
      } else if (newCount === 2 && !isAuthenticated) {
        setActivePrompt('auth-2')
      } else if (newCount === 1 && !isAuthenticated) {
        setActivePrompt('auth-1')
      } else {
        setActivePrompt('none')
      }
    },
    []
  )

  return (
    <NavigationContext.Provider
      value={{
        navCount, isPremium, activePrompt, upgradeModalSuppressed,
        dismissPrompt, recordNavigation, syncServerCount,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => useContext(NavigationContext)

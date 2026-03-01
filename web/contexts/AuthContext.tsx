"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser, getMe, mergeAnonymousCount } from '@/lib/api'
import { getAnonNavCount, getOrCreateVisitorId } from '@/lib/visitorTracking'
import { track } from '@/lib/analytics'

interface AuthContextValue {
  user:            AuthUser | null
  token:           string | null
  loading:         boolean
  needsOnboarding: boolean
  setAuth:         (token: string, user: AuthUser) => Promise<void>
  updateUser:      (user: AuthUser) => void
  signOut:         () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, loading: true,
  needsOnboarding: false,
  setAuth: async () => {}, updateUser: () => {}, signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,            setUser]            = useState<AuthUser | null>(null)
  const [token,           setToken]           = useState<string | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('findoc_token')
    if (!stored) { setLoading(false); return }
    getMe(stored)
      .then((u) => { setToken(stored); setUser(u) })
      .catch(() => localStorage.removeItem('findoc_token'))
      .finally(() => setLoading(false))
  }, [])

  async function setAuth(t: string, u: AuthUser) {
    localStorage.setItem('findoc_token', t)
    setToken(t)

    const anonCount  = getAnonNavCount()
    const anonymousId = getOrCreateVisitorId()
    let   finalUser  = u

    if (anonCount > 0) {
      try {
        finalUser = await mergeAnonymousCount(t, anonCount)

        // Fire navigation_counter_transferred when anon count carried over
        track('navigation_counter_transferred', {
          navigation_count_before_transfer: anonCount,
          navigation_count_after_transfer:  finalUser.navigations_this_month,
        }, { token: t, user_id: finalUser.id })

        setUser(finalUser)
      } catch {
        setUser(u)
        finalUser = u
      }
    } else {
      setUser(u)
    }

    // Fire auth_completed
    track('auth_completed', {
      was_anonymous_before:         anonCount > 0,
      navigation_count_this_month:  finalUser.navigations_this_month,
      anonymous_id:                 anonymousId,
    }, {
      token:    t,
      user_id:  finalUser.id,
      emirate:  finalUser.emirate,
    })

    const isNew = !u.emirate
    setNeedsOnboarding(isNew)
  }

  function updateUser(u: AuthUser) {
    setUser(u)
    setNeedsOnboarding(false)
  }

  function signOut() {
    localStorage.removeItem('findoc_token')
    setToken(null)
    setUser(null)
    setNeedsOnboarding(false)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, needsOnboarding, setAuth, updateUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}


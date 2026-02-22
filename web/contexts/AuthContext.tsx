'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser, getMe, mergeAnonymousCount } from '@/lib/api'
import { getAnonNavCount } from '@/lib/visitorTracking'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  /** True when a new sign-in user needs to complete the onboarding screen */
  needsOnboarding: boolean
  setAuth: (token: string, user: AuthUser) => void
  /** Update the in-memory user after profile changes (onboarding, etc.) */
  updateUser: (user: AuthUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, loading: true,
  needsOnboarding: false,
  setAuth: () => {}, updateUser: () => {}, signOut: () => {},
})

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

    // Transfer anonymous navigation count → server (never resets on sign-in)
    const anonCount = getAnonNavCount()
    if (anonCount > 0) {
      try {
        const merged = await mergeAnonymousCount(t, anonCount)
        setUser(merged)
      } catch {
        setUser(u) // fallback — still show the user
      }
    } else {
      setUser(u)
    }

    // Show onboarding screen if user hasn't set their emirate yet
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

export const useAuth = () => useContext(AuthContext)

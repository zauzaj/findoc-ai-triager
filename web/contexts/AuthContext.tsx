'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser, getMe } from '@/lib/api'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  setAuth: (token: string, user: AuthUser) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, loading: true,
  setAuth: () => {}, signOut: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null)
  const [token,   setToken]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('findoc_token')
    if (!stored) { setLoading(false); return }
    getMe(stored)
      .then((u) => { setToken(stored); setUser(u) })
      .catch(() => localStorage.removeItem('findoc_token'))
      .finally(() => setLoading(false))
  }, [])

  function setAuth(t: string, u: AuthUser) {
    localStorage.setItem('findoc_token', t)
    setToken(t)
    setUser(u)
  }

  function signOut() {
    localStorage.removeItem('findoc_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

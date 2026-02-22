'use client'

import { useState, useCallback, useEffect } from 'react'
import { getStoredLocale, setStoredLocale } from '@/lib/visitorTracking'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Returns the active locale and a toggle function.
 * Priority: signed-in user's server locale → localStorage → 'en'
 */
export function useLocale() {
  const { user } = useAuth()
  const [locale, setLocale] = useState<'en' | 'ar'>('en')

  useEffect(() => {
    // Server locale wins for signed-in users; otherwise read localStorage
    const initial = user?.locale ?? getStoredLocale()
    setLocale(initial)
  }, [user?.locale])

  const toggle = useCallback(() => {
    setLocale((prev) => {
      const next = prev === 'en' ? 'ar' : 'en'
      setStoredLocale(next)
      return next
    })
  }, [])

  return { locale, toggle }
}

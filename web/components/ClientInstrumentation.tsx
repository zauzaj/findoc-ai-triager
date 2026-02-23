'use client'

import { useEffect } from 'react'
import { initClientErrorTracking } from '@/sentry.client.config'

export default function ClientInstrumentation() {
  useEffect(() => {
    initClientErrorTracking()
  }, [])

  return null
}

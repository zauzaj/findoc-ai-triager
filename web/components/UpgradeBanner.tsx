'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createCheckout } from '@/lib/api'

const FREE_LIMIT = 10

export default function UpgradeBanner() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)

  // Only show for logged-in free-plan users who are near or at their limit
  if (!user || user.plan === 'premium') return null
  const used     = user.navigations_this_month ?? 0
  const atLimit  = used >= FREE_LIMIT
  const nearLimit = used >= FREE_LIMIT - 3   // warn with 3 searches remaining
  if (!nearLimit) return null

  async function handleUpgrade() {
    if (!token) return
    setLoading(true)
    try {
      const url = await createCheckout(token)
      window.location.href = url
    } catch {
      alert('Could not start checkout — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`border-b px-4 py-2.5 ${
        atLimit
          ? 'bg-status-error-bg border-status-error-border'
          : 'bg-status-medium-bg border-status-medium-border'
      }`}
      role="alert"
    >
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-primary">
          {atLimit ? (
            <>
              <strong>Monthly limit reached.</strong> Upgrade to Premium to keep getting
              AI-guided specialist recommendations.
            </>
          ) : (
            <>
              <strong>{FREE_LIMIT - used} search{FREE_LIMIT - used === 1 ? '' : 'es'} left</strong> this
              month on the free plan.
            </>
          )}
        </p>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="rounded bg-primary-orange px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60 flex-shrink-0"
        >
          {loading ? 'Opening checkout…' : '⚡ Go Premium'}
        </button>
      </div>
    </div>
  )
}

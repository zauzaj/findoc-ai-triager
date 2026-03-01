'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createCheckout, getMe } from '@/lib/api'
import { FREE_NAV_LIMIT, UPGRADE_PRICE_AED } from '@/lib/constants'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function ProfilePage() {
  const { user, token, loading, signOut, updateUser } = useAuth()
  const { track } = useAnalytics()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)
  const [pollForUpgrade, setPollForUpgrade] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/signin')
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      setUpgraded(true)
      setPollForUpgrade(true)
      track('checkout_completed', { plan_type: 'premium', price_aed: UPGRADE_PRICE_AED })
      window.history.replaceState({}, '', '/profile')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pollForUpgrade || !token) return

    let cancelled = false
    let attempts = 0
    const maxAttempts = 8

    async function refresh() {
      if (cancelled) return
      attempts += 1
      try {
        const latestUser = await getMe(token)
        updateUser(latestUser)
        if (latestUser.plan === 'premium') {
          setPollForUpgrade(false)
          return
        }
      } catch {
        // Ignore transient fetch errors; polling retries below.
      }

      if (!cancelled && attempts < maxAttempts) {
        window.setTimeout(refresh, 2000)
      } else {
        setPollForUpgrade(false)
      }
    }

    refresh()
    return () => { cancelled = true }
  }, [pollForUpgrade, token, updateUser])

  if (loading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    )
  }

  const isPremium = user.plan === 'premium'
  const used = user.navigations_this_month ?? 0
  const remaining = Math.max(0, FREE_NAV_LIMIT - used)
  const cancelling = user.ls_subscription_status === 'cancelled' && isPremium

  async function handleUpgrade() {
    if (!token) return
    setCheckoutLoading(true)
    try {
      const url = await createCheckout(token)
      window.location.href = url
    } catch {
      alert('Could not open checkout — please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="mb-6 text-3xl font-extrabold text-slate-900">Your Profile</h1>

      {upgraded && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="text-xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Welcome to Premium!</p>
            <p className="mt-0.5 text-xs text-emerald-700/90">
              Unlimited navigations and full clinic results are now unlocked.
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white select-none">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{user.name ?? 'No name'}</p>
          <p className="truncate text-sm text-slate-600">{user.email}</p>
          {user.emirate && (
            <p className="text-xs text-slate-500">
              {user.emirate}{user.insurance_provider ? ` · ${user.insurance_provider}` : ''}
            </p>
          )}
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
              isPremium ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {isPremium ? 'Premium' : 'Free plan'}
          </span>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Patient pricing</h2>

        {isPremium ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              {cancelling
                ? 'Your subscription is cancelled and will expire at the end of this billing period. Premium access continues until then.'
                : 'Unlimited navigations and full clinic lists are active on your account.'}
            </p>
            {cancelling && (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-60"
              >
                {checkoutLoading ? 'Loading…' : `Reactivate — AED ${UPGRADE_PRICE_AED}/mo`}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                <span>{used} of {FREE_NAV_LIMIT} navigations used this month</span>
                <span>{remaining} remaining</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remaining === 0 ? 'bg-red-500' : 'bg-slate-900'
                  }`}
                  style={{ width: `${Math.min(100, (used / FREE_NAV_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-slate-900">Upgrade to Premium — AED {UPGRADE_PRICE_AED}/month</p>
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  <li>• Unlimited navigations every month</li>
                  <li>• Full clinic list for your insurance network</li>
                  <li>• Save doctors + full navigation history</li>
                </ul>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="flex-shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-60"
              >
                {checkoutLoading ? 'Opening checkout…' : 'Upgrade now'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">No contracts. Cancel anytime.</p>
          </>
        )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: '/profile/history', label: 'Search history', emoji: '🔍', premiumOnly: true },
          { href: '/profile/saved', label: 'Saved clinics', emoji: '❤️', premiumOnly: true },
          { href: '/profile/called', label: 'Called clinics', emoji: '📞', premiumOnly: false },
        ].map(({ href, label, emoji, premiumOnly }) => (
          <Link
            key={href}
            href={premiumOnly && !isPremium ? '#' : href}
            onClick={premiumOnly && !isPremium ? (e) => { e.preventDefault(); handleUpgrade() } : undefined}
            className={`flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition ${
              premiumOnly && !isPremium
                ? 'cursor-pointer border-slate-200 opacity-70 hover:border-slate-300'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <div className="min-w-0">
              <span className="block text-sm font-medium text-slate-900">{label}</span>
              {premiumOnly && !isPremium && (
                <span className="text-xs text-slate-500">Premium only</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={signOut}
        className="text-sm text-slate-500 hover:text-red-600 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}

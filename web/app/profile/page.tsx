'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createCheckout } from '@/lib/api'
import { FREE_NAV_LIMIT, UPGRADE_PRICE_AED } from '@/lib/constants'

export default function ProfilePage() {
  const { user, token, loading, signOut } = useAuth()
  const router = useRouter()
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/signin')
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect post-checkout redirect (?upgraded=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === '1') {
      setUpgraded(true)
      window.history.replaceState({}, '', '/profile')
    }
  }, [])

  if (loading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin" />
      </div>
    )
  }

  const isPremium  = user.plan === 'premium'
  const used       = user.navigations_this_month ?? 0
  const remaining  = Math.max(0, FREE_NAV_LIMIT - used)
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-semibold text-primary-blue mb-6">Your Profile</h1>

      {/* Post-checkout success banner */}
      {upgraded && (
        <div className="mb-5 rounded border border-primary-green bg-soft-green p-4 flex items-start gap-3">
          <span className="text-xl">🎉</span>
          <div>
            <p className="font-semibold text-primary-blue text-sm">Welcome to Premium!</p>
            <p className="text-xs text-text-muted mt-0.5">
              Unlimited navigations and the full clinic list are now unlocked.
            </p>
          </div>
        </div>
      )}

      {/* User card */}
      <div className="bg-white rounded border-2 border-card-border p-6 shadow-card mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-blue flex items-center justify-center text-white text-xl font-bold select-none flex-shrink-0">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary truncate">{user.name ?? 'No name'}</p>
          <p className="text-sm text-text-muted truncate">{user.email}</p>
          {user.emirate && (
            <p className="text-xs text-text-muted">
              {user.emirate}{user.insurance_provider ? ` · ${user.insurance_provider}` : ''}
            </p>
          )}
          <span
            className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
              isPremium
                ? 'bg-primary-blue text-white'
                : 'bg-soft-blue text-primary-blue'
            }`}
          >
            {isPremium ? 'Premium' : 'Free plan'}
          </span>
        </div>
      </div>

      {/* Plan / billing card */}
      <div className="bg-white rounded border-2 border-card-border p-5 shadow-card mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Your plan</h2>

        {isPremium ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-text-muted">
                {cancelling
                  ? 'Your subscription is cancelled and will expire at the end of this billing period. Premium access continues until then.'
                  : 'Unlimited navigations and full clinic lists for your insurance network.'}
              </p>
            </div>
            {cancelling && (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="rounded bg-primary-orange px-4 py-2 text-xs font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60"
              >
                {checkoutLoading ? 'Loading…' : `Reactivate — AED ${UPGRADE_PRICE_AED}/mo`}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Usage bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-text-muted mb-1.5">
                <span>{used} of {FREE_NAV_LIMIT} navigations used this month</span>
                <span>{remaining} remaining</span>
              </div>
              <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remaining === 0 ? 'bg-status-error-text' : 'bg-primary-blue'
                  }`}
                  style={{ width: `${Math.min(100, (used / FREE_NAV_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="rounded border border-soft-blue bg-soft-blue p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary-blue">Upgrade to Premium</p>
                <ul className="text-xs text-text-muted mt-0.5 space-y-0.5">
                  <li>Unlimited navigations every month</li>
                  <li>Full clinic list for your insurance network</li>
                  <li>Save doctors + full navigation history</li>
                </ul>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="rounded bg-primary-orange px-5 py-2 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60 flex-shrink-0"
              >
                {checkoutLoading ? 'Opening checkout…' : `AED ${UPGRADE_PRICE_AED}/month`}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">No contracts. Cancel anytime.</p>
          </>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { href: '/profile/history', label: 'Search history', emoji: '🔍', premiumOnly: true },
          { href: '/profile/saved',   label: 'Saved clinics',  emoji: '❤️', premiumOnly: true },
          { href: '/profile/called',  label: 'Called clinics', emoji: '📞', premiumOnly: false },
        ].map(({ href, label, emoji, premiumOnly }) => (
          <Link
            key={href}
            href={premiumOnly && !isPremium ? '#' : href}
            onClick={premiumOnly && !isPremium ? (e) => { e.preventDefault(); handleUpgrade() } : undefined}
            className={`bg-white rounded border-2 border-card-border p-4 shadow-card flex items-center gap-3 transition-[border-color] duration-300 ${
              premiumOnly && !isPremium
                ? 'opacity-60 cursor-pointer hover:border-primary-orange'
                : 'hover:border-primary-blue'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
            <div className="min-w-0">
              <span className="text-sm font-medium text-text-primary block">{label}</span>
              {premiumOnly && !isPremium && (
                <span className="text-xs text-text-muted">Premium only</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={signOut}
        className="text-sm text-text-muted hover:text-emergency-red transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/signin')
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading || !user) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-semibold text-primary-blue mb-6">Your Profile</h1>

      {/* User card */}
      <div className="bg-white rounded border-2 border-card-border p-6 shadow-card mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-blue flex items-center justify-center text-white text-xl font-bold select-none flex-shrink-0">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-text-primary truncate">{user.name ?? 'No name'}</p>
          <p className="text-sm text-text-muted truncate">{user.email}</p>
          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-soft-blue text-primary-blue capitalize">{user.plan} plan</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { href: '/profile/history', label: 'Search history',  emoji: '🔍' },
          { href: '/profile/saved',   label: 'Saved clinics',   emoji: '❤️' },
          { href: '/profile/called',  label: 'Called clinics',  emoji: '📞' },
        ].map(({ href, label, emoji }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded border-2 border-card-border p-4 shadow-card hover:border-primary-blue transition-[border-color] duration-300 flex items-center gap-3"
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-sm font-medium text-text-primary">{label}</span>
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

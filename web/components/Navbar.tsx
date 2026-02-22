'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SITE_NAME } from '@/lib/constants'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-primary-blue sticky top-0 z-50">
      <nav
        className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        aria-label="Main navigation"
      >
        <Link href="/" className="font-semibold text-white text-lg tracking-tight hover:text-white/80 transition-colors">
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-4 text-sm text-white/80">
          <Link href="/for-clinics" className="hover:text-white transition-colors hidden sm:inline">For Clinics</Link>
          {user ? (
            <>
              <Link href="/profile" className="hover:text-white transition-colors">
                {user.name ?? user.email}
              </Link>
              <button
                onClick={signOut}
                className="hover:text-white transition-colors"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="bg-primary-orange text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-primary-orange-hover transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

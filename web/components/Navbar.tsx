'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { SITE_NAME } from '@/lib/constants'

export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <nav
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main navigation"
      >
        <Link href="/" className="text-lg font-extrabold text-slate-900 tracking-tight hover:text-slate-700 transition-colors">
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-3 text-sm text-slate-600 sm:gap-5">
          <Link href="/for-clinics" className="hidden sm:inline hover:text-slate-900 transition-colors">For Clinics</Link>
          {user ? (
            <>
              <Link href="/profile" className="max-w-[180px] truncate hover:text-slate-900 transition-colors">
                {user.name ?? user.email}
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Sign out"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-700 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

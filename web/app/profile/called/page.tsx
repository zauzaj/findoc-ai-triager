'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

// Called clinics will be populated from the Rails API lead_events endpoint (future).
// For now shows an empty state with correct navigation structure.
export default function CalledPage() {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-6">
        <Link href="/profile" className="text-xs text-text-muted hover:text-text-primary transition-colors">← Profile</Link>
        <h1 className="text-2xl font-semibold text-primary-blue mt-2">Called clinics</h1>
      </div>
      {!user ? (
        <p className="text-text-muted text-sm"><Link href="/auth/signin" className="text-primary-blue hover:underline">Sign in</Link> to see your call history.</p>
      ) : (
        <p className="text-text-muted text-sm">Your clinic calls will appear here after you tap &ldquo;Call Clinic&rdquo; from search results.</p>
      )}
    </div>
  )
}

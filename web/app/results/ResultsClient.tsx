'use client'

import { useState, useEffect } from 'react'
import { searchPlaces, trackEvent, Place } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { FREE_RESULT_LIMIT } from '@/lib/constants'
import DoctorCard from '@/components/DoctorCard'
import StaticMapPreview from '@/components/StaticMapPreview'
import UrgencyBanner from '@/components/UrgencyBanner'
import AuthPromptBanner from '@/components/AuthPromptBanner'
import UpgradeModal from '@/components/UpgradeModal'
import ResultLimitPrompt from '@/components/ResultLimitPrompt'

interface ResultsClientProps {
  specialist: string
  lat?: string
  lng?: string
  insurance?: string
  urgency?: string
  /** Nav count returned from the /navigate API (signed-in users only) */
  serverNavCount?: number
}

export default function ResultsClient({
  specialist,
  lat,
  lng,
  insurance,
  urgency,
  serverNavCount,
}: ResultsClientProps) {
  const { user, token } = useAuth()
  const { activePrompt, dismissPrompt, recordNavigation } = useNavigation()

  const [places,              setPlaces]              = useState<Place[]>([])
  const [loading,             setLoading]             = useState(true)
  const [error,               setError]               = useState('')
  const [navRecorded,         setNavRecorded]         = useState(false)
  const [showResultUpgrade,   setShowResultUpgrade]   = useState(false)

  const isPremium = user?.plan === 'premium'

  // Sign-in href with return-to so user is dropped back here after auth
  const returnTo = encodeURIComponent(
    `/results?specialist=${encodeURIComponent(specialist)}` +
    (insurance ? `&insurance=${encodeURIComponent(insurance)}` : '') +
    (urgency   ? `&urgency=${encodeURIComponent(urgency)}`     : '') +
    (lat       ? `&lat=${lat}`                                  : '') +
    (lng       ? `&lng=${lng}`                                  : '')
  )
  const signInHref = `/auth/signin?return_to=${returnTo}`

  useEffect(() => {
    async function fetchPlaces() {
      setLoading(true)
      setError('')
      try {
        const data = await searchPlaces({ specialist, lat, lng, insurance }, token)
        setPlaces(data)

        // Track views for all returned places
        data.forEach((place) => {
          trackEvent('view', { google_place_id: place.id, specialty: specialist }, token)
        })

        // Record navigation AFTER results load (business rule: "after results load")
        if (!navRecorded) {
          setNavRecorded(true)
          recordNavigation({
            isPremium:   user?.plan === 'premium',
            // For signed-in users: prefer server count from navigate response (already incremented).
            // For anonymous users: undefined (client-side counter used instead).
            serverCount: user ? (serverNavCount ?? user.navigations_this_month) : undefined,
          })
        }
      } catch {
        setError('Unable to load clinics at this time. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialist, lat, lng, insurance])

  // Result limiting — free users see first FREE_RESULT_LIMIT clinics
  const visiblePlaces = isPremium ? places : places.slice(0, FREE_RESULT_LIMIT)
  const hiddenCount   = isPremium ? 0 : Math.max(0, places.length - FREE_RESULT_LIMIT)

  function handleResultLimitUpgradeClick() {
    // "See all results" clicked — show upgrade modal over current results
    setShowResultUpgrade(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" aria-live="polite">
        <div
          className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mb-4"
          aria-hidden="true"
        />
        <p className="text-text-muted text-sm">Finding clinics near you&hellip;</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded border border-status-error-border bg-status-error-bg p-4 text-sm text-status-error-text"
        role="alert"
      >
        {error}
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="rounded border border-card-border bg-white p-8 text-center">
        <p className="text-text-muted text-sm">
          No clinics found for your search criteria. Try adjusting your filters.
        </p>
      </div>
    )
  }

  const showNavUpgradeModal    = activePrompt === 'upgrade'
  const showUpgradeModal       = showNavUpgradeModal || showResultUpgrade

  return (
    <>
      {/* Upgrade modal — triggered by nav #4 OR by "See all results" click */}
      {showUpgradeModal && (
        <UpgradeModal
          totalResults={places.length}
          onDismiss={() => {
            dismissPrompt()
            setShowResultUpgrade(false)
          }}
          token={token}
          signInHref={signInHref}
        />
      )}

      <div className={`space-y-4 ${showUpgradeModal ? 'opacity-40 pointer-events-none select-none' : ''}`}>
        {urgency && urgency !== 'low' && (
          <UrgencyBanner urgency={urgency} />
        )}

        {/* Static Maps API — multi-pin overview, top of results */}
        <StaticMapPreview places={visiblePlaces} userLat={lat} userLng={lng} />

        <p className="text-xs text-text-muted">
          {places.length} clinic{places.length !== 1 ? 's' : ''} found
          {insurance ? ` · filtered by ${insurance}` : ''}
        </p>

        <ul className="space-y-3" aria-label="Clinic results">
          {visiblePlaces.map((place) => (
            <li key={place.id}>
              <DoctorCard place={place} insurance={insurance} />
            </li>
          ))}
        </ul>

        {/* Result cap prompt — only shown when more exist and not premium */}
        {hiddenCount > 0 && (
          <ResultLimitPrompt
            hiddenCount={hiddenCount}
            onUpgradeClick={handleResultLimitUpgradeClick}
          />
        )}

        {/* Auth nudge banners — shown after nav #1, #2, #3 for anonymous users */}
        {!user && activePrompt !== 'none' && activePrompt !== 'upgrade' && (
          <AuthPromptBanner
            variant={activePrompt}
            onDismiss={dismissPrompt}
            signInHref={signInHref}
          />
        )}

        <p className="text-xs text-text-muted pt-2 border-t border-card-border">
          Results are not ranked by quality. Sorted by proximity and rating only. Findoc does
          not endorse any clinic.
        </p>
      </div>
    </>
  )
}

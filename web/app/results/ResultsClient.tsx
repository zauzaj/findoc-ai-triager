'use client'

import { useState, useEffect } from 'react'
import { clinicPlaceId, searchPlaces, trackEvent, Place } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { useAnalytics } from '@/hooks/useAnalytics'
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
  serverNavCount?: number
}

export default function ResultsClient({
  specialist, lat, lng, insurance, urgency, serverNavCount,
}: ResultsClientProps) {
  const { user, token } = useAuth()
  const { track } = useAnalytics()
  const {
    activePrompt, upgradeModalSuppressed,
    dismissPrompt, recordNavigation, navCount,
  } = useNavigation()

  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [navRecorded, setNavRecorded] = useState(false)
  const [showResultUpgrade, setShowResultUpgrade] = useState(false)

  const isPremium = user?.plan === 'premium'
  const isLapsed = !isPremium && !!(
    user?.ls_subscription_status === 'cancelled' ||
    user?.ls_subscription_status === 'expired'
  )

  const returnTo = encodeURIComponent(
    `/results?specialist=${encodeURIComponent(specialist)}` +
    (insurance ? `&insurance=${encodeURIComponent(insurance)}` : '') +
    (urgency ? `&urgency=${encodeURIComponent(urgency)}` : '') +
    (lat ? `&lat=${lat}` : '') +
    (lng ? `&lng=${lng}` : '')
  )
  const signInHref = `/auth/signin?return_to=${returnTo}`
  const upgradeHref = token ? undefined : signInHref

  useEffect(() => {
    async function fetchPlaces() {
      setLoading(true)
      setError('')
      try {
        const data = await searchPlaces({ specialist, lat, lng, insurance }, token)
        setPlaces(data)

        data.forEach((place) => {
          trackEvent('view', { google_place_id: clinicPlaceId(place), specialty: specialist }, token)
        })

        if (!navRecorded) {
          setNavRecorded(true)
          const effectiveServerCount = user
            ? (serverNavCount ?? user.navigations_this_month)
            : undefined

          recordNavigation({
            isPremium,
            isLapsed,
            isAuthenticated: !!user,
            serverCount: effectiveServerCount,
          })

          const eventName = isPremium ? 'premium_navigation_completed' : 'navigation_completed'
          const newCount = effectiveServerCount ?? navCount + 1
          track(eventName, {
            specialist_type: specialist,
            insurance_selected: insurance ?? null,
            total_matching_results: data.length,
            results_shown: isPremium ? data.length : Math.min(data.length, FREE_RESULT_LIMIT),
            navigation_number_this_month: newCount,
            is_capped: !isPremium && data.length > FREE_RESULT_LIMIT,
          })
        }
      } catch {
        setError('Unable to load clinics at this time. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlaces()
  }, [specialist, lat, lng, insurance]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (upgradeModalSuppressed) {
      track('upgrade_modal_suppressed', {
        navigation_number_this_month: navCount,
      })
    }
  }, [upgradeModalSuppressed]) // eslint-disable-line react-hooks/exhaustive-deps

  const visiblePlaces = isPremium ? places : places.slice(0, FREE_RESULT_LIMIT)
  const hiddenCount = isPremium ? 0 : Math.max(0, places.length - FREE_RESULT_LIMIT)

  function handleResultLimitUpgradeClick() {
    setShowResultUpgrade(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" aria-live="polite">
        <div className="mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" aria-hidden="true" />
        <p className="text-sm text-slate-500">Finding clinics near you&hellip;</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
        {error}
      </div>
    )
  }

  if (places.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">
          No clinics found for your search criteria. Try adjusting your filters.
        </p>
      </div>
    )
  }

  const showUpgradeModal = activePrompt === 'upgrade' || showResultUpgrade
  const showBanner =
    activePrompt !== 'none' &&
    activePrompt !== 'upgrade' &&
    (!user || activePrompt === 'lapsed-premium')

  return (
    <>
      {showUpgradeModal && (
        <UpgradeModal
          totalResults={places.length}
          onDismiss={() => { dismissPrompt(); setShowResultUpgrade(false) }}
          token={token}
          signInHref={signInHref}
        />
      )}

      <div className={`space-y-5 ${showUpgradeModal ? 'pointer-events-none select-none opacity-40' : ''}`}>
        {urgency && urgency !== 'low' && <UrgencyBanner urgency={urgency} />}

        <StaticMapPreview places={visiblePlaces} userLat={lat} userLng={lng} />

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm">
          {places.length} clinic{places.length !== 1 ? 's' : ''} found
          {insurance ? ` · filtered by ${insurance}` : ''}
        </div>

        <ul className="space-y-3" aria-label="Clinic results">
          {visiblePlaces.map((place) => (
            <li key={clinicPlaceId(place)}>
              <DoctorCard place={place} insurance={insurance} />
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <ResultLimitPrompt
            hiddenCount={hiddenCount}
            totalCount={places.length}
            onUpgradeClick={handleResultLimitUpgradeClick}
          />
        )}

        {showBanner && (
          <AuthPromptBanner
            variant={activePrompt}
            onDismiss={dismissPrompt}
            signInHref={signInHref}
            upgradeHref={upgradeHref}
            navCount={navCount}
          />
        )}

        <p className="border-t border-slate-200 pt-3 text-xs text-slate-500">
          Results are not ranked by quality. Sorted by proximity and rating only. Findoc does not
          endorse any clinic.
        </p>
      </div>
    </>
  )
}

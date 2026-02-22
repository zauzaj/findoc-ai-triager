'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { navigate, NavigateResponse } from '@/lib/api'
import SpecialistCard from '@/components/SpecialistCard'
import UrgencyBanner from '@/components/UrgencyBanner'
import InsuranceSelect from '@/components/InsuranceSelect'

interface NavigateClientProps {
  symptoms: string
  initialInsurance: string
}

export default function NavigateClient({
  symptoms,
  initialInsurance,
}: NavigateClientProps) {
  const router = useRouter()
  const [result, setResult] = useState<NavigateResponse | null>(null)
  const [insurance, setInsurance] = useState(initialInsurance)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchNavigation() {
      setLoading(true)
      setError('')
      try {
        const data = await navigate(symptoms, insurance || undefined)
        setResult(data)
      } catch {
        setError('Unable to process your request. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (symptoms) {
      fetchNavigation()
    } else {
      setLoading(false)
      setError('No symptoms provided. Please go back and describe your symptoms.')
    }
  }, [symptoms, insurance])

  function handleFindClinics() {
    if (!result) return
    const params = new URLSearchParams({ specialist: result.specialist })
    if (insurance) params.set('insurance', insurance)
    router.push(`/results?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" aria-live="polite">
        <div
          className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin mb-4"
          aria-hidden="true"
        />
        <p className="text-text-muted text-sm">Analysing your symptoms&hellip;</p>
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

  if (!result) return null

  return (
    <div className="space-y-5">
      <UrgencyBanner urgency={result.urgency} />

      <SpecialistCard
        specialist={result.specialist}
        explanation={result.explanation}
        confidence={result.confidence}
      />

      <div className="bg-white rounded border-2 border-card-border p-5 shadow-card">
        <InsuranceSelect value={insurance} onChange={setInsurance} />
      </div>

      <button
        onClick={handleFindClinics}
        className="w-full rounded bg-primary-blue px-6 py-3 text-sm font-semibold text-white hover:bg-primary-blue-hover focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transition-colors"
        aria-label={`Find ${result.specialist} clinics near me`}
      >
        Find Clinics Near Me
      </button>

      <p className="text-xs text-text-muted text-center">
        Results are sorted by distance and rating. Findoc does not recommend or endorse
        specific providers.
      </p>
    </div>
  )
}

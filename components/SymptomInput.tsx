'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import InsuranceSelect from './InsuranceSelect'

export default function SymptomInput() {
  const router = useRouter()
  const [symptoms, setSymptoms] = useState('')
  const [insurance, setInsurance] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const trimmed = symptoms.trim()
    if (!trimmed) {
      setError('Please describe your symptoms before continuing.')
      return
    }

    setError('')
    setIsSubmitting(true)

    const params = new URLSearchParams({ symptoms: trimmed })
    if (insurance) params.set('insurance', insurance)

    router.push(`/navigate?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Symptom navigation form">
      <div className="mb-4">
        <label
          htmlFor="symptoms"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Describe your symptoms
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          rows={4}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. I have had a persistent cough for two weeks, some chest tightness, and mild fever..."
          className="w-full rounded border border-gray-200 bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue resize-none"
          aria-describedby={error ? 'symptoms-error' : undefined}
          aria-invalid={!!error}
          disabled={isSubmitting}
        />
        {error && (
          <p id="symptoms-error" className="mt-1 text-xs text-emergency-red" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="mb-5">
        <InsuranceSelect value={insurance} onChange={setInsurance} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-primary-blue px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="Get guidance on which specialist to see"
      >
        {isSubmitting ? 'Finding your specialist…' : 'Get Guidance'}
      </button>
    </form>
  )
}

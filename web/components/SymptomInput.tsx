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
    <form onSubmit={handleSubmit} noValidate aria-label="Symptom navigation form" className="space-y-5">
      <div>
        <label
          htmlFor="symptoms"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Describe your symptoms
        </label>
        <textarea
          id="symptoms"
          name="symptoms"
          rows={5}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="e.g. I have had a persistent cough for two weeks, chest tightness, and mild fever..."
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 resize-none transition"
          aria-describedby={error ? 'symptoms-error' : undefined}
          aria-invalid={!!error}
          disabled={isSubmitting}
        />
        {error && (
          <p id="symptoms-error" className="mt-2 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <InsuranceSelect value={insurance} onChange={setInsurance} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 transition disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Get guidance on which specialist to see"
      >
        {isSubmitting ? 'Finding your specialist…' : 'Get Guidance'}
      </button>
    </form>
  )
}

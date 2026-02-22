'use client'

/**
 * Post-signup onboarding — one screen only.
 * Appears immediately after first sign-in.
 * Does NOT count as a navigation. Does NOT reset any counters.
 * After submission: user returns to exactly where they were (return_to param).
 */

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/lib/api'
import { UAE_EMIRATES, INSURERS_WITH_NONE, SITE_NAME } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'

const T = {
  en: {
    title: 'Two quick questions',
    emirateLabel: 'Which emirate are you in?',
    emiratePlaceholder: 'Select emirate',
    insuranceLabel: 'Do you have health insurance?',
    insurancePlaceholder: 'Select insurance',
    cta: 'Continue →',
    saving: 'Saving…',
    skip: 'Skip for now',
  },
  ar: {
    title: 'سؤالان سريعان',
    emirateLabel: 'في أي إمارة أنت؟',
    emiratePlaceholder: 'اختر الإمارة',
    insuranceLabel: 'هل لديك تأمين صحي؟',
    insurancePlaceholder: 'اختر التأمين',
    cta: 'متابعة →',
    saving: 'جاري الحفظ…',
    skip: 'تخطي الآن',
  },
}

const EMIRATE_AR: Record<string, string> = {
  Dubai:     'دبي',
  'Abu Dhabi': 'أبوظبي',
  Sharjah:   'الشارقة',
  Other:     'أخرى',
}

function OnboardingInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user, token, updateUser } = useAuth()
  const { locale, toggle } = useLocale()
  const t = T[locale]
  const isRTL = locale === 'ar'

  const [emirate,   setEmirate]   = useState(user?.emirate ?? '')
  const [insurance, setInsurance] = useState(user?.insurance_provider ?? '')
  const [saving,    setSaving]    = useState(false)

  // Where to go after onboarding
  const returnTo = searchParams.get('return_to') ?? '/profile'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) { router.replace(returnTo); return }
    setSaving(true)
    try {
      const updated = await updateProfile(token, {
        emirate:           emirate   || undefined,
        insurance_provider: insurance || undefined,
      })
      updateUser(updated)
    } catch {
      // Non-fatal — proceed anyway
    } finally {
      router.replace(returnTo)
    }
  }

  function handleSkip() {
    router.replace(returnTo)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded border-2 border-card-border p-8 shadow-card">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggle}
            className="text-xs text-text-muted hover:text-primary-blue transition-colors border border-brand-border rounded px-2 py-0.5"
          >
            {locale === 'en' ? '🇦🇪 العربية' : '🇬🇧 English'}
          </button>
        </div>

        <h1 className="text-xl font-semibold text-primary-blue mb-1">{SITE_NAME}</h1>
        <p className="text-lg font-medium text-text-primary mb-6">{t.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emirate */}
          <div>
            <label htmlFor="emirate" className="block text-sm font-medium text-text-label mb-1">
              {t.emirateLabel}
            </label>
            <select
              id="emirate"
              value={emirate}
              onChange={(e) => setEmirate(e.target.value)}
              className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue"
            >
              <option value="">{t.emiratePlaceholder}</option>
              {UAE_EMIRATES.map((em) => (
                <option key={em} value={em}>
                  {isRTL ? (EMIRATE_AR[em] ?? em) : em}
                </option>
              ))}
            </select>
          </div>

          {/* Insurance */}
          <div>
            <label htmlFor="insurance" className="block text-sm font-medium text-text-label mb-1">
              {t.insuranceLabel}
            </label>
            <select
              id="insurance"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue"
            >
              <option value="">{t.insurancePlaceholder}</option>
              {INSURERS_WITH_NONE.map((ins) => (
                <option key={ins} value={ins}>{ins}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60"
          >
            {saving ? t.saving : t.cta}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={handleSkip}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin" />
        </div>
      }
    >
      <OnboardingInner />
    </Suspense>
  )
}

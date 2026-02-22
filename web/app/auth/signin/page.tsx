'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { requestMagicLink } from '@/lib/api'
import { SITE_NAME } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'

const T = {
  en: {
    title: SITE_NAME,
    subtitle: 'Filter results by your insurance. Save doctors you want to revisit.',
    google: 'Continue with Google',
    apple: 'Continue with Apple',
    emailLabel: 'Email me a sign-in link',
    emailPlaceholder: 'you@example.com',
    emailCta: 'Send sign-in link',
    sending: 'Sending…',
    checkEmail: 'Check your email',
    checkSub: (email: string) => `We sent a sign-in link to ${email}`,
    trust: 'We never share your data with clinics.',
    terms: "By continuing you agree to Findoc's Terms of Service. This platform provides health navigation guidance only — not medical advice.",
    error: 'Failed to send magic link. Please try again.',
    errorEmpty: 'Please enter your email address.',
  },
  ar: {
    title: SITE_NAME,
    subtitle: 'فلتر نتائجك حسب تأمينك. احفظ الأطباء الذين تريد مراجعتهم.',
    google: 'المتابعة مع Google',
    apple: 'المتابعة مع Apple',
    emailLabel: 'أرسل لي رابط تسجيل الدخول',
    emailPlaceholder: 'بريدك@example.com',
    emailCta: 'إرسال رابط تسجيل الدخول',
    sending: 'جاري الإرسال…',
    checkEmail: 'تفقد بريدك الإلكتروني',
    checkSub: (email: string) => `أرسلنا رابط تسجيل الدخول إلى ${email}`,
    trust: 'نحن لا نشارك بياناتك مع العيادات.',
    terms: 'بالمتابعة، أنت توافق على شروط الخدمة. هذه المنصة تقدم توجيهاً صحياً فقط — وليس نصيحة طبية.',
    error: 'فشل إرسال الرابط. يرجى المحاولة مرة أخرى.',
    errorEmpty: 'يرجى إدخال عنوان بريدك الإلكتروني.',
  },
}

function SignInInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user }     = useAuth()
  const { locale, toggle } = useLocale()
  const t    = T[locale]
  const isRTL = locale === 'ar'

  const returnTo = searchParams.get('return_to') ?? '/profile'

  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  if (user) { router.replace(returnTo); return null }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError(t.errorEmpty); return }
    setError('')
    setLoading(true)
    try {
      await requestMagicLink(email.trim())
      setSent(true)
    } catch {
      setError(t.error)
    } finally {
      setLoading(false)
    }
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

        <h1 className="text-xl font-semibold text-primary-blue mb-1">{t.title}</h1>
        <p className="text-sm text-text-muted mb-6">{t.subtitle}</p>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">📬</div>
            <p className="font-medium text-text-primary mb-1">{t.checkEmail}</p>
            <p className="text-sm text-text-muted">{t.checkSub(email)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Google OAuth placeholder */}
            <button
              className="w-full rounded border-2 border-brand-border bg-white px-6 py-3 text-sm font-semibold text-text-primary hover:bg-surface-subtle transition-colors flex items-center justify-center gap-2"
              onClick={() => alert('Connect GOOGLE_CLIENT_ID_WEB in env to enable Google sign-in')}
            >
              <span aria-hidden="true">G</span> {t.google}
            </button>

            {/* Apple placeholder */}
            <button
              className="w-full rounded border-2 border-brand-border bg-white px-6 py-3 text-sm font-semibold text-text-primary hover:bg-surface-subtle transition-colors flex items-center justify-center gap-2"
              onClick={() => alert('Connect Apple OAuth credentials in env to enable Apple sign-in')}
            >
              <span aria-hidden="true">A</span> {t.apple}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-card-border" />
              <span className="text-xs text-text-muted">{isRTL ? 'أو' : 'or'}</span>
              <div className="flex-1 h-px bg-card-border" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleMagicLink} noValidate>
              <label htmlFor="email" className="block text-sm font-medium text-text-label mb-1">
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue mb-3"
                disabled={loading}
                dir="ltr"
                autoFocus
              />
              {error && <p className="text-xs text-emergency-red mb-3" role="alert">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60"
              >
                {loading ? t.sending : t.emailCta}
              </button>
            </form>
          </div>
        )}

        {/* Mandatory trust signal — non-negotiable on every auth screen */}
        <p className="text-xs font-medium text-primary-blue mt-5 text-center">{t.trust}</p>

        <p className="text-xs text-text-muted mt-3 text-center leading-relaxed">{t.terms}</p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInInner />
    </Suspense>
  )
}

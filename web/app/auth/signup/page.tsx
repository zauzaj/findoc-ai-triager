'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { signUpWithPassword } from '@/lib/api'
import { SITE_NAME } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'
import { useAnalytics } from '@/hooks/useAnalytics'

const T = {
  en: {
    title: `Create your ${SITE_NAME} account`,
    subtitle: 'Sign up with email and password to save clinics and sync your progress.',
    nameLabel: 'Name (optional)',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    confirmLabel: 'Confirm password',
    confirmPlaceholder: 'Re-enter password',
    cta: 'Create account',
    creating: 'Creating…',
    errorEmpty: 'Please fill email and password.',
    errorShort: 'Password must be at least 8 characters.',
    errorMatch: 'Passwords do not match.',
    errorGeneric: 'Could not create account. Try a different email.',
    already: 'Already have an account? Sign in',
    trust: 'We never share your data with clinics.',
    terms: "By continuing you agree to Findoc's Terms of Service. This platform provides health navigation guidance only — not medical advice.",
  },
  ar: {
    title: `أنشئ حسابك في ${SITE_NAME}`,
    subtitle: 'أنشئ حساباً بالبريد وكلمة المرور لحفظ العيادات ومزامنة تقدمك.',
    nameLabel: 'الاسم (اختياري)',
    namePlaceholder: 'اسمك',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'بريدك@example.com',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: '8 أحرف على الأقل',
    confirmLabel: 'تأكيد كلمة المرور',
    confirmPlaceholder: 'أعد إدخال كلمة المرور',
    cta: 'إنشاء حساب',
    creating: 'جاري الإنشاء…',
    errorEmpty: 'يرجى إدخال البريد وكلمة المرور.',
    errorShort: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
    errorMatch: 'كلمتا المرور غير متطابقتين.',
    errorGeneric: 'تعذر إنشاء الحساب. جرّب بريداً آخر.',
    already: 'لديك حساب بالفعل؟ سجل الدخول',
    trust: 'نحن لا نشارك بياناتك مع العيادات.',
    terms: 'بالمتابعة، أنت توافق على شروط الخدمة. هذه المنصة تقدم توجيهاً صحياً فقط — وليس نصيحة طبية.',
  },
}

function SignUpInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, setAuth } = useAuth()
  const { locale, toggle } = useLocale()
  const { track } = useAnalytics()
  const t = T[locale]
  const isRTL = locale === 'ar'

  const returnTo = searchParams.get('return_to') ?? '/onboarding'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) {
    router.replace(returnTo)
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError(t.errorEmpty)
      return
    }
    if (password.length < 8) {
      setError(t.errorShort)
      return
    }
    if (password !== passwordConfirmation) {
      setError(t.errorMatch)
      return
    }

    setError('')
    setLoading(true)
    try {
      track('auth_started', { provider: 'password_signup', trigger_source: 'signup_page' })
      const { token, user: signedInUser } = await signUpWithPassword(email.trim(), password, name.trim() || undefined)
      await setAuth(token, signedInUser)
      router.replace(returnTo)
    } catch {
      setError(t.errorGeneric)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white rounded border-2 border-card-border p-8 shadow-card">
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

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="name" className="block text-sm font-medium text-text-label mb-1">{t.nameLabel}</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue mb-3"
            disabled={loading}
          />

          <label htmlFor="email" className="block text-sm font-medium text-text-label mb-1">{t.emailLabel}</label>
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

          <label htmlFor="password" className="block text-sm font-medium text-text-label mb-1">{t.passwordLabel}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.passwordPlaceholder}
            className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue mb-3"
            disabled={loading}
            dir="ltr"
          />

          <label htmlFor="password-confirmation" className="block text-sm font-medium text-text-label mb-1">{t.confirmLabel}</label>
          <input
            id="password-confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder={t.confirmPlaceholder}
            className="w-full rounded border border-brand-border bg-white px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:border-primary-blue focus:outline-none focus:ring-2 focus:ring-soft-blue mb-3"
            disabled={loading}
            dir="ltr"
          />

          {error && <p className="text-xs text-emergency-red mb-3" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary-orange px-6 py-3 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60"
          >
            {loading ? t.creating : t.cta}
          </button>
        </form>

        <p className="text-xs text-center text-text-muted mt-4">
          <Link href="/auth/signin" className="font-medium text-primary-blue hover:underline">
            {t.already}
          </Link>
        </p>

        <p className="text-xs font-medium text-primary-blue mt-5 text-center">{t.trust}</p>
        <p className="text-xs text-text-muted mt-3 text-center leading-relaxed">{t.terms}</p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary-blue border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignUpInner />
    </Suspense>
  )
}

'use client'

/**
 * Inline auth-nudge banner shown AFTER navigation results load.
 * Never interrupts. Never blocks. Always dismissible.
 *
 * Variants per business rules:
 *   auth-1  — soft ask after nav #1
 *   auth-2  — warmer ask after nav #2 ("2 of 3 used")
 *   auth-3  — strongest ask after nav #3 ("last free navigation")
 */

import { NavPromptVariant } from '@/contexts/NavigationContext'
import { FREE_NAV_LIMIT } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'

const T = {
  en: {
    nav1: {
      msg: 'Sign in to save these results and revisit your doctor shortlist anytime.',
      cta: 'Sign in — it takes 10 seconds',
      dismiss: '✕',
    },
    nav2: {
      counter: `2 of ${FREE_NAV_LIMIT} free navigations used this month`,
      msg: 'Sign in to save your results and see your full navigation history.',
      cta: 'Create free account',
      dismiss: "I'll do this later",
    },
    nav3: {
      counter: `Last free navigation this month`,
      msg: 'This is your last free navigation this month. Sign in now to continue next time.',
      cta: 'Create free account',
      dismiss: "I'll do this later",
    },
  },
  ar: {
    nav1: {
      msg: 'سجّل دخولك لحفظ هذه النتائج ومراجعة قائمة أطبائك في أي وقت.',
      cta: 'تسجيل الدخول — 10 ثوانٍ فقط',
      dismiss: '✕',
    },
    nav2: {
      counter: `تم استخدام 2 من ${FREE_NAV_LIMIT} عمليات البحث المجانية هذا الشهر`,
      msg: 'سجّل دخولك لحفظ نتائجك وعرض سجل بحثك الكامل.',
      cta: 'إنشاء حساب مجاني',
      dismiss: 'سأفعل ذلك لاحقاً',
    },
    nav3: {
      counter: 'آخر بحث مجاني هذا الشهر',
      msg: 'هذا هو آخر بحث مجاني لك هذا الشهر. سجّل دخولك الآن للمتابعة في المرة القادمة.',
      cta: 'إنشاء حساب مجاني',
      dismiss: 'سأفعل ذلك لاحقاً',
    },
  },
}

interface Props {
  variant: NavPromptVariant
  onDismiss: () => void
  /** Where to redirect for sign-in (includes ?return_to) */
  signInHref: string
}

export default function AuthPromptBanner({ variant, onDismiss, signInHref }: Props) {
  const { locale } = useLocale()
  const t = T[locale]

  if (variant === 'none' || variant === 'upgrade') return null

  if (variant === 'auth-1') {
    return (
      <div
        className="rounded border border-soft-blue bg-soft-blue px-4 py-3 flex items-start justify-between gap-3"
        role="note"
      >
        <div className="min-w-0">
          <p className="text-sm text-text-primary">{t.nav1.msg}</p>
          <a
            href={signInHref}
            className="inline-block mt-2 text-xs font-semibold text-primary-blue underline underline-offset-2 hover:text-primary-blue-hover"
          >
            {t.nav1.cta}
          </a>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-text-muted hover:text-text-primary text-sm leading-none mt-0.5"
        >
          {t.nav1.dismiss}
        </button>
      </div>
    )
  }

  if (variant === 'auth-2') {
    return (
      <div
        className="rounded border-2 border-status-medium-border bg-status-medium-bg px-4 py-3 space-y-1"
        role="note"
      >
        <p className="text-xs font-semibold text-status-medium-text">{t.nav2.counter}</p>
        <p className="text-sm text-text-primary">{t.nav2.msg}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={signInHref}
            className="rounded bg-primary-orange px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-orange-hover transition-colors"
          >
            {t.nav2.cta}
          </a>
          <button
            onClick={onDismiss}
            className="text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            {t.nav2.dismiss}
          </button>
        </div>
      </div>
    )
  }

  // auth-3 — most prominent
  return (
    <div
      className="rounded border-2 border-status-high-border bg-status-high-bg px-4 py-4 space-y-1"
      role="note"
    >
      <p className="text-xs font-semibold text-status-high-text uppercase tracking-wide">
        {t.nav3.counter}
      </p>
      <p className="text-sm font-medium text-text-primary">{t.nav3.msg}</p>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <a
          href={signInHref}
          className="rounded bg-primary-orange px-5 py-2 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors"
        >
          {t.nav3.cta}
        </a>
        <button
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          {t.nav3.dismiss}
        </button>
      </div>
    </div>
  )
}

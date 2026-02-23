'use client'

/**
 * Inline auth-nudge / lapsed-premium banner shown AFTER results load.
 * Never interrupts. Never blocks. Always dismissible.
 *
 * Analytics events fired:
 *   auth_prompt_shown    — on mount for each auth variant
 *   auth_prompt_dismissed — when user dismisses
 */

import { useEffect } from 'react'
import { NavPromptVariant } from '@/contexts/NavigationContext'
import { FREE_NAV_LIMIT, UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'
import { useAnalytics } from '@/hooks/useAnalytics'

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
      counter: 'Last free navigation this month',
      msg: 'This is your last free navigation this month. Sign in now to continue next time.',
      cta: 'Create free account',
      dismiss: "I'll do this later",
    },
    lapsed: {
      msg: 'Welcome back. You had unlimited navigations and the full clinic list before — pick up where you left off.',
      cta: `Reactivate Premium — AED ${UPGRADE_PRICE_AED}/month`,
      dismiss: 'Not right now',
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
    lapsed: {
      msg: 'مرحباً بعودتك. كان لديك عمليات بحث غير محدودة والقائمة الكاملة للعيادات — تابع من حيث توقفت.',
      cta: `إعادة تفعيل Premium — ${UPGRADE_PRICE_AED} درهم/شهر`,
      dismiss: 'ليس الآن',
    },
  },
}

function promptTypeLabel(variant: NavPromptVariant): string {
  switch (variant) {
    case 'auth-1':         return 'nav1_soft'
    case 'auth-2':         return 'nav2_warm'
    case 'auth-3':         return 'nav3_last_free'
    case 'lapsed-premium': return 'lapsed_premium'
    default:               return variant
  }
}

interface Props {
  variant:      NavPromptVariant
  onDismiss:    () => void
  signInHref:   string
  /** For lapsed-premium CTA — goes straight to checkout */
  upgradeHref?: string
  navCount?:    number
}

export default function AuthPromptBanner({ variant, onDismiss, signInHref, upgradeHref, navCount }: Props) {
  const { locale } = useLocale()
  const { track }  = useAnalytics()
  const t          = T[locale]

  // Fire auth_prompt_shown once when banner mounts
  useEffect(() => {
    if (variant === 'none' || variant === 'upgrade') return
    track('auth_prompt_shown', {
      prompt_type:                    promptTypeLabel(variant),
      navigation_number_this_month:   navCount,
    })
  }, [variant]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDismiss() {
    track('auth_prompt_dismissed', {
      prompt_type:                  promptTypeLabel(variant),
      navigation_number_this_month: navCount,
    })
    onDismiss()
  }

  if (variant === 'none' || variant === 'upgrade') return null

  // ── Scenario E — lapsed premium ─────────────────────────────────────────────
  if (variant === 'lapsed-premium') {
    return (
      <div className="rounded border-2 border-primary-blue bg-soft-blue px-4 py-4 space-y-2" role="note">
        <p className="text-sm font-medium text-text-primary">{t.lapsed.msg}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={upgradeHref ?? signInHref}
            className="rounded bg-primary-orange px-5 py-2 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors"
          >
            {t.lapsed.cta}
          </a>
          <button onClick={handleDismiss} className="text-xs text-text-muted hover:text-text-primary transition-colors">
            {t.lapsed.dismiss}
          </button>
        </div>
      </div>
    )
  }

  // ── Nav #1 — soft ────────────────────────────────────────────────────────────
  if (variant === 'auth-1') {
    return (
      <div className="rounded border border-soft-blue bg-soft-blue px-4 py-3 flex items-start justify-between gap-3" role="note">
        <div className="min-w-0">
          <p className="text-sm text-text-primary">{t.nav1.msg}</p>
          <a href={signInHref} className="inline-block mt-2 text-xs font-semibold text-primary-blue underline underline-offset-2 hover:text-primary-blue-hover">
            {t.nav1.cta}
          </a>
        </div>
        <button onClick={handleDismiss} aria-label="Dismiss" className="flex-shrink-0 text-text-muted hover:text-text-primary text-sm leading-none mt-0.5">
          {t.nav1.dismiss}
        </button>
      </div>
    )
  }

  // ── Nav #2 — warmer ──────────────────────────────────────────────────────────
  if (variant === 'auth-2') {
    return (
      <div className="rounded border-2 border-status-medium-border bg-status-medium-bg px-4 py-3 space-y-1" role="note">
        <p className="text-xs font-semibold text-status-medium-text">{t.nav2.counter}</p>
        <p className="text-sm text-text-primary">{t.nav2.msg}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a href={signInHref} className="rounded bg-primary-orange px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-orange-hover transition-colors">
            {t.nav2.cta}
          </a>
          <button onClick={handleDismiss} className="text-xs text-text-muted hover:text-text-primary transition-colors">
            {t.nav2.dismiss}
          </button>
        </div>
      </div>
    )
  }

  // ── Nav #3 — strongest ───────────────────────────────────────────────────────
  return (
    <div className="rounded border-2 border-status-high-border bg-status-high-bg px-4 py-4 space-y-1" role="note">
      <p className="text-xs font-semibold text-status-high-text uppercase tracking-wide">{t.nav3.counter}</p>
      <p className="text-sm font-medium text-text-primary">{t.nav3.msg}</p>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <a href={signInHref} className="rounded bg-primary-orange px-5 py-2 text-sm font-semibold text-white hover:bg-primary-orange-hover transition-colors">
          {t.nav3.cta}
        </a>
        <button onClick={handleDismiss} className="text-xs text-text-muted hover:text-text-primary transition-colors">
          {t.nav3.dismiss}
        </button>
      </div>
    </div>
  )
}

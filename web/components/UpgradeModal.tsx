'use client'

/**
 * Upgrade modal — appears AFTER navigation #4 results load, or on "See all results" click.
 * Results remain visible but dimmed behind the modal.
 *
 * Analytics events fired:
 *   upgrade_modal_shown    — on mount
 *   upgrade_cta_clicked    — when user clicks the upgrade CTA
 *   upgrade_modal_dismissed — when user clicks "Remind me next month"
 *
 * Hard rules:
 * - Never before results load
 * - Dynamic real result count in headline
 * - One price (AED), one CTA — no comparison table
 * - "No contracts. Cancel anytime." near CTA
 * - Dismiss always clearly visible
 */

import { useEffect, useState } from 'react'
import { createCheckout } from '@/lib/api'
import { UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigation } from '@/contexts/NavigationContext'

const T = {
  en: {
    headline: (n: number) => `See all ${n} clinics that accept your insurance.`,
    body: 'You have used your 3 free navigations this month. Upgrade to see the full list — and get unlimited navigations every month.',
    benefits: [
      'Full clinic list for your insurance network',
      'Unlimited navigations',
      'Save your doctor shortlist',
      'Full navigation history',
    ],
    price: `AED ${UPGRADE_PRICE_AED} / month`,
    note: 'No contracts. Cancel anytime.',
    cta: (n: number) => `See all ${n} results — AED ${UPGRADE_PRICE_AED}/month`,
    dismiss: 'Remind me next month',
    trust: 'We never share your data with clinics.',
  },
  ar: {
    headline: (n: number) => `اعرض جميع ${n} عيادة تقبل تأمينك.`,
    body: 'لقد استخدمت عمليات البحث الثلاث المجانية هذا الشهر. قم بالترقية لعرض القائمة الكاملة والحصول على عمليات بحث غير محدودة كل شهر.',
    benefits: [
      'القائمة الكاملة للعيادات لشبكة تأمينك',
      'عمليات بحث غير محدودة',
      'حفظ قائمة أطبائك المفضلين',
      'سجل البحث الكامل',
    ],
    price: `${UPGRADE_PRICE_AED} درهم / شهرياً`,
    note: 'لا عقود. إلغاء في أي وقت.',
    cta: (n: number) => `اعرض جميع ${n} نتيجة — ${UPGRADE_PRICE_AED} درهم/شهر`,
    dismiss: 'ذكّرني الشهر القادم',
    trust: 'نحن لا نشارك بياناتك مع العيادات.',
  },
}

interface Props {
  totalResults:  number
  onDismiss:     () => void
  token:         string | null
  signInHref:    string
}

export default function UpgradeModal({ totalResults, onDismiss, token, signInHref }: Props) {
  const { locale }  = useLocale()
  const { track }   = useAnalytics()
  const { navCount } = useNavigation()
  const t           = T[locale]
  const [loading, setLoading] = useState(false)

  // Fire upgrade_modal_shown exactly once when modal mounts
  useEffect(() => {
    track('upgrade_modal_shown', {
      navigation_number_this_month: navCount,
      total_matching_results:       totalResults,
      capped_results_shown:         Math.min(totalResults, 10),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    track('upgrade_cta_clicked', {
      total_matching_results:       totalResults,
      navigation_number_this_month: navCount,
    })
    if (!token) {
      window.location.href = signInHref
      return
    }
    setLoading(true)
    track('checkout_started', { plan_type: 'premium', price_aed: UPGRADE_PRICE_AED })
    try {
      const url = await createCheckout(token)
      window.location.href = url
    } catch {
      alert('Could not open checkout — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleDismiss() {
    track('upgrade_modal_dismissed', {
      navigation_number_this_month: navCount,
      cooldown_applied:             true,
    })
    onDismiss()
  }

  const isRTL = locale === 'ar'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>

        <h2 id="upgrade-modal-title" className="text-lg font-bold text-primary-blue leading-snug">
          {t.headline(totalResults)}
        </h2>

        <p className="text-sm text-text-muted">{t.body}</p>

        <ul className="space-y-1.5">
          {t.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-primary">
              <span className="text-primary-green font-bold flex-shrink-0">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <p className="text-base font-semibold text-text-primary">{t.price}</p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded bg-primary-orange py-3 text-sm font-bold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-orange focus:ring-offset-2"
        >
          {loading ? '…' : t.cta(totalResults)}
        </button>

        <p className="text-xs text-text-muted text-center">{t.note}</p>

        <p className="text-xs text-text-muted text-center border-t border-card-border pt-2">{t.trust}</p>

        <div className="text-center">
          <button
            onClick={handleDismiss}
            className="text-xs text-text-muted hover:text-text-primary transition-colors underline underline-offset-2"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}

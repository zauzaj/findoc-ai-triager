'use client'

/**
 * Upgrade modal — appears AFTER navigation #4 results load.
 * Results remain visible but dimmed behind the modal.
 *
 * Hard rules (from product spec):
 * - Never appears before results load
 * - Shows real, dynamic total result count
 * - One price, one CTA — no comparison table
 * - "No contracts. Cancel anytime." near CTA
 * - Dismiss ("Remind me next month") always clearly visible
 * - Price always in AED as primary currency
 */

import { useState } from 'react'
import { createCheckout } from '@/lib/api'
import { UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'

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
  /** Total number of clinics that match — shown dynamically in headline */
  totalResults: number
  onDismiss: () => void
  /** JWT token — null if user is not signed in (redirect to sign-in first) */
  token: string | null
  signInHref: string
}

export default function UpgradeModal({ totalResults, onDismiss, token, signInHref }: Props) {
  const { locale } = useLocale()
  const t = T[locale]
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    if (!token) {
      // Not signed in — send to sign-in first, then checkout
      window.location.href = signInHref
      return
    }
    setLoading(true)
    try {
      const url = await createCheckout(token)
      window.location.href = url
    } catch {
      alert('Could not open checkout — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isRTL = locale === 'ar'

  return (
    // Overlay — results remain visible but dimmed behind modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Headline — dynamic result count */}
        <h2
          id="upgrade-modal-title"
          className="text-lg font-bold text-primary-blue leading-snug"
        >
          {t.headline(totalResults)}
        </h2>

        {/* Body */}
        <p className="text-sm text-text-muted">{t.body}</p>

        {/* Benefits */}
        <ul className="space-y-1.5">
          {t.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-primary">
              <span className="text-primary-green font-bold flex-shrink-0">✓</span>
              {b}
            </li>
          ))}
        </ul>

        {/* Price */}
        <p className="text-base font-semibold text-text-primary">{t.price}</p>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded bg-primary-orange py-3 text-sm font-bold text-white hover:bg-primary-orange-hover transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-orange focus:ring-offset-2"
        >
          {loading ? '…' : t.cta(totalResults)}
        </button>

        {/* Note */}
        <p className="text-xs text-text-muted text-center">{t.note}</p>

        {/* Trust signal */}
        <p className="text-xs text-text-muted text-center border-t border-card-border pt-2">
          {t.trust}
        </p>

        {/* Dismiss */}
        <div className="text-center">
          <button
            onClick={onDismiss}
            className="text-xs text-text-muted hover:text-text-primary transition-colors underline underline-offset-2"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}

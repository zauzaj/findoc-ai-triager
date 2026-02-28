'use client'

import { useEffect, useState } from 'react'
import { createCheckout } from '@/lib/api'
import { UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigation } from '@/contexts/NavigationContext'

const T = {
  en: {
    headline: (n: number) => `See all ${n} clinics that accept your insurance.`,
    body: 'You have used your 3 free navigations this month. Upgrade to unlock full clinic lists and unlimited navigations.',
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
  totalResults: number
  onDismiss: () => void
  token: string | null
  signInHref: string
}

export default function UpgradeModal({ totalResults, onDismiss, token, signInHref }: Props) {
  const { locale } = useLocale()
  const { track } = useAnalytics()
  const { navCount } = useNavigation()
  const t = T[locale]
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    track('upgrade_modal_shown', {
      navigation_number_this_month: navCount,
      total_matching_results: totalResults,
      capped_results_shown: Math.min(totalResults, 10),
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpgrade() {
    track('upgrade_cta_clicked', {
      total_matching_results: totalResults,
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
      cooldown_applied: true,
    })
    onDismiss()
  }

  const isRTL = locale === 'ar'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="upgrade-modal-title"
    >
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <h2 id="upgrade-modal-title" className="text-xl font-bold leading-snug text-slate-900">
          {t.headline(totalResults)}
        </h2>

        <p className="text-sm text-slate-600">{t.body}</p>

        <ul className="space-y-2">
          {t.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-base font-bold text-slate-900">{t.price}</p>
          <p className="mt-1 text-xs text-slate-500">{t.note}</p>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white hover:bg-slate-700 transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          {loading ? '…' : t.cta(totalResults)}
        </button>

        <p className="border-t border-slate-200 pt-3 text-center text-xs text-slate-500">{t.trust}</p>

        <div className="text-center">
          <button
            onClick={handleDismiss}
            className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-900 transition-colors"
          >
            {t.dismiss}
          </button>
        </div>
      </div>
    </div>
  )
}

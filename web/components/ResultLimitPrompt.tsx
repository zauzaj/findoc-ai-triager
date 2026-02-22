'use client'

/**
 * Shows after the 10th result when more exist.
 * Rule: only shown when total > FREE_RESULT_LIMIT (10).
 * Never fabricates numbers — always real count.
 */

import { UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'

const T = {
  en: {
    more: (n: number) => `${n} more clinic${n === 1 ? '' : 's'} accept your insurance in this area.`,
    cta: 'See all results — Upgrade to Premium',
    upgrade: (n: number) => `See all ${n} results — AED ${UPGRADE_PRICE_AED}/month`,
  },
  ar: {
    more: (n: number) => `${n} عيادة${n === 1 ? '' : ''} أخرى تقبل تأمينك في هذه المنطقة.`,
    cta: 'اعرض جميع النتائج — الترقية إلى Premium',
    upgrade: (n: number) => `اعرض جميع ${n} نتيجة — ${UPGRADE_PRICE_AED} درهم/شهر`,
  },
}

interface Props {
  hiddenCount: number
  onUpgradeClick: () => void
}

export default function ResultLimitPrompt({ hiddenCount, onUpgradeClick }: Props) {
  const { locale } = useLocale()
  const t = T[locale]

  if (hiddenCount <= 0) return null

  return (
    <div
      className="rounded border-2 border-primary-orange bg-white px-5 py-4 text-center space-y-2"
      aria-label="More results available"
    >
      <p className="text-sm font-semibold text-text-primary">{t.more(hiddenCount)}</p>
      <button
        onClick={onUpgradeClick}
        className="rounded bg-primary-orange px-5 py-2 text-sm font-bold text-white hover:bg-primary-orange-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-orange focus:ring-offset-2"
      >
        {t.upgrade(hiddenCount)}
      </button>
    </div>
  )
}

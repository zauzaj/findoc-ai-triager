'use client'

/**
 * Shows after the 10th result when more exist.
 * Rule: only shown when total > FREE_RESULT_LIMIT (10). Never fabricates numbers.
 *
 * Analytics events fired:
 *   result_cap_shown       — on mount
 *   see_all_results_clicked — when user clicks the upgrade CTA
 */

import { useEffect } from 'react'
import { UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigation } from '@/contexts/NavigationContext'

const T = {
  en: {
    more:    (n: number) => `${n} more clinic${n === 1 ? '' : 's'} accept your insurance in this area.`,
    upgrade: (n: number) => `See all ${n} results — AED ${UPGRADE_PRICE_AED}/month`,
  },
  ar: {
    more:    (n: number) => `${n} عيادة أخرى تقبل تأمينك في هذه المنطقة.`,
    upgrade: (n: number) => `اعرض جميع ${n} نتيجة — ${UPGRADE_PRICE_AED} درهم/شهر`,
  },
}

interface Props {
  hiddenCount:     number
  totalCount:      number
  onUpgradeClick:  () => void
}

export default function ResultLimitPrompt({ hiddenCount, totalCount, onUpgradeClick }: Props) {
  const { locale }   = useLocale()
  const { track }    = useAnalytics()
  const { navCount } = useNavigation()
  const t            = T[locale]

  // Fire result_cap_shown once on mount
  useEffect(() => {
    if (hiddenCount <= 0) return
    track('result_cap_shown', {
      total_matching_results:       totalCount,
      capped_at:                    10,
      navigation_number_this_month: navCount,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (hiddenCount <= 0) return null

  function handleClick() {
    track('see_all_results_clicked', {
      total_matching_results:       totalCount,
      navigation_number_this_month: navCount,
    })
    onUpgradeClick()
  }

  return (
    <div
      className="rounded border-2 border-primary-orange bg-white px-5 py-4 text-center space-y-2"
      aria-label="More results available"
    >
      <p className="text-sm font-semibold text-text-primary">{t.more(hiddenCount)}</p>
      <button
        onClick={handleClick}
        className="rounded bg-primary-orange px-5 py-2 text-sm font-bold text-white hover:bg-primary-orange-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-orange focus:ring-offset-2"
      >
        {t.upgrade(totalCount)}
      </button>
    </div>
  )
}

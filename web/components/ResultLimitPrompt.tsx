'use client'

import { useEffect } from 'react'
import { UPGRADE_PRICE_AED } from '@/lib/constants'
import { useLocale } from '@/hooks/useLocale'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigation } from '@/contexts/NavigationContext'

const T = {
  en: {
    more:    (n: number) => `${n} more clinic${n === 1 ? '' : 's'} match your search.`,
    upgrade: (n: number) => `See all ${n} results — AED ${UPGRADE_PRICE_AED}/month`,
  },
  ar: {
    more:    (n: number) => `${n} عيادة أخرى تطابق بحثك.`,
    upgrade: (n: number) => `اعرض جميع ${n} نتيجة — ${UPGRADE_PRICE_AED} درهم/شهر`,
  },
}

interface Props {
  hiddenCount:     number
  totalCount:      number
  onUpgradeClick:  () => void
}

export default function ResultLimitPrompt({ hiddenCount, totalCount, onUpgradeClick }: Props) {
  const { locale } = useLocale()
  const { track } = useAnalytics()
  const { navCount } = useNavigation()
  const t = T[locale]

  useEffect(() => {
    if (hiddenCount <= 0) return
    track('result_cap_shown', {
      total_matching_results: totalCount,
      capped_at: 10,
      navigation_number_this_month: navCount,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (hiddenCount <= 0) return null

  function handleClick() {
    track('see_all_results_clicked', {
      total_matching_results: totalCount,
      navigation_number_this_month: navCount,
    })
    onUpgradeClick()
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm" aria-label="More results available">
      <p className="text-sm font-semibold text-slate-800">{t.more(hiddenCount)}</p>
      <button
        onClick={handleClick}
        className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        {t.upgrade(totalCount)}
      </button>
    </div>
  )
}

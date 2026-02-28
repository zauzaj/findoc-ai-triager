import type { Metadata } from 'next'
import Link from 'next/link'
import ResultsClient from './ResultsClient'
import { SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Clinic Results',
  description: 'Clinics matching your specialist and insurance in the UAE.',
  alternates: {
    canonical: `${SITE_URL}/results`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

interface ResultsPageProps {
  searchParams: {
    specialist?: string
    lat?: string
    lng?: string
    insurance?: string
    urgency?: string
    nav_count?: string
  }
}

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const { specialist = '', lat, lng, insurance, urgency, nav_count } = searchParams

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <Link
          href="/navigate"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Back to specialist guidance"
        >
          &larr; Back to guidance
        </Link>

        <div className="mt-3">
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {specialist ? `${specialist} clinics` : 'Clinics near you'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {insurance
              ? `Filtered by ${insurance} insurance`
              : 'Smart matches based on your symptoms and location.'}
          </p>
        </div>
      </div>

      <ResultsClient
        specialist={specialist}
        lat={lat}
        lng={lng}
        insurance={insurance}
        urgency={urgency}
        serverNavCount={nav_count ? parseInt(nav_count, 10) : undefined}
      />
    </div>
  )
}

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
  }
}

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const { specialist = '', lat, lng, insurance, urgency } = searchParams

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link
          href="/navigate"
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
          aria-label="Back to specialist guidance"
        >
          &larr; Back to guidance
        </Link>

        <div className="mt-3">
          <h1 className="text-2xl font-semibold text-text-primary mb-1">
            {specialist ? `${specialist} clinics` : 'Clinics near you'}
          </h1>
          {insurance && (
            <p className="text-sm text-text-muted">Filtered by {insurance} insurance</p>
          )}
        </div>
      </div>

      <ResultsClient
        specialist={specialist}
        lat={lat}
        lng={lng}
        insurance={insurance}
        urgency={urgency}
      />
    </div>
  )
}

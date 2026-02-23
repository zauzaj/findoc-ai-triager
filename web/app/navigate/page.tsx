import type { Metadata } from 'next'
import Link from 'next/link'
import NavigateClient from './NavigateClient'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Specialist Guidance',
  description: 'Your personalised specialist recommendation based on your symptoms.',
  alternates: {
    canonical: `${SITE_URL}/navigate`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

interface NavigatePageProps {
  searchParams: {
    symptoms?: string
    insurance?: string
  }
}

export default function NavigatePage({ searchParams }: NavigatePageProps) {
  const symptoms = searchParams.symptoms ?? ''
  const insurance = searchParams.insurance ?? ''

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
          aria-label="Back to home"
        >
          &larr; Back
        </Link>
        <h1 className="text-2xl font-semibold text-text-primary mt-3 mb-1">
          Your specialist guidance
        </h1>
        {symptoms && (
          <p className="text-sm text-text-muted">
            Based on: <em>&ldquo;{symptoms}&rdquo;</em>
          </p>
        )}
      </div>

      <NavigateClient symptoms={symptoms} initialInsurance={insurance} />
    </div>
  )
}

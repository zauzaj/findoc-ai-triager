import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL, INSURERS } from '@/lib/constants'

interface InsurancePageProps {
  params: {
    provider: string
  }
}

function formatProvider(provider: string): string {
  return decodeURIComponent(provider)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: InsurancePageProps): Promise<Metadata> {
  const provider = formatProvider(params.provider)

  return {
    title: `${provider} Insurance Doctors in UAE`,
    description: `Find doctors and clinics in the UAE that accept ${provider} health insurance. Independent navigation by ${SITE_NAME}.`,
    alternates: {
      canonical: `${SITE_URL}/insurance/${params.provider}`,
    },
  }
}

export default function InsurancePage({ params }: InsurancePageProps) {
  const provider = formatProvider(params.provider)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary mb-3 text-balance">
          {provider} insurance — find doctors in the UAE
        </h1>
        <p className="text-text-muted text-base">
          Describe your symptoms and we&apos;ll find clinics that accept your {provider}{' '}
          insurance.
        </p>
      </header>

      <div className="bg-white rounded border border-gray-100 p-6 mb-6">
        <p className="text-sm text-text-muted mb-4">
          Start by describing your symptoms. We&apos;ll recommend a specialist and filter
          clinics to those that accept {provider}.
        </p>
        <Link
          href={`/?insurance=${encodeURIComponent(provider)}`}
          className="inline-flex items-center rounded bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transition-colors"
        >
          Start with {provider}
        </Link>
      </div>

      <div className="bg-soft-green rounded border border-green-200 p-4">
        <p className="text-xs text-text-muted leading-relaxed">
          Findoc works with all major UAE insurance providers including{' '}
          {INSURERS.join(', ')}.
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${provider} Insurance Doctors in UAE`,
            description: `Find doctors and clinics in the UAE that accept ${provider} health insurance.`,
            url: `${SITE_URL}/insurance/${params.provider}`,
            publisher: {
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
            },
          }),
        }}
      />
    </div>
  )
}

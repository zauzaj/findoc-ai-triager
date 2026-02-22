import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

interface DoctorsPageProps {
  params: {
    specialty: string
    area: string
  }
}

function formatParam(param: string): string {
  return decodeURIComponent(param)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: DoctorsPageProps): Promise<Metadata> {
  const specialty = formatParam(params.specialty)
  const area = formatParam(params.area)

  return {
    title: `${specialty} in ${area}`,
    description: `Find ${specialty} doctors and clinics in ${area}, UAE. Independent health navigation by ${SITE_NAME}.`,
    alternates: {
      canonical: `${SITE_URL}/doctors/${params.specialty}/${params.area}`,
    },
  }
}

export default function DoctorsPage({ params }: DoctorsPageProps) {
  const specialty = formatParam(params.specialty)
  const area = formatParam(params.area)

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
          {specialty} in {area}
        </h1>
        <p className="text-text-muted text-base">
          Find the right {specialty.toLowerCase()} clinic in {area}, UAE.
        </p>
      </header>

      <div className="bg-white rounded border border-card-border p-6 mb-6">
        <p className="text-sm text-text-muted mb-4">
          Describe your symptoms and we&apos;ll confirm whether a {specialty.toLowerCase()} is
          right for you, then show you clinics near {area}.
        </p>
        <Link
          href={`/?specialist=${encodeURIComponent(params.specialty)}`}
          className="inline-flex items-center rounded bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue-hover focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transition-colors"
        >
          Get guidance
        </Link>
      </div>

      <div className="bg-soft-blue rounded border border-soft-blue p-4">
        <p className="text-xs text-text-muted leading-relaxed">
          Clinic listings for this page are being prepared. In the meantime, describe your
          symptoms on our home page for personalised guidance.
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: `${specialty} in ${area}`,
            description: `Find ${specialty} doctors and clinics in ${area}, UAE.`,
            url: `${SITE_URL}/doctors/${params.specialty}/${params.area}`,
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

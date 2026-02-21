import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'For Clinics',
  description: `Partner with ${SITE_NAME} to reach patients who need your specialist services in the UAE.`,
  alternates: {
    canonical: `${SITE_URL}/for-clinics`,
  },
}

export default function ForClinicsPage() {
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

      <header className="mb-10">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          For clinics &amp; healthcare providers
        </p>
        <h1 className="text-3xl font-semibold text-text-primary mb-4 text-balance">
          Reach patients who are looking for your specialty
        </h1>
        <p className="text-text-muted text-base leading-relaxed">
          {SITE_NAME} is an independent health navigation platform for people in the UAE who
          are unsure which specialist to see. We route patients to the right type of provider
          based on their symptoms — not advertisements.
        </p>
      </header>

      <div className="space-y-4 mb-10">
        <div className="bg-white rounded border border-gray-100 p-5">
          <h2 className="font-semibold text-text-primary mb-2">Intent-matched patients</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Every patient we route has an active health concern. They are already looking for
            the type of clinic you operate — not browsing.
          </p>
        </div>

        <div className="bg-white rounded border border-gray-100 p-5">
          <h2 className="font-semibold text-text-primary mb-2">
            Insurance-filtered referrals
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Patients filter by their insurance provider. Clinics that accept their plan appear
            first, reducing friction and wasted enquiries.
          </p>
        </div>

        <div className="bg-white rounded border border-gray-100 p-5">
          <h2 className="font-semibold text-text-primary mb-2">Transparent lead tracking</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            We track calls, direction requests, and website visits so you can measure the value
            of your listing accurately.
          </p>
        </div>
      </div>

      <div className="bg-soft-blue rounded border border-blue-100 p-6">
        <h2 className="font-semibold text-text-primary mb-2">Interested in listing?</h2>
        <p className="text-sm text-text-muted mb-4">
          We are currently onboarding clinics in Dubai, Abu Dhabi, and Sharjah. Get in touch
          to learn about our listing criteria and pricing.
        </p>
        <p className="text-sm font-medium text-primary-blue">
          partnerships@findoc.ae
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `For Clinics | ${SITE_NAME}`,
            description: `Partner with ${SITE_NAME} to reach patients in the UAE.`,
            url: `${SITE_URL}/for-clinics`,
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

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

const listingPlans = [
  {
    name: 'Starter Listing',
    price: 'AED 499 / month',
    description: 'Ideal for clinics getting started with qualified patient demand.',
    features: [
      'Verified clinic profile',
      'Specialty + insurance visibility',
      'Basic lead tracking (calls + website)',
    ],
  },
  {
    name: 'Growth Listing',
    price: 'AED 999 / month',
    description: 'For clinics that want stronger discoverability and lead quality signals.',
    features: [
      'Everything in Starter',
      'Priority placement in relevant searches',
      'Expanded analytics dashboard',
    ],
    featured: true,
  },
  {
    name: 'Multi-Branch',
    price: 'Custom pricing',
    description: 'Best for groups with multiple branches across Emirates.',
    features: [
      'Multi-location onboarding',
      'Centralized reporting',
      'Dedicated success support',
    ],
  },
]

export default function ForClinicsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      <header className="mb-10 rounded-3xl border border-white/60 bg-white/85 p-7 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <p className="mb-3 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
          For clinics &amp; healthcare providers
        </p>
        <h1 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-5xl text-balance">
          Reach patients actively searching for your specialty.
        </h1>
        <p className="max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
          {SITE_NAME} helps patients in the UAE find the right clinic based on symptoms,
          specialty needs, and insurance compatibility — not paid ads.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Why clinics list with us</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Intent-matched patients</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Patients arrive with active symptoms and specialist intent, resulting in higher quality enquiries.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Insurance-aware discovery</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Your listing is shown when coverage matches, reducing back-and-forth and improving booking conversion.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Transparent lead analytics</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Track calls, website clicks, and direction requests to measure listing performance with confidence.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900">Listing & pricing</h2>
          <p className="text-xs text-slate-500">All plans billed monthly. No long-term contracts.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {listingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-2xl border p-5 shadow-sm ${
                plan.featured
                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'border-slate-200 bg-white text-slate-900'
              }`}
            >
              {plan.featured && (
                <p className="mb-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </p>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className={`mt-1 text-sm ${plan.featured ? 'text-slate-200' : 'text-slate-500'}`}>
                {plan.description}
              </p>
              <p className="mt-4 text-xl font-extrabold">{plan.price}</p>
              <ul className={`mt-4 space-y-2 text-sm ${plan.featured ? 'text-slate-100' : 'text-slate-600'}`}>
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/80 p-6">
        <h2 className="mb-2 text-lg font-bold text-slate-900">Interested in listing?</h2>
        <p className="mb-4 text-sm text-slate-600">
          We&apos;re currently onboarding clinics in Dubai, Abu Dhabi, and Sharjah. Share your
          specialties and branches, and we&apos;ll recommend the best plan.
        </p>
        <p className="text-sm font-semibold text-sky-800">partnerships@findoc.ae</p>
      </section>

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

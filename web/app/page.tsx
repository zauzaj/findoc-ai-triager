import type { Metadata } from 'next'
import SymptomInput from '@/components/SymptomInput'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: `${SITE_NAME} — Not sure which doctor to see in the UAE?`,
  description:
    'Describe your symptoms and get independent guidance on which specialist to see in the UAE. Filter by insurance provider.',
  alternates: {
    canonical: SITE_URL,
  },
}

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <section className="rounded-3xl border border-white/60 bg-white/85 p-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
          <p className="mb-4 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            AI-powered clinic triage
          </p>
          <h1 className="mb-4 text-3xl font-extrabold leading-tight text-slate-900 sm:text-5xl text-balance">
            Find the right specialist faster.
          </h1>
          <p className="mb-8 max-w-xl text-base text-slate-600 sm:text-lg">
            Describe your symptoms in plain language. We&apos;ll guide you to the right specialty and
            help you filter by accepted insurance in the UAE.
          </p>
          <SymptomInput />
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">What you get</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Clear specialist recommendation</li>
              <li>• Insurance-aware clinic matching</li>
              <li>• Neutral, independent guidance</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-xs leading-relaxed text-amber-900">
              <strong>Not medical advice:</strong> Findoc UAE provides navigation support only. In
              emergencies, call <strong>998</strong>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

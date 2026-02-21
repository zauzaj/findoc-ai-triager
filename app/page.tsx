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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary leading-tight mb-4 text-balance">
          Not sure which doctor to see in the UAE?
        </h1>
        <p className="text-text-muted text-base">
          Independent health navigation platform. Describe your symptoms and we&apos;ll guide you
          to the right specialist.
        </p>
      </div>

      <div className="bg-white rounded border border-gray-100 p-6 sm:p-8">
        <SymptomInput />
      </div>

      <div className="mt-8 p-4 bg-soft-blue rounded border border-blue-100">
        <p className="text-xs text-text-muted leading-relaxed">
          <strong className="text-text-primary">Independent guidance only.</strong> Findoc UAE
          does not provide medical diagnoses. Always consult a licensed healthcare professional.
          In an emergency, call <strong>998</strong>.
        </p>
      </div>
    </div>
  )
}

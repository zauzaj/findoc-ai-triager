import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

interface BlogPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const title = params.slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return {
    title: `${title} | Blog`,
    description: `Health navigation guidance for the UAE: ${title}.`,
    alternates: {
      canonical: `${SITE_URL}/blog/${params.slug}`,
    },
  }
}

export default function BlogPage({ params }: BlogPageProps) {
  const title = params.slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      <article className="rounded-3xl border border-white/70 bg-white/90 p-7 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
        <header className="mb-8 border-b border-slate-200 pb-6">
          <p className="mb-3 inline-flex rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
            {SITE_NAME} Blog
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl text-balance">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">Practical health navigation guides for UAE residents.</p>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <strong className="text-slate-900">Coming soon.</strong> We&apos;re preparing practical
          health navigation guides to help people in the UAE choose the right specialist and next
          step faster.
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-base font-bold text-slate-900">Start navigating your health today</h2>
          <p className="mb-4 text-sm text-slate-600">Tell us your symptoms and get specialist guidance in minutes.</p>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors"
          >
            Find a specialist
          </Link>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
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

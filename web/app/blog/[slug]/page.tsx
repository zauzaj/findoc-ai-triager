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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>

      <article>
        <header className="mb-8">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            {SITE_NAME} Blog
          </p>
          <h1 className="text-3xl font-semibold text-text-primary mb-4 text-balance">
            {title}
          </h1>
        </header>

        <div className="bg-soft-blue rounded border border-blue-100 p-5 text-sm text-text-muted">
          <strong className="text-text-primary">Coming soon.</strong> We&apos;re preparing
          practical health navigation guides for people living and working in the UAE. Check back
          soon.
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Start navigating your health today
          </h2>
          <Link
            href="/"
            className="inline-flex items-center rounded bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:ring-offset-2 transition-colors"
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

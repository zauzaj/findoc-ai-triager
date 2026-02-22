import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

export default function Navbar() {
  return (
    <header className="bg-primary-blue sticky top-0 z-50">
      <nav
        className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="font-semibold text-white text-lg tracking-tight hover:text-white/80 transition-colors"
          aria-label={`${SITE_NAME} home`}
        >
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-6 text-sm text-white/80">
          <Link
            href="/for-clinics"
            className="hover:text-white transition-colors"
          >
            For Clinics
          </Link>
          <Link
            href="/blog/health-navigation-uae"
            className="hover:text-white transition-colors"
          >
            Blog
          </Link>
        </div>
      </nav>
    </header>
  )
}

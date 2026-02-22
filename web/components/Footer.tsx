import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="bg-dark-charcoal mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="font-semibold text-white text-sm">{SITE_NAME}</p>
            <p className="text-xs text-white/60 mt-1">
              Independent health navigation for the UAE
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/60">
              <li>
                <Link href="/for-clinics" className="hover:text-white transition-colors">
                  For Clinics
                </Link>
              </li>
              <li>
                <Link href="/blog/health-navigation-uae" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} {SITE_NAME}. This platform provides independent
            health navigation guidance and does not constitute medical advice. Always consult a
            qualified healthcare professional.
          </p>
        </div>
      </div>
    </footer>
  )
}

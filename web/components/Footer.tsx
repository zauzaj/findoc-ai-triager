import Link from 'next/link'
import { SITE_NAME } from '@/lib/constants'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-slate-900">{SITE_NAME}</p>
            <p className="mt-1 text-xs text-slate-500">Independent health navigation for the UAE</p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
              <li>
                <Link href="/for-clinics" className="hover:text-slate-900 transition-colors">
                  For Clinics
                </Link>
              </li>
              <li>
                <Link href="/blog/health-navigation-uae" className="hover:text-slate-900 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {SITE_NAME}. This platform provides independent
            health navigation guidance and does not constitute medical advice. Always consult a
            qualified healthcare professional.
          </p>
        </div>
      </div>
    </footer>
  )
}

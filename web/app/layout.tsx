import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { SITE_NAME } from '@/lib/constants'

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: 'Find the right specialist clinic in the UAE.',
  manifest: '/manifest.json',
  icons: {
    icon:  [{ url: '/icons/icon-192.png', sizes: '192x192' }],
    apple: [{ url: '/icons/icon-192.png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#0c84a3',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-background font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}

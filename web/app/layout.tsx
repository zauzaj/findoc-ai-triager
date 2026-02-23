import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { NavigationProvider } from '@/contexts/NavigationContext'
import { SITE_NAME } from '@/lib/constants'
import InstallPrompt from '@/components/InstallPrompt'
import ClientInstrumentation from '@/components/ClientInstrumentation'

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: 'Find the right specialist clinic in the UAE.',
  manifest: '/manifest.json',
  icons: {
    icon:       [
      { url: '/icons/favicon-32.png', sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-192.png',   sizes: '192x192', type: 'image/png' },
    ],
    apple:      [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut:   '/icons/favicon-32.png',
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
}

export const viewport: Viewport = {
  themeColor: '#00a9b7',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-background font-sans">
        <AuthProvider>
          <NavigationProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <InstallPrompt />
            <ClientInstrumentation />
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

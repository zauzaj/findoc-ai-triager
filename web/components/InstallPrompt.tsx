'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'findoc_pwa_install_dismissed'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed or already running as installed PWA
    if (
      localStorage.getItem(DISMISSED_KEY) ||
      window.matchMedia('(display-mode: standalone)').matches
    ) return

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visible) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Install Findoc app"
      className="fixed bottom-0 inset-x-0 z-50 p-4 safe-bottom"
    >
      <div className="max-w-sm mx-auto bg-white rounded border-2 border-primary-blue shadow-card flex items-start gap-3 p-4">
        {/* Icon */}
        <img
          src="/icons/icon-192.png"
          alt="Findoc icon"
          width={44}
          height={44}
          className="rounded-lg flex-shrink-0"
        />

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-tight">Add Findoc to your home screen</p>
          <p className="text-xs text-text-muted mt-0.5">Get instant access without opening a browser</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="rounded bg-primary-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-orange-hover transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-text-muted hover:text-text-primary transition-colors text-center"
            aria-label="Dismiss install prompt"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}

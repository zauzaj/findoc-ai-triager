import { captureError } from './lib/error-tracking'

export function initClientErrorTracking() {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    captureError(event.error || event.message, { source: 'window.error' })
  })

  window.addEventListener('unhandledrejection', (event) => {
    captureError(event.reason, { source: 'window.unhandledrejection' })
  })
}

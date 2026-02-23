import { captureError } from './lib/error-tracking'

export function initEdgeErrorTracking() {
  self.addEventListener('error', (event: ErrorEvent) => {
    captureError(event.error || event.message, { source: 'edge.error' })
  })
}

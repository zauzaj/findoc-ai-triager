import { captureError } from './lib/error-tracking'

export function initServerErrorTracking() {
  process.on('unhandledRejection', (reason) => {
    captureError(reason, { source: 'process.unhandledRejection' })
  })

  process.on('uncaughtException', (error) => {
    captureError(error, { source: 'process.uncaughtException' })
  })
}

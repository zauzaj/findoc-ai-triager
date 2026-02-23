import { logEvent } from './observability'

async function sendToSentry(payload: Record<string, unknown>) {
  const endpoint = process.env.NEXT_PUBLIC_SENTRY_TUNNEL_ENDPOINT || process.env.SENTRY_TUNNEL_ENDPOINT
  if (!endpoint) return

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // never throw from telemetry path
  }
}

export function captureError(error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? error : new Error(String(error))
  const payload = {
    service: 'findoc-web',
    event: 'error.captured',
    message: err.message,
    stack: err.stack,
    context,
    timestamp: new Date().toISOString(),
  }

  logEvent('error.captured', { message: err.message, ...context }, 'error')
  void sendToSentry(payload)
}

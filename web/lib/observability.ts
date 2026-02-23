export type ObsLevel = 'info' | 'warn' | 'error'

const base = {
  service: 'findoc-web',
  env: process.env.NODE_ENV,
}

export function logEvent(event: string, fields: Record<string, unknown> = {}, level: ObsLevel = 'info') {
  const payload = {
    ...base,
    event,
    timestamp: new Date().toISOString(),
    ...fields,
  }

  const line = JSON.stringify(payload)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}

export function metricCounter(name: string, value = 1, tags: Record<string, unknown> = {}) {
  logEvent('metric.counter', { metric: name, value, tags })
}

export function metricTiming(name: string, durationMs: number, tags: Record<string, unknown> = {}) {
  logEvent('metric.timing', { metric: name, duration_ms: Number(durationMs.toFixed(1)), tags })
}

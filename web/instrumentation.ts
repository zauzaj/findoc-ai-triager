export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initServerErrorTracking } = await import('./sentry.server.config')
    initServerErrorTracking()
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initEdgeErrorTracking } = await import('./sentry.edge.config')
    initEdgeErrorTracking()
  }
}

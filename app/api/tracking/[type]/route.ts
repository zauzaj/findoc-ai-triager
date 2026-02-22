import { NextResponse } from 'next/server'

// Tracking stub — events are accepted and silently dropped for now.
// Wire up to analytics (PostHog, Mixpanel, etc.) when needed.
export async function POST() {
  return NextResponse.json({ ok: true })
}

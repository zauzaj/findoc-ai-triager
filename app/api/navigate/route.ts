import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { NavigateResponse } from '@/lib/api'

const UPSTREAM = process.env.EXTERNAL_API_URL ?? ''
const CACHE_TTL_HOURS = 24

export async function POST(req: NextRequest) {
  const { symptoms, insurance } = await req.json()

  if (!symptoms) {
    return NextResponse.json({ error: 'symptoms is required' }, { status: 400 })
  }

  // Deterministic key: identical symptom strings + insurance hit the same cache slot.
  const key = `${symptoms.toLowerCase().trim()}::${insurance ?? ''}`

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cached = await prisma.navigateCache.findUnique({ where: { cacheKey: key } })
  if (cached && cached.expiresAt > new Date()) {
    return NextResponse.json(JSON.parse(cached.result))
  }

  // ── Cache miss → upstream Claude triage ───────────────────────────────────
  const res = await fetch(`${UPSTREAM}/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, insurance }),
  })

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Upstream navigate API failed' },
      { status: 502 }
    )
  }

  const result: NavigateResponse = await res.json()

  // ── Write cache ────────────────────────────────────────────────────────────
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS)

  await prisma.navigateCache.upsert({
    where: { cacheKey: key },
    create: { cacheKey: key, result: JSON.stringify(result), expiresAt },
    update: { result: JSON.stringify(result), expiresAt },
  })

  return NextResponse.json(result)
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Place } from '@/lib/api'

const UPSTREAM = process.env.EXTERNAL_API_URL ?? ''
const CACHE_TTL_DAYS = 7

// Cache key at ~1 km resolution (2 decimal places ≈ 1.1 km).
// Insurance is intentionally excluded — we filter client-side so the same
// geographic result set covers all insurance variants.
function cacheKey(specialist: string, lat?: string, lng?: string): string {
  const latR = lat ? parseFloat(lat).toFixed(2) : 'x'
  const lngR = lng ? parseFloat(lng).toFixed(2) : 'x'
  return `${specialist.toLowerCase().trim()}:${latR}:${lngR}`
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const specialist = sp.get('specialist') ?? ''
  const lat = sp.get('lat') ?? undefined
  const lng = sp.get('lng') ?? undefined
  const insurance = sp.get('insurance') ?? undefined

  const key = cacheKey(specialist, lat, lng)

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cached = await prisma.placesCache.findUnique({ where: { cacheKey: key } })
  if (cached && cached.expiresAt > new Date()) {
    return NextResponse.json(JSON.parse(cached.results))
  }

  // ── Cache miss → upstream ──────────────────────────────────────────────────
  const query = new URLSearchParams({ specialist })
  if (lat) query.set('lat', lat)
  if (lng) query.set('lng', lng)
  if (insurance) query.set('insurance', insurance)

  const res = await fetch(`${UPSTREAM}/places/search?${query}`)
  if (!res.ok) {
    return NextResponse.json(
      { error: 'Upstream places API failed' },
      { status: 502 }
    )
  }

  const places: Place[] = await res.json()

  // ── Persist clinics with coordinates ───────────────────────────────────────
  await Promise.allSettled(
    places
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) =>
        prisma.clinic.upsert({
          where: { id: p.place_id ?? p.id },
          create: {
            id: p.place_id ?? p.id,
            name: p.name,
            address: p.address,
            lat: p.lat!,
            lng: p.lng!,
            phone: p.phone ?? null,
            website: p.website ?? null,
            rating: p.rating > 0 ? p.rating : null,
            insurance: JSON.stringify(p.insurance_accepted),
          },
          update: {
            name: p.name,
            address: p.address,
            lat: p.lat!,
            lng: p.lng!,
            phone: p.phone ?? null,
            website: p.website ?? null,
            rating: p.rating > 0 ? p.rating : null,
            insurance: JSON.stringify(p.insurance_accepted),
          },
        })
      )
  )

  // ── Write cache ────────────────────────────────────────────────────────────
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS)

  await prisma.placesCache.upsert({
    where: { cacheKey: key },
    create: { cacheKey: key, results: JSON.stringify(places), expiresAt },
    update: { results: JSON.stringify(places), expiresAt },
  })

  return NextResponse.json(places)
}

# Findoc UAE V2 — Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser / PWA                          │
│              Next.js 14 App Router (port 3000)              │
│   Landing → Navigate → Results → Profile → History/Saved   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS  (JWT in Authorization header)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Rails 7.2 API-only (port 3001)                 │
│                                                             │
│  /api/v1/auth/*          JWT auth (Google/Apple/magic link) │
│  /api/v1/navigate        Claude triage + session persist    │
│  /api/v1/places/search   Google Places + Redis 12h cache    │
│  /api/v1/tracking/*      Lead event attribution             │
│  /api/v1/saved_places    Favourites                         │
└──────┬───────────────────────────┬──────────────────────────┘
       │                           │
       ▼                           ▼
┌─────────────┐          ┌──────────────────┐
│  PostgreSQL │          │      Redis        │
│  (Heroku    │          │  (Heroku Redis)   │
│   Postgres) │          │  places: 12h TTL  │
│             │          │  navigate: 24h TTL│
└─────────────┘          └──────────────────┘
       │
       ▼ (external)
┌─────────────────────────────────────────────────────────────┐
│  Anthropic Claude API  │  Google Places API (New)           │
│  claude-sonnet-4-6     │  Text Search + Place Details       │
└─────────────────────────────────────────────────────────────┘
```

## Caching Strategy

| Cache Key Pattern                                      | TTL  | Store  |
|--------------------------------------------------------|------|--------|
| `places_search:v1:{specialty}:{lat2dp}:{lng2dp}:{ins}` | 12h  | Redis  |
| `place_details:v1:{place_id}`                          | 7d   | Redis  |
| `navigate:v1:{md5(symptoms::insurance)}`               | 24h  | Redis  |

## Auth Flow

```
Magic Link:
  POST /auth/magic_link → stores token (1h TTL) → email sent
  GET  /auth/magic_link_verify?token= → JWT returned

Google:
  Client obtains Google ID token → POST /auth/google → JWT returned
```

## Data Model Summary

| Table                  | Purpose                                      |
|------------------------|----------------------------------------------|
| users                  | Auth, plan, locale, insurance preference     |
| navigation_sessions    | AI triage history, messages JSONB            |
| insurance_providers    | Reference data (Daman, AXA, Bupa …)         |
| clinic_insurance_links | Crowdsourced clinic ↔ insurance mappings     |
| lead_events            | Click attribution (phone/directions/website) |
| clinics                | Canonical place_id overlay (claim + billing) |
| clinic_specialties     | Deterministic many-to-many specialty mapping |
| clinic_leads_monthly   | Aggregated analytics per clinic per month    |
| saved_places           | User favourites (Google place_id)            |

## Technology Choices

| Concern        | Choice                     | Rationale                                         |
|----------------|----------------------------|---------------------------------------------------|
| API            | Rails 7.2 API-only         | Rapid CRUD, mature ecosystem, Heroku native       |
| Web            | Next.js 14 App Router      | SSR/SSG, PWA, React ecosystem                     |
| Database       | PostgreSQL (Heroku)        | JSONB for messages, full-text, reliable           |
| Cache          | Redis (Heroku Redis)       | Sub-ms lookups, saves Places + Claude API costs   |
| AI             | Claude Sonnet              | Best medical navigation accuracy                  |
| Maps           | Google Places (New)        | UAE coverage, required Google attribution         |
| Auth           | JWT (HS256, 30d)           | Stateless, works across web + future mobile       |
| Payments (TBD) | Lemon Squeezy              | Simple SaaS billing for clinic portal             |

## API Request Throttling

High-risk public endpoints are protected with a Rack middleware throttle backed by Redis (`REDIS_URL`) so limits are shared across API instances.

| Route | Limit | Keying strategy | Rationale |
|---|---:|---|---|
| `POST /api/v1/auth/magic_link` | 5 req/min | per-IP **and** per-`X-Anonymous-Id` | Reduces email abuse and credential stuffing attempts. |
| `POST /api/v1/navigate` | 30 req/min | per-IP **and** per-`X-Anonymous-Id` | Protects expensive AI inference path from burst abuse. |
| `GET /api/v1/places/search` | 60 req/min | per-IP **and** per-`X-Anonymous-Id` | Caps scraping and protects Places quota while allowing normal browsing. |
| `POST /api/v1/tracking/*` | 120 req/min | per-IP **and** per-`X-Anonymous-Id` | Limits spam/fraud event injection without hurting normal click telemetry. |

When throttled, the API returns HTTP `429` with the standard error envelope:
`{ "error": "Too Many Requests", "message": "Rate limit exceeded" }`.

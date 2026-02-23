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

## Observability Baseline

### Error Tracking
- Rails API initializes Sentry in `api/config/initializers/sentry.rb` when `SENTRY_DSN` is present.
- Next.js web initializes runtime error tracking through `web/instrumentation.ts` and `web/sentry.*.config.ts`.
- Both API and web emit structured `error.captured` events with stable fields: `service`, `env`, `event`, `timestamp`, and flow-specific context.

### Structured Logging (critical flows)
- **Auth success/failure**: `auth.success`, `auth.failure`.
- **Navigate success/failure + latency**: `navigate.success`, `navigate.failure`, plus `navigate.provider.latency` timer.
- **Places cache behavior**: `places_search.cache` (hit/miss), `places_search.success/failure`.
- **Billing webhook processing**: `billing_webhook.processed` with `result` (`success`, `invalid_json`, `failure`).

### Counters/Timers
- Request envelope:
  - `api.request.rate` counter
  - `api.request.error_rate` counter (`status >= 500`)
  - `api.request.latency` timer (p95 computed in APM/metrics backend)
- Redis cache hit ratio:
  - `redis.cache.hit`, `redis.cache.miss` (derive hit ratio = hit / (hit + miss))
- External API failures:
  - `external_api.failure` tagged for `provider=claude` and `provider=google_places`

### Alert Thresholds
- **API error rate high**: `api.request.error_rate / api.request.rate > 2%` for 10m.
- **API p95 latency high**: `p95(api.request.latency) > 1500ms` for 10m.
- **Navigate provider latency high**: `p95(navigate.provider.latency) > 5000ms` for 10m.
- **Redis cache hit ratio low**: `< 0.70` for 15m.
- **External API failures**:
  - Claude failures `external_api.failure{provider:claude} > 10/5m`
  - Google failures `external_api.failure{provider:google_places} > 20/5m`
- **Billing webhook failures**: `billing.webhook.processed{result:failure} > 0` for 5m.

### Runbooks
- Primary ops runbook: `docs/heroku-deploy.md#incident-runbook-observability`
- Billing/webhooks checks: `docs/heroku-deploy.md#billing-webhook-debug-checklist`

# Findoc UAE

> Independent health navigation for the UAE — find the right specialist clinic, fast.

---

## Monorepo Structure

```
findoc-ai-triager/
├── api/          Rails 7.2 API-only backend
├── web/          Next.js 14 App Router frontend (PWA)
├── docs/         Architecture, API contract, ADRs, Heroku deploy guide
├── docker-compose.yml
└── .env.example
```

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│               Browser / PWA (port 3000)              │
│     Next.js 14 — SSR, App Router, Tailwind CSS       │
│                                                      │
│  /               Landing — symptom input             │
│  /navigate       AI triage chat                      │
│  /results        Clinic search results               │
│  /profile        Dashboard (history, saved, called)  │
│  /auth/signin    Magic-link sign-in                  │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS  (JWT Bearer token)
                      ▼
┌──────────────────────────────────────────────────────┐
│           Rails 7.2 API-only (port 3001)             │
│                                                      │
│  POST /api/v1/auth/magic_link                        │
│  GET  /api/v1/auth/magic_link_verify                 │
│  POST /api/v1/auth/google                            │
│  GET  /api/v1/auth/me                                │
│  POST /api/v1/navigate                               │
│  GET  /api/v1/navigate/history                       │
│  GET  /api/v1/places/search                          │
│  GET  /api/v1/insurance_providers                    │
│  POST /api/v1/clinic_insurance                       │
│  GET/POST/DELETE /api/v1/saved_places                │
│  POST /api/v1/tracking/:type                         │
└──────┬──────────────────────┬───────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐     ┌──────────────────────┐
│  PostgreSQL │     │        Redis          │
│  8 tables   │     │  places search: 12h  │
│  JSONB msgs │     │  place details:  7d  │
│             │     │  navigate:      24h  │
└─────────────┘     └──────────────────────┘
                             │ (external)
       ┌─────────────────────┴──────────────────────┐
       │  Claude claude-sonnet-4-6 (AI triage)      │
       │  Google Places API New (clinic search)      │
       └────────────────────────────────────────────┘
```

### Database Tables

| Table | Purpose |
|---|---|
| `users` | Auth, plan, locale, insurance preference |
| `navigation_sessions` | AI triage history, messages as JSONB |
| `insurance_providers` | Reference data (Daman, AXA, Bupa …) |
| `clinic_insurance_links` | Crowdsourced clinic ↔ insurance mappings |
| `lead_events` | Click attribution (phone / directions / website) |
| `clinic_listings` | Future clinic portal (schema only in V2) |
| `clinic_leads_monthly` | Aggregated analytics per clinic per month |
| `saved_places` | User favourites (Google place_id) |

### Caching Strategy

| Cache Key | TTL | Purpose |
|---|---|---|
| `places_search:v1:{specialty}:{lat}:{lng}:{insurance}` | 12h | Google Places Text Search |
| `place_details:v1:{place_id}` | 7d | Google Place Details |
| `navigate:v1:{md5(symptoms::insurance)}` | 24h | Claude triage response |

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Ruby | 3.2+ | `rbenv install 3.2.0` |
| Bundler | 2.x | `gem install bundler` |
| Node.js | 18+ | `nvm install 18` |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Redis | 7 | `brew install redis` |
| Docker (optional) | 24+ | [docs.docker.com](https://docs.docker.com) |

---

## Running Locally

### Option A — Docker Compose (recommended)

```bash
# 1. Clone and copy env
git clone <repo-url>
cd findoc-ai-triager
cp .env.example .env
# edit .env — fill ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY

# 2. Start all services
docker-compose up

# 3. Open
#   Web → http://localhost:3000
#   API → http://localhost:3001
#   Health check → http://localhost:3001/up
```

The `api` container automatically runs `db:create db:migrate db:seed` on startup.

---

### Option B — Local Dev (two terminals)

#### Terminal 1 — Rails API

```bash
cd api

# Install gems
bundle install

# Configure environment
cp ../.env.example .env.development.local
# edit .env.development.local — at minimum set:
#   DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, GOOGLE_PLACES_API_KEY

# Create DB, run migrations, seed insurance providers
rails db:create db:migrate db:seed

# Start API server on port 3001
rails server -p 3001
```

**Verify:** `curl http://localhost:3001/up` → `{"status":"ok"}`

#### Terminal 2 — Next.js Web

```bash
cd web

# Install dependencies
npm install

# Configure environment
cat > .env.local <<'EOF'
NEXT_PUBLIC_RAILS_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your-maps-key-here
EOF

# Start dev server on port 3000
npm run dev
```

**Open:** http://localhost:3000

---

## Environment Variables

### Root `.env` (used by Docker Compose)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `REDIS_URL` | yes | Redis connection string |
| `JWT_SECRET` | yes | HS256 signing secret (min 32 chars) |
| `ANTHROPIC_API_KEY` | yes | Claude API key |
| `GOOGLE_PLACES_API_KEY` | yes | Google Places API (New) key |
| `GOOGLE_CLIENT_ID_WEB` | no | Google OAuth web client ID |
| `WEB_URL` | yes | Frontend URL (for CORS + magic-link emails) |
| `NEXT_PUBLIC_RAILS_API_URL` | yes | Rails API base URL seen by browser |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | no | Google Maps Static/Embed API key |

Copy `.env.example` as a starting point — it contains all keys with descriptions.

---

## Key Scripts

### API

```bash
cd api
rails db:migrate            # run pending migrations
rails db:seed               # seed insurance providers
rails routes                # list all API routes
rails test                  # run test suite
```

### Web

```bash
cd web
npm run dev                 # development server (hot reload)
npm run build               # production build
npm run lint                # ESLint
```

---

## Project Layout

```
api/
├── app/
│   ├── controllers/api/v1/   auth, navigate, places, saved_places, tracking …
│   ├── models/               User, NavigationSession, InsuranceProvider …
│   └── services/             AiNavigationService, PlacesService, JwtService
├── config/
│   └── ai/navigation_v2.md   Claude system-prompt (read at runtime)
└── db/migrate/               8 migration files

web/
├── app/
│   ├── page.tsx              Landing — symptom input
│   ├── navigate/             AI chat triage
│   ├── results/              Clinic search results
│   ├── profile/              User dashboard (history, saved, called)
│   └── auth/                 Sign-in + magic-link verify
├── components/               Navbar, Footer, DoctorCard, SpecialistCard …
├── contexts/AuthContext.tsx  JWT auth state (localStorage)
└── lib/api.ts                Typed Rails API client

docs/
├── architecture.md           Full system diagram
├── api-contract.md           Endpoint reference
├── heroku-deploy.md          Step-by-step Heroku deploy
└── adr/                      Architecture Decision Records
```

---

## Deploy → Heroku

See [docs/heroku-deploy.md](docs/heroku-deploy.md) for step-by-step instructions using `git subtree` to deploy `/api` and `/web` from the monorepo root.

---

> This platform provides independent health navigation guidance and does not constitute medical advice. Always consult a qualified healthcare professional.

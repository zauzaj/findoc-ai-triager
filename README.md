# Findoc UAE — V2 Monorepo

Independent health navigation for the UAE — find the right specialist clinic, fast.

| Directory | Purpose |
|-----------|---------|
| `/api`    | Rails 7.2 API-only — auth, triage, places, tracking |
| `/web`    | Next.js 14 App Router — PWA, SSR, patient UI |
| `/docs`   | Architecture, API contract, ADRs, Heroku deploy |

## Quick Start (Docker)

```bash
cp .env.example .env          # fill in API keys
docker-compose up
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Health: http://localhost:3001/up

## Local Dev (without Docker)

### API
```bash
cd api
bundle install
cp .env.example .env.development.local   # fill in keys
rails db:create db:migrate db:seed
rails server -p 3001
```

### Web
```bash
cd web
npm install
cp .env.local.example .env.local         # set NEXT_PUBLIC_RAILS_API_URL
npm run dev
```

## Deploy → Heroku
See [docs/heroku-deploy.md](docs/heroku-deploy.md).

## Architecture
See [docs/architecture.md](docs/architecture.md).

## API Contract
See [docs/api-contract.md](docs/api-contract.md).

---
> This platform provides independent health navigation guidance and does not constitute medical advice. Always consult a qualified healthcare professional.

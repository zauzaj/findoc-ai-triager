# Heroku Deploy — Findoc UAE V2

## Prerequisites
- Heroku CLI installed and logged in
- Git remote configured

## Create Apps

```bash
heroku create findoc-api --region eu
heroku create findoc-web --region eu
```

## Provision Add-ons (API app)

```bash
heroku addons:create heroku-postgresql:essential-0 --app findoc-api
heroku addons:create heroku-redis:mini              --app findoc-api
```

## Set Config Vars

### API app
```bash
heroku config:set --app findoc-api \
  JWT_SECRET=$(openssl rand -hex 32) \
  ANTHROPIC_API_KEY=your_key_here \
  GOOGLE_PLACES_API_KEY=your_key_here \
  GOOGLE_CLIENT_ID_WEB=your_client_id \
  WEB_URL=https://findoc-web.herokuapp.com \
  RAILS_ENV=production \
  RAILS_LOG_TO_STDOUT=true \
  RAILS_SERVE_STATIC_FILES=true
```

### Web app
```bash
heroku config:set --app findoc-web \
  NEXT_PUBLIC_RAILS_API_URL=https://findoc-api.herokuapp.com/api/v1 \
  NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_maps_key
```

## Deploy

### API (from monorepo root)
```bash
git subtree push --prefix api heroku-api main
# or using heroku.yml / Procfile in /api
```

### Web
```bash
git subtree push --prefix web heroku-web main
```

## Procfile (api/)
Create `/api/Procfile`:
```
web: bundle exec rails server -p $PORT -e $RAILS_ENV
release: bundle exec rails db:migrate
```

## Post-Deploy
```bash
heroku run rails db:seed --app findoc-api
heroku logs --tail --app findoc-api
```

## Environment Variables Reference

| Variable                      | App | Required | Description                          |
|-------------------------------|-----|----------|--------------------------------------|
| DATABASE_URL                  | api | ✅        | Auto-set by Heroku Postgres          |
| REDIS_URL                     | api | ✅        | Auto-set by Heroku Redis             |
| JWT_SECRET                    | api | ✅        | 32+ char random secret               |
| ANTHROPIC_API_KEY             | api | ✅        | Claude API key                       |
| GOOGLE_PLACES_API_KEY         | api | ✅        | Server-side Places key               |
| GOOGLE_CLIENT_ID_WEB          | api | ✅        | For Google Sign-In verification      |
| WEB_URL                       | api | ✅        | CORS + magic link base URL           |
| NEXT_PUBLIC_RAILS_API_URL     | web | ✅        | Full URL to Rails API /api/v1        |
| NEXT_PUBLIC_GOOGLE_MAPS_KEY   | web |          | Static Maps + Embed (client-side)    |

## Incident Runbook (Observability)

### Required config vars

```bash
heroku config:set --app findoc-api \
  SENTRY_DSN=https://<key>@sentry.io/<project> \
  SENTRY_TRACES_SAMPLE_RATE=0.1 \
  STATSD_HOST=<metrics-agent-host> \
  STATSD_PORT=8125

heroku config:set --app findoc-web \
  NEXT_PUBLIC_SENTRY_TUNNEL_ENDPOINT=https://findoc-api.herokuapp.com/telemetry
```

### Alert handling matrix

| Alert | First checks | Immediate mitigation |
|---|---|---|
| API error rate > 2% (10m) | `heroku logs --tail --app findoc-api`, filter `api.request.error_rate` and `error.captured` | Roll back latest deploy, disable problematic feature flag/env var |
| API p95 latency > 1.5s (10m) | Inspect `api.request.latency` by path, check Postgres/Redis health | Scale dynos up, flush problematic cache key patterns |
| Redis hit ratio < 70% (15m) | Compare `redis.cache.hit` vs `redis.cache.miss` by flow | Increase TTL for hot keys, validate Redis connectivity |
| Claude/Google failure spike | Check `external_api.failure` tags for provider + code | Switch to degraded fallback messaging, retry with backoff |
| Billing webhook failures > 0 (5m) | Search `billing_webhook.processed` with `result=failure` | Re-deliver failed webhooks from Lemon Squeezy dashboard |

### Billing webhook debug checklist
1. Validate webhook signature secret exists and matches Lemon Squeezy settings.
2. Confirm `billing_webhook.processed` logs include `result=success`.
3. Query recent `Subscription` rows for expected status transitions.
4. Re-send one failed event and verify idempotent upsert behavior.
5. Backfill analytics rows if webhook processed but analytics event creation failed.

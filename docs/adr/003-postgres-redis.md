# ADR 003 — PostgreSQL + Redis

**Status:** Accepted  
**Date:** 2024-02

## Context
Need persistent storage for users, sessions, and lead events. Need a fast cache to reduce Google Places and Claude API costs.

## Decision
- **PostgreSQL** via Heroku Postgres Essential (managed, reliable, JSONB support)
- **Redis** via Heroku Redis Mini (managed, volatile cache + rate limiting)

## Cache TTLs
| Data              | TTL  | Rationale                                      |
|-------------------|------|------------------------------------------------|
| Places search     | 12h  | Clinics don't change infrequently; good balance |
| Place details     | 7d   | Very stable; saves Places Details API calls    |
| Navigate (Claude) | 24h  | Deterministic for identical symptoms           |

## Consequences
- **+** Significant API cost reduction — repeated searches for popular specialties hit cache
- **+** JSONB column for `navigation_sessions.messages` enables flexible AI conversation storage
- **−** Redis is volatile — cache misses on restart are acceptable (data re-fetched from API)
- **−** Two additional Heroku add-ons to provision

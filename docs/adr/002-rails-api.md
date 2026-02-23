# ADR 002 — Rails 7 API-only Backend

**Status:** Accepted  
**Date:** 2024-02

## Context
The backend needs: auth (JWT), PostgreSQL persistence, Redis caching, external API calls (Claude, Google Places), and future billing hooks.

## Decision
Rails 7.2 API-only mode with `pg`, `redis`, `jwt`, `httparty`, `rack-cors`.

## Alternatives Considered
- **Node/Express** — same team already has Ruby experience; Rails conventions reduce boilerplate for CRUD + migrations
- **Next.js API routes only** — rejected once persistence + auth + Redis caching were required (see ADR 003)

## Consequences
- **+** Mature ORM (ActiveRecord), migrations, validations
- **+** Redis cache store built-in (`config.cache_store`)
- **+** `rails generate` scaffolding for future models
- **−** Separate Heroku dyno and deploy pipeline from the web app

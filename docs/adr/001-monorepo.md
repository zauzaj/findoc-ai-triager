# ADR 001 — Monorepo Structure

**Status:** Accepted  
**Date:** 2024-02

## Context
The product requires a Rails API backend and a Next.js frontend. Both are closely related and developed by the same team.

## Decision
Single Git repository with `/api` (Rails) and `/web` (Next.js) subdirectories.

## Consequences
- **+** Atomic commits across API and web (e.g. add endpoint + consume it in one PR)
- **+** Shared docs, ADRs, and docker-compose in one place
- **+** Simple `git subtree push` deploy to Heroku
- **−** Slightly larger clone; mitigated by `.gitignore` excluding `node_modules` and gems

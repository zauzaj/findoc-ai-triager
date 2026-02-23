# Clinic Identity, Mapping & Paid Visibility (Early MVP)

## Implemented architecture

### Canonical clinic identity
- Google `place_id` is the canonical clinic identifier.
- Existing analytics keys are preserved:
  - `lead_events.google_place_id`
  - `analytics_events.place_id`
  - `clinic_insurance_links.google_place_id`

### Single clinic table
- MVP uses one overlay table: `clinics`.
- `clinics.place_id` is unique and required.
- The table stores monetization and claim state only (not duplicated Google master profile fields).

### Shadow creation
- On every `/places/search`, search results are persisted into `clinics` using minimal defaults if missing.
- This guarantees every viewed/tracked clinic has a durable local row keyed by `place_id`.

### Specialty mapping (many-to-many)
- `clinic_specialties` table maps `place_id` to `specialty_slug`.
- Mapping is deterministic from Google `types` → specialty slugs.
- A clinic can map to multiple specialties.

### Insurance normalization
- `clinic_insurance_links` now includes:
  - `insurance_slug`
  - `source` (`scraped` / `manual` / `verified`)
  - `confidence` (`low` / `medium` / `high`)
  - `verified_at`
- Insurance filtering uses canonical `insurance_slug` matching.

### Featured eligibility + placement
A clinic is featured only when all conditions pass:
1. `clinics.subscription_status = active`
2. `clinics.featured_enabled = true`
3. `clinic_specialties` contains current search specialty
4. insurance match exists when insurance filter is active
5. clinic already appears in organic results

Placement rule:
- At most 1 featured clinic per result set
- Featured placement inserted at rank 2 (never rank 1)
- Tie-breaker: earliest `subscription_started_at`

## Migration summary
- Merged `clinic_listings` into `clinics`.
- Added canonical `place_id` unique index on `clinics`.
- Added `clinic_specialties` many-to-many table.
- Extended `clinic_insurance_links` with normalized insurance metadata.

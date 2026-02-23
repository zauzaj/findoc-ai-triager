# MVP Open Tasks

## Task 2 — Implement “Called clinics” history end-to-end

### Problem
The `/profile/called` page is currently a placeholder and does not load real call history, even though call clicks are already tracked via `lead_events`.

### Goal
Ship a real “Called clinics” experience so signed-in users can revisit clinics they called, improving retention and repeat conversion.

### Scope

#### Backend
- Add endpoint: `GET /api/v1/called_places` (auth required).
- Data source: `lead_events` with `event_type = 'phone_click'` and `user_id = current_user.id`.
- Return deduplicated clinics by `google_place_id` with:
  - latest `called_at`
  - call count
  - optional specialty/insurance context from latest event
- Enrich each entry with place details (name, address, phone) from `PlacesService.show` with Redis caching fallback behavior.
- Sort descending by `called_at`.

#### Frontend
- Replace placeholder in `web/app/profile/called/page.tsx` with real API fetch.
- Show states:
  - loading spinner
  - empty state (no calls)
  - error state
  - list of called clinics
- Each list row should include:
  - clinic name + address
  - phone number
  - `last called` date
  - `times called`
  - CTA buttons: “Call again”, “Get directions”.

#### Analytics
- Emit events:
  - `called_history_viewed`
  - `called_history_call_again_clicked`
  - `called_history_directions_clicked`

### API Contract (proposed)
`GET /api/v1/called_places`

```json
{
  "called_places": [
    {
      "google_place_id": "ChIJ...",
      "name": "Dubai Heart Centre",
      "address": "Healthcare City, Dubai",
      "phone": "+971 4 123 4567",
      "times_called": 3,
      "last_called_at": "2026-02-23T10:30:00Z",
      "specialty": "Cardiologist",
      "insurance": "daman"
    }
  ]
}
```

### Acceptance Criteria
- Signed-in user sees actual called clinics within `/profile/called`.
- Unauthenticated user is redirected to sign-in (existing behavior preserved).
- Entries are deduplicated by clinic and sorted by latest call.
- “Call again” opens tel link and tracks event.
- Endpoint has request specs for auth, empty, and populated cases.

### Non-goals (for this task)
- Call recording, telephony integration, or call duration tracking.
- Cross-device reconciliation for anonymous events not tied to user.

---

## Task 3 — Add post-consult follow-up outcomes loop

### Problem
The product currently tracks funnel actions but not care outcomes. There is no structured follow-up loop to capture whether the recommendation was useful or whether a visit happened.

### Goal
Introduce a lightweight outcome feedback loop to improve recommendation quality, trust, and product learning.

### Scope

#### Backend
- Add endpoint: `POST /api/v1/navigation/:session_token/outcome` (auth optional, but accepted for signed-in users).
- Persist outcome in a new table `navigation_outcomes` linked to `navigation_sessions`:
  - `navigation_session_id`
  - `user_id` (nullable)
  - `helpful` (boolean, nullable)
  - `visited_clinic` (boolean, nullable)
  - `outcome_type` (enum/string: `improved`, `no_change`, `worse`, `booked`, `did_not_book`, `other`)
  - `notes` (text, optional, max length)
  - timestamps
- Idempotency rule: latest submission per session/user overwrites prior values (upsert behavior).

#### Frontend
- Add a post-result follow-up card for completed navigation sessions:
  - Q1: “Was this recommendation helpful?” (Yes/No)
  - Q2: “Did you visit a clinic?” (Yes/No/Not yet)
  - Q3: “What was the outcome?” (select)
  - Optional comment field
- Placement:
  - on `/profile/history` per session row (inline action)
  - optional prompt after 24h on returning users (future flag; not required in first PR)
- Ensure submission is quick (<30 seconds) with dismiss option.

#### Analytics
- Add allowed events and tracking:
  - `outcome_prompt_shown`
  - `outcome_submitted`
  - `outcome_skipped`
- Add structured properties for model improvement slices:
  - specialist type, urgency, insurance, time-to-feedback.

### API Contract (proposed)
`POST /api/v1/navigation/:session_token/outcome`

```json
{
  "helpful": true,
  "visited_clinic": true,
  "outcome_type": "improved",
  "notes": "Visited same day, cardiologist confirmed non-emergency condition"
}
```

Response:

```json
{ "ok": true }
```

### Acceptance Criteria
- Users can submit and edit feedback for a past navigation session.
- Outcome data is queryable by session, specialist, urgency, and insurance.
- Analytics events are emitted for shown/submitted/skipped.
- Outcome submission never blocks core navigation flow.
- Tests cover validation, upsert behavior, and unauthorized session-token access.

### Non-goals (for this task)
- Clinical diagnosis validation.
- Provider-side outcome verification.
- Automated model retraining pipeline (capturing data only in MVP).

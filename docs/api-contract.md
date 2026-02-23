# Findoc V2 API Contract

Base URL: `https://api.findoc.ae/api/v1`  
Auth: `Authorization: Bearer <jwt>` (required where noted)  
Errors: `{ "error": "...", "message": "..." }` with appropriate HTTP status.

---

## Auth

### POST /auth/google
Sign in with Google ID token.
```json
// Request
{ "id_token": "<google_id_token>" }

// Response 200
{ "token": "<jwt>", "user": { "id": 1, "email": "...", "plan": "free", ... } }
```

### POST /auth/apple
```json
{ "uid": "<apple_uid>", "email": "user@example.com", "name": "Jane" }
```

### POST /auth/magic_link
```json
{ "email": "user@example.com" }
// Response 200: { "message": "Magic link sent." }
```

### GET /auth/magic_link_verify?token=
```json
// Response 200: { "token": "<jwt>", "user": { ... } }
```

### GET /auth/me  🔒
```json
// Response 200: { "user": { "id": 1, "email": "...", "plan": "free", "insurance_provider": "daman", ... } }
```

---

## Navigation

### POST /navigate
```json
// Request
{ "symptoms": "chest tightness and shortness of breath", "insurance": "daman", "lat": 25.2, "lng": 55.3 }

// Response 200
{
  "session_token": "abc123",
  "specialist": "Cardiologist",
  "urgency": "high",
  "confidence": 0.87,
  "explanation": "Your symptoms may indicate a heart-related condition..."
}
```

### GET /navigate/history  🔒
```json
// Response 200
{
  "history": [
    {
      "id": 42,
      "session_token": "abc123",
      "initial_symptoms": "chest tightness...",
      "recommended_specialist": "Cardiologist",
      "urgency_level": "high",
      "insurance_filter": "daman",
      "created_at": "2024-03-15T10:30:00Z"
    }
  ]
}
```

---

## Places

### GET /places/search?specialist=&lat=&lng=&insurance=
```json
// Response 200
{
  "places": [
    {
      "id": "ChIJ...",
      "place_id": "ChIJ...",
      "name": "Dubai Heart Centre",
      "address": "Healthcare City, Dubai",
      "lat": 25.2331,
      "lng": 55.3024,
      "rating": 4.5,
      "phone": "+971 4 123 4567",
      "website": "https://example.com",
      "insurance_accepted": ["daman"],
      "featured": false
    }
  ]
}
```

### GET /places/:place_id
Returns full place details. Cached 7 days.

### POST /places/:place_id/save  🔒
```json
{ "specialty": "Cardiologist", "notes": "Recommended by friend" }
// Response 201: { "saved_place": { "id": 1, "google_place_id": "ChIJ...", ... } }
```

### DELETE /places/:place_id/save  🔒
```json
// Response 200: { "ok": true }
```

### GET /saved_places  🔒
```json
// Response 200: { "saved_places": [ { "id": 1, "google_place_id": "...", "specialty": "...", "saved_at": "..." } ] }
```

### GET /called_places  🔒
Returns up to 50 unique clinics from the signed-in user's `phone_click` events, sorted by most recent call.
```json
// Response 200
{
  "called_places": [
    {
      "google_place_id": "ChIJ...",
      "name": "Dubai Heart Centre",
      "address": "Healthcare City, Dubai",
      "phone": "+971 4 123 4567",
      "maps_url": "https://maps.google.com/...",
      "times_called": 3,
      "last_called_at": "2026-02-23T10:30:00Z",
      "specialty": "Cardiologist",
      "insurance": "daman",
      "partial": false
    }
  ]
}
```
If place enrichment fails for a row, the row is still returned with `partial: true` and metadata.

---

## Insurance

### GET /insurance_providers
```json
// Response 200
{ "insurance_providers": [ { "id": 1, "name": "Daman", "slug": "daman", "full_name": "Daman National Health Insurance Company" } ] }
```

### POST /clinic_insurance  🔒
```json
{ "google_place_id": "ChIJ...", "insurance_slug": "daman" }
// Response 201: { "clinic_insurance": { "id": 5, "verified": false, "confidence": "low", "source": "manual" } }
```

---

## Tracking

All tracking endpoints accept optional `Authorization` header.

> Note: request key remains `google_place_id` for backward compatibility; it maps to canonical clinic identity (`place_id`).

### POST /tracking/view
### POST /tracking/phone_click
### POST /tracking/directions
### POST /tracking/website
```json
// Request (all endpoints)
{
  "google_place_id": "ChIJ...",
  "session_id": 42,
  "specialty": "Cardiologist",
  "insurance": "daman",
  "source": "results_page"
}
// Response 200: { "ok": true }
```

---

## Error Format
```json
{ "error": "Unauthorized",          "message": "Missing token" }
{ "error": "Not Found",             "message": "..." }
{ "error": "Unprocessable Entity",  "message": "..." }
{ "error": "Bad Request",           "message": "param is missing: symptoms" }
```

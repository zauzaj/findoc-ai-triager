# Findoc UAE — Frontend

Independent health navigation platform for the UAE. Helps users identify which specialist to see based on their symptoms, filtered by insurance provider.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |

No other global tools are required.

---

## Dependencies

### Runtime
| Package | Version | Purpose |
|---|---|---|
| `next` | 14.x | App framework (App Router, SSR, Metadata API) |
| `react` | 18.x | UI library |
| `react-dom` | 18.x | DOM rendering |

### Dev / build
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | 3.x | Utility-first CSS |
| `postcss` | 8.x | CSS processing (required by Tailwind) |
| `typescript` | 5.x | Type checking |
| `@types/node` | 20.x | Node type definitions |
| `@types/react` | 18.x | React type definitions |
| `@types/react-dom` | 18.x | React DOM type definitions |

---

## Environment variables

Copy the example file and fill in the backend URL:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set:

```env
# Base URL of the Findoc backend API — no trailing slash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

The frontend will not make any API calls if this is left empty, but it will still render all pages.

---

## Running locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment (see above)
cp .env.local.example .env.local

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create an optimised production build |
| `npm start` | Serve the production build locally |
| `npm run lint` | Run Next.js linter |

---

## Project structure

```
app/                        # Next.js App Router pages
  layout.tsx                # Root layout (Navbar, Footer, global CSS)
  page.tsx                  # Landing page (/)
  navigate/
    page.tsx                # Specialist guidance page (/navigate)
    NavigateClient.tsx      # Client component — calls POST /navigate
  results/
    page.tsx                # Clinic results page (/results)
    ResultsClient.tsx       # Client component — calls GET /places/search
  blog/[slug]/
    page.tsx                # Blog placeholder (SEO landing)
  doctors/[specialty]/[area]/
    page.tsx                # Specialty + area SEO landing page
  insurance/[provider]/
    page.tsx                # Insurance provider SEO landing page
  for-clinics/
    page.tsx                # Clinic partnership page

components/                 # Shared UI components
  Navbar.tsx
  Footer.tsx
  SymptomInput.tsx          # Symptom textarea + submit (client)
  InsuranceSelect.tsx       # Insurance dropdown (client)
  SpecialistCard.tsx        # Displays recommended specialist
  DoctorCard.tsx            # Displays a single clinic result (client)
  UrgencyBanner.tsx         # Colour-coded urgency indicator

lib/
  api.ts                    # All fetch calls — navigate(), searchPlaces(), trackEvent()
  constants.ts              # Insurers list, urgency levels, site config
  utils.ts                  # Formatting helpers
```

---

## Backend API contract

The frontend expects a backend at `NEXT_PUBLIC_API_BASE_URL` with these endpoints:

```
POST /navigate
  Body:    { symptoms: string, insurance?: string }
  Returns: { specialist, urgency, confidence, explanation }

GET  /places/search?specialist=&lat=&lng=&insurance=
  Returns: Place[]

POST /tracking/:event
  Events:  view | phone_click | directions_click | website_click
  Body:    { place_id?: string, specialist?: string }
```

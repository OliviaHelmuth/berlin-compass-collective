## Goal

Pull three entity types from startup-map.berlin into our `locations` table (with tags for search), surface them on the Discover/Events map, and rebuild the Opportunities page so accelerator/incubator programs become first-class.

## Sources

- Universities: `https://startup-map.berlin/universities/...Berlin/Brandenburg`
- Coworking: `https://startup-map.berlin/companies.workspaces/...not_closed`
- Accelerators/Incubators: equivalent startup-map.berlin lists (`companies.accelerators` / `companies.incubators`)

These pages are JS-rendered SPA lists, so we'll scrape via **Firecrawl** (already connected) with JSON extraction — pulling name, website, address/district, and short description per entity. We geocode missing lat/lng via Google Maps (key already in secrets).

## Steps

### 1. Scraper server function (`src/lib/startup-map.server.ts`)
- One function per category: `syncUniversities()`, `syncCoworking()`, `syncAcceleratorsIncubators()`.
- Each uses Firecrawl `scrape` with `formats: [{ type: 'json', schema }]` against the list URL (with pagination/scrolling via `waitFor`).
- For each entity: geocode address → upsert into `public.locations` with the right `category` enum value and a `tags` array (e.g. `["university", "research"]`, `["coworking", "kreuzberg"]`, `["accelerator", "program", "deeptech"]`).
- Use `external_id`-style dedupe via name+category (no schema change needed; do an upsert on `(name, category)` via a check-then-insert since there's no unique constraint — or add one, see Technical).

### 2. One-time backfill trigger
- Add a public route `src/routes/api/public/admin/sync-startup-map.ts` (POST) guarded by a simple shared-secret header so we can fire it once. Returns counts per category.
- After backfill, this endpoint stays for occasional manual re-runs but no cron.

### 3. Map + search integration
- `locations` already drives both the Discover map and Events map, so new entries appear automatically once inserted.
- Extend the location filter UI on Discover (and the events tag filter) to include the new tags / categories (accelerator, incubator) in chip options.

### 4. Opportunities page enhancement (`src/routes/opportunities.tsx`)
- Add a new section "Programs" listing all accelerator + incubator locations with: name, district, tags, link to location page, website.
- Keep existing opportunities (grants/office hours/cofounder) as a second section.
- Add a search bar + tag filter shared across both sections.

## Technical Details

- **DB**: add a unique constraint `locations_name_category_key` on `(name, category)` so upserts are idempotent. Migration only; no data shape change.
- **Categories**: `university`, `coworking`, `accelerator`, `incubator` already exist in the `location_category` enum (verified via existing `ENTITY_CATEGORIES` set).
- **Geocoding**: use Google Maps Geocoding API server-side via `GOOGLE_MAPS_API_KEY`; cache by address string in-memory per run.
- **Tags strategy**: always include the category as a tag, plus district, plus any keywords surfaced by the source (e.g. "Coworking", "Hub", "Innovation Center", focus areas for accelerators like "DeepTech", "AI", "Climate").
- **Firecrawl extraction schema** (example for coworking):
  ```ts
  { entities: z.array(z.object({
      name: z.string(),
      website: z.string().url().optional(),
      address: z.string().optional(),
      district: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
  })) }
  ```
- **Idempotency**: skip entries already present (same name + category) and update website/description/tags if changed.
- **Failure handling**: each category is wrapped in try/catch; partial failures still return counts so we know what landed.

## Out of scope

- Cron/scheduled refresh (user chose one-time backfill).
- Logo/image scraping.
- Importing programs as `opportunities` rows (we keep them as locations with `accelerator`/`incubator` category — the Opportunities page just queries locations of those categories).

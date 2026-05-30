# Real Berlin events via Firecrawl

Replace seed/fake events with a scheduled scraper that pulls real Berlin startup events from public listing sites, normalizes them with an LLM, and upserts into the existing `events` table.

## Sources (start small, expand later)

Public listing pages that don't require login:
- **Lu.ma Berlin** — `https://lu.ma/berlin` (densest source for Berlin tech/founder meetups)
- **Silicon Allee calendar** — `https://www.siliconallee.com/events`
- **Berlin Startup Calendar** — `https://www.berlinstartupcalendar.com/`
- **Meetup Berlin tech** — search page (best-effort, often gated)

Phase 1 ships with Lu.ma + Silicon Allee. The other two are easy to add once the pipeline works.

## How it works

```text
pg_cron (daily 06:00 UTC)
   └─► POST /api/public/cron/scrape-events  (apikey: anon)
         └─► for each source:
               Firecrawl scrape (markdown + links)
               Lovable AI Gateway (gpt-5-mini) → structured array
                  { title, starts_at, ends_at?, venue?, district?,
                    host?, description?, url, category, tags[] }
               upsert into public.events (dedup on source+url)
```

## Schema changes

Add to `events` so we can dedup and credit the source:
- `source text` (e.g. `luma`, `silicon-allee`)
- `external_id text` (URL or site-specific ID)
- Unique index on `(source, external_id)`

Tags from the existing tag catalogue (AI, ClimateTech, etc.) flow into the personalized feed automatically.

## Implementation

1. **Connector**: connect Firecrawl via `standard_connectors--connect`. Provides `FIRECRAWL_API_KEY`.
2. **Migration**: add `source` + `external_id` columns + unique index. Also add a one-time `DELETE FROM events WHERE source IS NULL` toggle (off by default — user decides).
3. **Server route** `src/routes/api/public/cron/scrape-events.ts`:
   - Auth gate: `apikey` header must equal `SUPABASE_PUBLISHABLE_KEY`.
   - For each source: Firecrawl scrape → AI SDK `generateObject` with a Zod schema → batch upsert via `supabaseAdmin`.
   - Returns `{ scraped, inserted, updated, errors }`.
4. **Manual trigger** in UI: an admin-only "Refresh events" button on `/events` that calls the same route (so we can test without waiting for cron).
5. **pg_cron job**: daily at 06:00 UTC via `net.http_post` to the stable preview/published URL.

## What you'll see

Within a minute of the first run, `/events` lists real upcoming Berlin events with venue, time, host, source link, and matching tags. The personalized "For You — Events" strip on the home page picks them up automatically because the recommender already scores on `tags`.

## Out of scope

- Per-user event submission flow (already exists via the existing INSERT policy).
- Image/cover thumbnails — Lu.ma exposes them, can be added later.
- Meetup OAuth (requires their API key) — skipped.

## Open questions

- OK to wipe the existing seed/fake events on first run so the list isn't a mix? Default: keep them, mark new ones with `source` so we can tell them apart.
- Daily is enough, or do you want hourly?

Want me to start with Lu.ma + Silicon Allee at a daily cadence, manual-trigger button on `/events`, and keep existing fake events for now?

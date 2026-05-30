
## Problem

- Lu.ma is a single-page app — Firecrawl's plain markdown scrape returns nav/footer links to `lu.ma/...` user/discover pages instead of real event URLs, so every "event" links to the Lu.ma homepage.
- We never wired Meetup, so it appears "blocked".
- `welcomeberlin.net/networking-events/` is static HTML and scrapes cleanly.

## Changes

### 1. Rewrite `src/routes/api/public/cron/scrape-events.ts`

Replace the single-pass scrape with a two-stage pipeline per source:

**Sources**
- `welcomeberlin` → `https://welcomeberlin.net/networking-events/` (listing, single-pass, no JS needed)
- `silicon-allee` → `https://www.siliconallee.com/events` (unchanged)
- `luma` → `https://lu.ma/berlin` (two-stage with JS rendering)

**Lu.ma two-stage**
1. Firecrawl `scrape` with `formats: ['links']` and `waitFor: 3000` so JS-rendered event cards mount; filter `links` to keep only `https://lu.ma/<slug>` (exclude `/discover`, `/signin`, `/home`, `/u/`, `/cities`, etc.).
2. For up to 15 candidate event URLs, call Firecrawl `scrape` with `formats: ['markdown']` + `onlyMainContent: true` on each detail page in parallel (Promise.allSettled, capped).
3. Run each detail page through Gemini with a single-event schema and use the canonical detail URL as `external_id`.

**Other sources** keep the existing listing-extraction flow, but use the same per-source upsert with `onConflict: 'source,external_id'`.

### 2. Wipe old auto-scraped events (one-off via insert tool)

Run: `DELETE FROM public.events WHERE source IS NOT NULL;` — keeps seed rows where `source IS NULL`, drops every previously scraped (and broken Lu.ma) row.

### 3. UI — no functional change

`src/routes/events.tsx` already has the Refresh button and shows `totalUpserted`; no edit needed unless the per-source report needs a nicer summary (I'll add a small "by source" line to the toast).

## Technical notes

- Lu.ma per-detail scrape uses ~16 Firecrawl credits per run (1 listing + 15 details). Acceptable for a daily cron.
- Detail URLs are stable, so the `(source, external_id)` unique index dedupes across runs.
- All scraping stays in the existing TanStack server route; no schema changes, no new secrets.
- After the rewrite ships, you click **Refresh from web** on `/events` to populate; cron schedule will come next once we confirm the data looks good.

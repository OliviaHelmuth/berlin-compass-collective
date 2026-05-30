## 1. Fix AI Match (already real AI — just broken)

It IS using real Lovable AI + real Supabase data already. Two issues:

- **Schema error** (`AI_NoObjectGeneratedError`): `gemini-2.5-flash` sometimes returns prose instead of strict JSON for `generateObject`. Switch model to `google/gemini-3-flash-preview` (current default), loosen the schema (drop the strict `enum` on `kind`, accept then normalize), and add a try/catch fallback that retries with `gemini-2.5-pro` if the first parse fails.
- **"Don't see AI Match in preview"**: the route exists and is in the nav. Most likely the preview was cached. Add a clear hero CTA + ensure the nav highlights it with an "NEW" pill so it's obvious. Also surface it on `/ecosystem` (already there) and from the Hub.

Also: cap catalog payload to ~40 locations / 20 events / 20 opps and pre-trim blurbs to 140 chars so the model has cleaner input → fewer schema failures.

## 2. Landing page: make it feel like THE answer

Rewrite `src/routes/index.tsx` into an exciting, benefit-led story. New sections in order:

1. **Hero** — Big promise + social proof bar
   - Headline: "Berlin's startup scene, finally in one place."
   - Sub: "153 places. 56 events. 25 opportunities. One AI concierge that maps you to the right ones in 10 seconds."
   - Primary CTA: "Match me with my Berlin" → `/match` (glowing, animated sparkle)
   - Secondary: "Explore the ecosystem map" → `/ecosystem`
   - Trust strip: live counters (locations, events, opportunities, founders) pulled from the loader data
2. **"Stuck on…?" problem→solution grid** — 6 founder pains, each links to the exact filtered destination
   - "Need a desk in Kreuzberg" → `/ecosystem?cat=coworking`
   - "Anmeldung / visa help" → `/ecosystem?topic=legal`
   - "Looking for an accelerator" → `/ecosystem?cat=accelerator`
   - "German classes" → `/ecosystem?topic=german`
   - "Want intros to angels" → `/opportunities`
   - "Find my people" → `/match`
3. **AI Match teaser** — full-bleed card with example query + animated typing, "Try it free, no login"
4. **Happening now** — keep current 3-column (events / opportunities / new places)
5. **Community proof** — pull top 3–4 highest-rated locations from loader, show as testimonial-style cards with star rating + review count (already in data)
6. **How it works** — keep but tighten copy
7. **Final CTA band** — "Your first week in Berlin's startup scene starts here"

Visual: keep current brutalist tokens (no new colors), add subtle Motion fade/slide-in on scroll for hero + grid, add an animated sparkle on the AI CTA.

## 3. Nav polish

Add a small "NEW" badge on the `AI Match` nav item so users notice it.

## Technical notes

- Files touched: `src/lib/matchmaking.functions.ts`, `src/routes/index.tsx`, `src/components/atlas/AppShell.tsx`
- No DB changes, no new packages (Motion already isn't required — use Tailwind keyframes for the sparkle to stay zero-dep)
- Reuse existing loader (`eventsQuery`, `oppsQuery`, `locationsQuery`) — already returns ratings via `getLocations`
- Keep all semantic design tokens; no hardcoded colors

## Out of scope

- Navigator AI chat (#3 from earlier plan)
- Any new tables or migrations
- Auth flow changes

Ready to build on approval.
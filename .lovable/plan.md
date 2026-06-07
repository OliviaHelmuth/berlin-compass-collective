## Goal

Make `/match` actually call our AI against our own Supabase data (locations, events, opportunities) and route every result card to its real detail page.

## What already exists (good news)

- `src/lib/matchmaking.functions.ts` already does the real work: pulls up to 60 locations, 20 events, 20 opportunities from Supabase, sends them to Lovable AI (`google/gemini-3-flash-preview`, fallback `google/gemini-2.5-pro`), and returns validated picks whose ids exist in our DB.
- `LOVABLE_API_KEY` is already provisioned.
- Lovable AI Gateway is the right choice — no extra setup, billed from workspace credits, supports the models we need. No reason to wire OpenAI/Anthropic directly.

## What's broken

`src/routes/match.tsx` is the problem. Right now it:
1. Ignores the real `matchmake` server function.
2. Returns 4 hardcoded preset answers with fake ids like `"greentech-hub"`.
3. For any non-preset query, shows a fake "out of credits" message.
4. Result cards link to `/location/{fakeId}` which 404s.

So the AI isn't actually being called, and the cards don't open anything real.

## Plan

### 1. Use the real server function in `match.tsx`

- Remove the `PRESET_RESULTS` map, the fake 1.5s delay, and the fake "out of credits" error.
- Call `matchmake({ data: { query } })` via `useServerFn` on submit.
- Loading state while the request runs; show real summary + picks on success.
- On error, show the actual error message (rate limit, credit exhaustion, validation) instead of a canned one.

### 2. Make result cards open the real thing

`matchmake` already returns real DB ids. Update `PickCard`:
- `location` → `/location/$id` (route exists)
- `event` → `/events` with the event id passed in search params; on the events page, auto-scroll/highlight the matching event (small addition: read `?focus=<id>` and scroll to it).
- `opportunity` → `/opportunities` with `?focus=<id>`, same pattern.

(Locations have a dedicated detail route, events/opportunities don't — focusing on the list item is the minimal correct behavior without building two new detail pages.)

### 3. Keep the example chips

Keep the 4 example prompts as quick-fill buttons, but they now run through the real AI like any other query.

### 4. Light UX polish

- Disable submit while the call is in-flight, show "Matching across 60 places, 20 events, 20 opportunities…".
- Empty-state message when AI returns 0 valid picks (rare, since we validate ids server-side).

## Files touched

- `src/routes/match.tsx` — rewrite the submit handler and `PickCard` href logic.
- `src/routes/events.tsx` — read `?focus=<id>`, scroll the matching card into view, add a highlight ring (small, additive).
- `src/routes/opportunities.tsx` — same `?focus=<id>` treatment.

No DB changes. No new packages. No changes to `matchmaking.functions.ts` (it's already correct).

## Out of scope

- Building dedicated `/event/$id` and `/opportunity/$id` detail pages (bigger task — happy to do it next if you want).
- Streaming AI responses (current one-shot is fine for this UX).
- Caching / rate-limit UI beyond surfacing the error.

Ready to build on approval.
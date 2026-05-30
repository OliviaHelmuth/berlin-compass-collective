# Split Ecosystem into its own tab; slim down Discover

## Goal
Discover (`/`) is overloaded. Move the places directory (search, filters, map, list) to a dedicated **Ecosystem** tab. Discover becomes a tight landing: hero + tiles + a compact "happening now" strip.

## Changes

### 1. New route: `src/routes/ecosystem.tsx`
- Owns the current `Discover` component (search bar, view toggle, filter chips, map + list grid, "Get matched" FAB).
- Reads `?cat=` search param (reuse the `VALID_CATS` + `validateSearch` already in `index.tsx`) and auto-applies the filter + switches to Map view, same behavior the hero tiles depend on today.
- Owns the `locations` query loader.
- Own `head()`: title "Ecosystem — Kiez Founders Berlin", description focused on coworking/VCs/services/universities.
- Page header: H1 "Berlin's startup ecosystem" + one-line subtitle, then the existing search/filter/map UI.

### 2. Update `src/routes/index.tsx`
- Remove `Discover` component, `AtlasMap` lazy import, `locationsQuery`, the loader, `validateSearch`, and `Route.useSearch` usage.
- Keep `Hero` and `HowItWorks`.
- Add a new **`HappeningNow`** strip between Hero and HowItWorks:
  - Three small cards in a row (stacks on mobile): "Upcoming events" (top 3 from events query), "Open opportunities" (top 3), "New in the ecosystem" (3 most recently added locations).
  - Each card links to its full page (`/events`, `/opportunities`, `/ecosystem`).
  - Lightweight: just title + 2–3 line items each, no images, no map.
- Hero tile links currently use `to="/" search={{ cat }} hash="discover"` → change to `to="/ecosystem" search={{ cat }}`.

### 3. Update navigation: `src/components/atlas/AppShell.tsx`
- `NAV` order: Discover (`/`) → **Ecosystem (`/ecosystem`, icon `map`)** → Events → Opportunities → My Hub → Messages.
- Same entry rendered in desktop top nav and mobile bottom nav (both read from `NAV`).
- Note: mobile bottom nav will now show 6 items — still fits but tight. Acceptable.

### 4. Small follow-ups
- Anywhere else linking to `/#discover` (e.g. Hero's "Browse the map" button) → point to `/ecosystem`.
- Leave `my-hub`, `messages`, `events`, `opportunities`, `location/$id` untouched.

## Out of scope
- No data model changes, no new server functions.
- No redesign of the Ecosystem page itself — it's a lift-and-shift of the existing Discover UI.
- The "Happening Now" cards reuse existing queries (events, opportunities, locations); no new endpoints.

## Technical notes
- TanStack Router will pick up `src/routes/ecosystem.tsx` automatically and regenerate `routeTree.gen.ts` on save.
- `locationsQuery` moves with the component into `ecosystem.tsx`; index no longer needs it.
- The `cat` search param contract (`coworking | accelerator | incubator | university | vc | hub | service`) moves verbatim onto the new route so hero tile deep-links keep working.

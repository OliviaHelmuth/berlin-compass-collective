## Berlin Founder Atlas — Build Plan

A community-powered map and discovery platform for Berlin's startup ecosystem, built on the chosen **Two-pane Berlin** Material 3 direction (purple #6D28D9 + lime #C7F23B accent, Space Grotesk + Inter, brutalist offset shadows on M3 surfaces).

### 1. Design system

- Port tokens verbatim into `src/styles.css`: `--primary` (purple), `--accent` (lime), `--surface`, `--surface-container`, `--outline` (#2E2A33), shadow utility for `4px 4px 0 outline` and `4px 4px 0 lime`.
- Load Space Grotesk, Inter, Material Symbols Rounded from Google Fonts in `__root.tsx`.
- Light + dark mode tokens; theme toggle in app bar.
- Reusable components: `FilterChip`, `SegmentedToggle`, `M3Card`, `ExtendedFab`, `TopAppBar`, `BottomNav` / `NavRail`.

### 2. Routes

```
src/routes/
  __root.tsx          shell, theme, fonts, providers
  index.tsx           Discover (map + feed two-pane / mobile stacked)
  events.tsx          Events list
  opportunities.tsx   Opportunity feed
  network.tsx         Founder directory
  location.$id.tsx    Location detail (reviews, recommend %, photos)
  event.$id.tsx       Event detail with RSVP
  profile.$id.tsx     Public founder profile
  login.tsx           Auth (email + Google)
  onboarding.tsx      New-founder matching wizard
  _authenticated/
    me.tsx            Edit own profile
    add-location.tsx  Community submission
```

### 3. Map (Leaflet + OSM)

- `react-leaflet` with OSM tiles, custom purple `divIcon` markers, lime ring on active.
- Category filter chips drive marker visibility.
- Clicking a marker opens an M3 bottom-sheet card; "View details" → `/location/$id`.

### 4. Backend (Lovable Cloud)

Tables (with grants + RLS):
- `profiles` (id, name, bio, sector, stage, location, avatar)
- `locations` (id, name, category, lat, lng, address, district, description, website, submitted_by)
- `reviews` (id, location_id, user_id, rating, recommend, pros, cons, comment)
- `events` (id, title, description, starts_at, location, host, url, source)
- `opportunities` (id, title, type, org, description, deadline, url, location)
- `rsvps` (event_id, user_id)
- `user_roles` (separate table, `app_role` enum, `has_role()` SECURITY DEFINER fn)

RLS: public read on locations/events/opportunities/reviews; insert/update scoped to `auth.uid()`; admin role for moderation.

Auth: email/password + Google via Lovable Cloud managed OAuth.

### 5. Seed data (~40 hand-curated Berlin entries)

Coworking (Factory, Betahaus, Sankt Oberholz, St. Oberholz Mitte, Mindspace, WeWork Sony Center, Ahoy! Berlin); Accelerators/Incubators (Techstars Berlin, APX, Axel Springer Plug & Play, Startupbootcamp, EXIST); VCs (Point Nine, Earlybird, Cherry Ventures, Project A, La Famiglia, HV Capital, Atlantic Labs); Universities (TU Berlin, HU Berlin, FU Berlin, ESMT, Code University); Hubs (Silicon Allee, Berlin Partner, Startup Incubator HU); Services (sample lawyers, accountants, visa consultants); plus ~10 events and ~6 opportunities.

Loaded via a SQL migration insert.

### 6. Implementation order

1. Tokens + fonts + shared M3 components.
2. `__root.tsx` shell with top app bar, bottom nav (mobile) / nav rail (desktop), theme toggle.
3. Lovable Cloud enable + schema migration + seed inserts.
4. Discover route: map + segmented toggle + filter chips + feed cards (server fn reads `locations`).
5. Location detail + reviews (write requires auth).
6. Events + opportunities routes.
7. Auth (login, signup, profile) + onboarding wizard.
8. Network / founder directory + community submission form.
9. Polish: empty states, loading skeletons, SEO `head()` per route, accessibility pass.

### Technical notes

- Stack: TanStack Start, Lovable Cloud (Supabase under the hood), react-leaflet, Tailwind v4 with `@theme` tokens in `src/styles.css`.
- Reads via `createServerFn` + TanStack Query `ensureQueryData` in loaders.
- Writes (reviews, RSVPs, submissions) via `createServerFn` with `requireSupabaseAuth` middleware.
- Map markers use Leaflet `divIcon` so they pick up CSS tokens for purple/lime + dark mode.
- No Mapbox token required.

Ready to build on approval.
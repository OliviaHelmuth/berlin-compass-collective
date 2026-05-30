# Berlin Founder Atlas — Personalization & Open Calls

Turn the current directory into a personalized discovery + matching platform. Build in 4 phases so each ships value on its own.

## Phase 1 — Landing page rewrite

Rewrite `src/routes/index.tsx` to match the new narrative:

- **Hero**: "Welcome to Berlin's Startup Ecosystem" + subhead about WhatsApp/Slack pain + primary CTA `Start My Journey` → `/onboarding` (or `/login` if signed out).
- **How It Works** (3 steps): Tell us about yourself → Get personalized recs → Build connections.
- **Why We Exist**: knowledge trapped in private circles, we're the connective layer.
- **What you'll discover**: Map · Events · Opportunities · Open Calls (link cards).
- Keep brutalist purple/lime tokens; no new colors.

## Phase 2 — Tagging foundation + onboarding wizard

The whole recommendation engine depends on tags existing on both users and content. Do this first.

**Schema** (new migration):
- `profile_tags` extension on `profiles`: `role text`, `stage text`, `industries text[]`, `looking_for text[]`, `background text[]`, `onboarded_at timestamptz`.
- `locations.tags text[]`, `events.tags text[]`, `opportunities.tags text[]` (default `{}`, GIN indexes).
- Seed central tag catalogue in `src/lib/tags.ts` (roles, stages, industries grouped by theme, looking-for, backgrounds — exactly the lists from the spec).

**Onboarding wizard** at `/onboarding` (5 steps from spec): role → stage → industries (multi) → looking-for (multi) → background (multi). Progress bar, back/next, skippable last step. Saves via `saveOnboarding` server fn; redirects to `/` with a personalized feed. Auto-redirect new sign-ups here from `login.tsx`.

## Phase 3 — Recommendation engine + personalized feed

- `src/lib/recommend.ts`: pure scoring function `score(userTags, itemTags)` = weighted tag overlap (industry match 3, looking-for/category match 2, stage match 1) + recency bonus for events/opps.
- New server fn `getPersonalizedFeed` returns top events, opportunities, locations, open calls for the signed-in user.
- New `/feed` route (or replace `/` body when signed in) with sections: **For You — Events**, **For You — Opportunities**, **Spaces to check out**, **Open Calls matching your interests**. Falls back to "most recent" if user hasn't onboarded.
- Add "Edit interests" link → reopens wizard.

## Phase 4 — Organizations + Open Calls

**Organizations**: every existing location can become an org page. Add:
- `organizations` table (`id`, `location_id` nullable, `name`, `kind` (university/accelerator/vc/corporate/hub), `description`, `website`, `logo_url`, `tags text[]`, `owner_id`).
- One-to-many `open_calls`: `id`, `org_id`, `title`, `body`, `track` (e.g. "Research partner", "Pilot", "Funding"), `tags text[]`, `deadline`, `status` (open/closed), `created_at`.
- RLS: public read; owner/admin write. GRANTs for anon/authenticated/service_role per the public-schema rule.

**Routes**:
- `/orgs` — directory with tag filters.
- `/orgs/$id` — detail page (mirrors `/location/$id` layout: header, tabs for **About / Open Calls / Reviews / Discussion**).
- `/orgs/$id/manage` (owner only) — create/edit open calls.
- `/open-calls` — global feed of all open calls, filterable + personalized.

**Matching**: open calls flow into the personalized feed via the same scoring function.

## Out of scope for this plan

Co-founder matching DM, full org claim/verification flow, notifications, paid features. Easy to add after Phase 4 lands.

## Technical notes

- Server fns under `src/lib/*.functions.ts` using `requireSupabaseAuth` for mutations; reads via `supabaseAdmin` since data is public.
- Tags stored as `text[]` with GIN indexes — simple and good enough at this scale; can migrate to a normalized `tags` table later if needed.
- All new tables: `CREATE TABLE` → `GRANT` (anon select for public-read tables, authenticated CRUD where scoped, service_role all) → `ENABLE RLS` → policies, in one migration per table group.
- Reuse existing Material/brutalist tokens in `src/styles.css`; no new colors.
- Onboarding wizard is a single route with internal step state (no nested routes needed).

## Suggested order

1. Phase 1 landing (1 file) — quick win.
2. Phase 2 schema migration → wizard → `saveOnboarding` fn.
3. Phase 3 recommend.ts + feed route.
4. Phase 4 orgs + open calls (largest chunk).

Want me to start with Phase 1 + 2 in the first build pass, or all four in sequence?

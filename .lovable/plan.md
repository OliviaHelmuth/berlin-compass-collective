# Hackathon tracks vs. what we already have

You're closer than you think. Quick honest mapping:

| Track | Status in our app | Gap to close cheaply |
|---|---|---|
| **Hidden infrastructure / connective tissue** | ✅ Core of what we built — Ecosystem map, 153 locations, topic filters, peer reviews schema | Just needs **seeded reviews + comments** to look alive |
| **Fragmented market access** | 🟡 Events (56) + Opportunities (6) + DMs exist | Add a "needs/offers" tag on profiles, surface in matchmaking |
| **Admin/legal friction** | 🟡 Legal / Visa / Tax topic filters live on Ecosystem | Add a small **"Ask the Navigator" AI chat** scoped to Berlin admin (1 page, Lovable AI Gateway, free models) |
| **Private capital → founders** | 🟡 VC category + Opportunities | Add `opp_type = 'angel-intro'` seeds + "Get intro" button (sends DM) |
| **Research → startup** | ❌ Not built | Skip — out of scope for remaining credits |

So we credibly hit **3 of 5 tracks** with small additions.

## What I propose to build (ranked by impact / credit cost)

### 1. Fake-but-believable engagement layer (cheapest, biggest demo wow)
Seed via one migration — no new UI work:
- **120–200 reviews** across locations (rating, pros/cons, would_recommend, realistic comments) attributed to ~25 seeded profiles with avatars (DiceBear URLs, no storage cost)
- **40–60 location_posts** ("Just had my Anmeldung appointment booked here in 3 days 🙌", etc.)
- **15–25 extra profiles** with bios, sectors, interests so Members/Hub feels populated
- **RSVPs** sprinkled on events so they show "23 going"
- Surface aggregate rating + review count on Ecosystem cards and Location detail (small UI tweak)

### 2. "AI Matchmaking" (real, using Lovable AI Gateway — free, no key needed)
Repurpose the existing "Get matched" FAB into a real flow:
- User answers 3 quick prompts (or we read their profile)
- Server fn calls `google/gemini-2.5-flash` with the catalog of locations/opportunities/people as context
- Returns top 3 picks with a one-line "why this fits you" rationale
- Renders as a result card with links into Ecosystem / Opportunities / Members

This is genuinely useful AND demos AI. ~1 server fn + 1 result component.

### 3. "Berlin Navigator" mini AI chat (admin/legal track)
- New route `/navigator` — single-page chat
- System prompt loaded with Berlin founder admin facts (Anmeldung, GmbH, Blue Card, ESOP tax, Finanzamt)
- Streams answers from Lovable AI Gateway
- Suggests relevant Ecosystem providers inline ("→ See: 3 immigration lawyers on the map")

### 4. Small polish for demo credibility
- "Trending this week" strip on home (sorted by review count + recent posts)
- Activity ticker on Hub: "Maria reviewed Expatrio · 2h ago"
- Badge on locations with 5+ reviews: "Community favorite"

## What I'd skip
- Research-to-startup track (needs scraping universities + patent DBs — too heavy)
- Crowdfunding/citizen investing (regulated, not faking that)
- Real OAuth investor verification

## Recommended scope for remaining credits
**Do #1 + #2** (highest demo impact per credit). Add #3 only if credits allow. #4 takes 10 min and I'd bundle it with #1.

## Technical sketch
- 1 migration: seed profiles, reviews, posts, rsvps (idempotent, uses fixed UUIDs)
- 1 server fn `lib/matchmaking.functions.ts` → Lovable AI Gateway
- Update `LocationCard` + `location.$id.tsx` to show rating/review count
- Update existing "Get matched" sheet to call the new server fn and render results
- Optional: `src/routes/navigator.tsx` + nav entry

Want me to go ahead with **#1 + #2 + #4**, and hold #3 unless you say go?



## Changes to `src/routes/events.tsx`

- Remove the refresh button, the status message, and all "scraping" / "refresh from web" copy.
- Update the subhead to neutral language ("Upcoming events for Berlin founders").
- Update the empty state to a neutral "No events yet — check back soon."
- On mount, silently `POST /api/public/cron/scrape-events` in a `useEffect`, then invalidate the `events` and `feed` queries. No spinner, no toast.
- Throttle via `localStorage["events:lastSync"]`: only trigger if last sync was > 6 hours ago **or** the current event list is empty. Prevents burning Firecrawl credits on every navigation.
- Keep the existing loader / suspense query unchanged so the page still SSRs whatever is in the DB; the background refresh just updates it when new data arrives.

## No other files change

Server route and DB stay as they are.

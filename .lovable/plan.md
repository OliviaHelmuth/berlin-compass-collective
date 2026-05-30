## Add filters to the Events page

Purely a frontend change to `src/routes/events.tsx`. No schema, server, or scraper changes.

### Filter controls (rendered above the list)
- **Search input** — matches case-insensitive on title, description, venue, host.
- **Tag chips** — derived from the loaded events (unique `tags[]`, sorted by frequency, top ~12 shown, "show all" toggle if more). Click to toggle; multi-select with AND semantics. Active chips get a filled style.
- **Date filter** — segmented control with presets: `All upcoming` (default), `Today`, `This week`, `This weekend`, `This month`, plus a `Custom…` option that opens a shadcn date-range popover (`Calendar` in `range` mode inside a `Popover`).
- **Clear filters** button appears when any filter is active. Result count shown ("23 events").

### Behavior
- Filtering happens client-side via `useMemo` over the already-loaded `events` array — no refetch.
- Empty filtered state shows "No events match your filters." with a clear button.
- Existing auto-sync, suspense loader, and event card markup stay unchanged.

### Layout
- Filter bar sits between the page header and the event list, wrapped in a sticky-ish container with the same brutal border styling already used on the page (rounded-xl, border-2 border-outline, bg-surface).
- Tags use the existing tag chip style for visual consistency.
- On mobile (current 915px viewport is fine, but ensure <640px works) the search input is full width and filters wrap.

### Files
- Edit only `src/routes/events.tsx`.
- Reuse existing shadcn `Input`, `Button`, `Popover`, `Calendar`, `Badge` components (already in the project).

No backend, no migrations, no new dependencies.
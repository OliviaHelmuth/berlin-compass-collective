# Switch map provider: Leaflet → Google Maps

## Why
The current Leaflet/OSM map looks unpolished and has rendering bugs. Google Maps gives better tiles, smoother pan/zoom, familiar UX, and proper POI context for Berlin — and Lovable Cloud has a managed Google Maps connector so no API key setup is required from you.

## Changes

1. **Connect Google Maps Platform connector**
   - Link the managed connection → exposes `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` and tracking ID in the browser.

2. **Rewrite `src/components/atlas/AtlasMap.tsx`**
   - Remove `react-leaflet` / `leaflet` usage.
   - Load Maps JS API async with `loading=async&callback=initMap` using the browser key.
   - Render `google.maps.Map` centered on Berlin (52.52, 13.405), zoom 12.
   - Use `google.maps.Marker` (not AdvancedMarkerElement — no `mapId`) with custom SVG icons colored per category (purple base, lime ring for active).
   - Click marker → open styled `InfoWindow` + sync selection with the feed pane.
   - Custom map style JSON tuned to the brutalist purple/neutral theme (muted roads, dark labels in dark mode, light in light mode); reapply on theme change.

3. **Remove Leaflet deps & CSS**
   - Drop `leaflet` + `react-leaflet` from package.json.
   - Remove leaflet CSS import.

4. **Keep existing data flow**
   - `AtlasMap` still consumes the same `locations` prop and `onSelect` callback — no changes to `index.tsx`, server functions, or DB.

## Technical notes
- Use only Maps JavaScript API in the browser (managed key is referrer-restricted to `*.lovable.app`); no geocoding/Places calls needed for this change.
- Single global `initMap` callback guarded against double-load (HMR-safe).
- Cleanup markers on locations change to avoid leaks.

## Out of scope
- No changes to Events, Opportunities, Auth, or seed data.
- Not adding Places search/autocomplete yet (can follow up).

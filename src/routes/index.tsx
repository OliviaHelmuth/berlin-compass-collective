import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, lazy, Suspense } from "react";
import { getLocations } from "@/lib/atlas.functions";
import { CATEGORIES, CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";
import { FilterChip } from "@/components/atlas/FilterChip";

const AtlasMap = lazy(() => import("@/components/atlas/AtlasMap").then((m) => ({ default: m.AtlasMap })));

const locationsQuery = queryOptions({
  queryKey: ["locations"],
  queryFn: () => getLocations(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Discover — Berlin Founder Atlas" },
      { name: "description", content: "Interactive map of Berlin's startup ecosystem: coworking, accelerators, VCs, universities, hubs and services." },
      { property: "og:title", content: "Discover Berlin's startup ecosystem" },
      { property: "og:description", content: "Map and feed of the people, places and capital that move Berlin." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: Discover,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load locations: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function Discover() {
  const { data: locations } = useSuspenseQuery(locationsQuery);
  const [active, setActive] = useState<Set<LocationCategory>>(new Set());
  const [view, setView] = useState<"feed" | "map">("feed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return locations.filter((l) => {
      if (active.size > 0 && !active.has(l.category as LocationCategory)) return false;
      if (query && !l.name.toLowerCase().includes(query.toLowerCase()) && !(l.district ?? "").toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [locations, active, query]);

  const toggle = (id: LocationCategory) => {
    const next = new Set(active);
    next.has(id) ? next.delete(id) : next.add(id);
    setActive(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Search + segmented */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 flex items-center bg-surface-container-high rounded-full px-4 h-12 border-2 border-outline/10">
          <span className="material-symbols-rounded text-muted-foreground" style={{ fontSize: 20 }}>search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Mitte, Kreuzberg, Factory…"
            className="flex-1 bg-transparent outline-none ml-3 text-sm placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex p-1 bg-surface-container rounded-lg border-2 border-outline self-stretch md:self-auto">
          <button
            onClick={() => setView("feed")}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === "feed" ? "bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground"
            }`}
          >
            List Feed
          </button>
          <button
            onClick={() => setView("map")}
            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              view === "map" ? "bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground"
            }`}
          >
            Map View
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.id}
            label={c.label}
            icon={c.icon}
            active={active.has(c.id)}
            onClick={() => toggle(c.id)}
          />
        ))}
      </div>

      {/* Map preview / list */}
      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* Map */}
        <div className={`${view === "feed" ? "hidden lg:block" : ""} h-[60vh] lg:h-[calc(100vh-260px)] rounded-2xl border-2 border-outline overflow-hidden bg-surface-container`}>
          <Suspense fallback={<div className="h-full grid place-items-center text-xs text-muted-foreground">Loading map…</div>}>
            <AtlasMap
              locations={filtered as never}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Suspense>
        </div>

        {/* Feed */}
        <div className={`${view === "map" ? "hidden lg:block" : ""} space-y-3 lg:max-h-[calc(100vh-260px)] lg:overflow-y-auto pr-1`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl">Ecosystem Feed</h2>
            <span className="text-xs text-muted-foreground font-medium">{filtered.length} places</span>
          </div>
          {filtered.length === 0 && (
            <div className="p-6 text-center rounded-2xl border-2 border-dashed border-outline/30 text-sm text-muted-foreground">
              No matches. Clear filters or try another search.
            </div>
          )}
          {filtered.map((loc, idx) => (
            <Link
              key={loc.id}
              to="/location/$id"
              params={{ id: loc.id }}
              onMouseEnter={() => setSelectedId(loc.id)}
              className={`block p-4 rounded-xl border-2 transition-all ${
                idx === 0
                  ? "bg-surface-container border-outline shadow-brutal"
                  : "bg-surface border-outline/40 hover:border-outline hover:shadow-brutal-sm"
              }`}
            >
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">
                    {CATEGORY_LABEL[loc.category as LocationCategory]}
                  </span>
                  <h3 className="font-display font-semibold text-base leading-tight">{loc.name}</h3>
                </div>
                {idx === 0 && (
                  <span className="bg-accent text-accent-foreground px-2 py-0.5 rounded text-[10px] font-bold ring-2 ring-outline shrink-0">
                    TOP
                  </span>
                )}
              </div>
              {loc.description && (
                <p className="text-sm text-muted-foreground leading-snug line-clamp-2 mb-3">{loc.description}</p>
              )}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>place</span>
                  {loc.district ?? "Berlin"}
                </span>
                {loc.website && (
                  <a
                    href={loc.website}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                    Website
                  </a>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Extended FAB */}
      <Link
        to="/login"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 flex items-center gap-2 bg-accent text-accent-foreground px-5 py-3.5 rounded-2xl border-2 border-outline shadow-lime font-semibold text-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>auto_awesome</span>
        Get matched
      </Link>
    </div>
  );
}

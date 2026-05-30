import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { getLocations } from "@/lib/atlas.functions";
import { CATEGORIES, CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";
import { FilterChip } from "@/components/atlas/FilterChip";

const AtlasMap = lazy(() => import("@/components/atlas/AtlasMap").then((m) => ({ default: m.AtlasMap })));

const locationsQuery = queryOptions({
  queryKey: ["locations"],
  queryFn: () => getLocations(),
});

const VALID_CATS: LocationCategory[] = ["coworking", "accelerator", "incubator", "university", "vc", "hub", "service"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kiez Founders Berlin — your map to the ecosystem" },
      { name: "description", content: "Find coworking, accelerators, VCs, universities, events and open opportunities across Berlin's startup ecosystem." },
      { property: "og:title", content: "Kiez Founders Berlin" },
      { property: "og:description", content: "The connective layer for Berlin's startup ecosystem — places, events, opportunities, people." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { cat?: LocationCategory } => {
    const cat = search.cat;
    return typeof cat === "string" && (VALID_CATS as string[]).includes(cat)
      ? { cat: cat as LocationCategory }
      : {};
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(locationsQuery),
  component: Home,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function Home() {
  return (
    <div>
      <Hero />
      <Discover />
      <HowItWorks />
    </div>
  );
}

function Hero() {
  return (
    <section className="border-b-2 border-outline bg-surface-container">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>bolt</span>
            Berlin's startup ecosystem
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-5 leading-[1.05] tracking-tight">
            Stop searching<br />WhatsApp groups.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Discover the people, places, opportunities and knowledge that can accelerate your founder journey — coworking, accelerators, mentors, research partners and capital, all on one map.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm border-2 border-outline shadow-brutal hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>auto_awesome</span>
              Start my journey
            </Link>
            <a
              href="#discover"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-surface text-foreground font-semibold text-sm border-2 border-outline"
            >
              Browse the map
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { icon: "groups", label: "Co-working", to: "/" as const, hash: "discover" },
            { icon: "rocket_launch", label: "Accelerators", to: "/" as const, hash: "discover" },
            { icon: "school", label: "Universities", to: "/" as const, hash: "discover" },
            { icon: "payments", label: "VCs", to: "/" as const, hash: "discover" },
            { icon: "event", label: "Events", to: "/events" as const },
            { icon: "bolt", label: "Opportunities", to: "/opportunities" as const },
          ] as const).map((c, i) => (
            <Link
              key={c.label}
              to={c.to}
              hash={"hash" in c ? c.hash : undefined}
              className={`p-4 rounded-2xl border-2 border-outline ${i % 3 === 0 ? "bg-accent text-accent-foreground" : "bg-surface"} shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal transition-transform`}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 28 }}>{c.icon}</span>
              <div className="mt-2 font-display font-bold text-sm">{c.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Tell us about you", d: "Share your role, stage, industries and what you're looking for. Takes a minute." },
    { n: "02", t: "Get matched", d: "We surface the events, accelerators, research partners, VCs and spaces that fit you." },
    { n: "03", t: "Build connections", d: "Reach out, RSVP, apply to open calls and plug into the communities that move Berlin." },
  ];
  return (
    <section className="border-t-2 border-outline bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="font-display text-3xl md:text-4xl font-bold">How it works</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">Berlin has everything founders need. The problem is finding it. We're the connective layer that makes the ecosystem accessible.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="p-6 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal-sm">
              <span className="text-[10px] font-bold tracking-widest text-primary">STEP {s.n}</span>
              <h3 className="mt-2 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-accent-foreground font-semibold text-sm border-2 border-outline shadow-lime"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_forward</span>
            Start my journey
          </Link>
        </div>
      </div>
    </section>
  );
}


function Discover() {
  const { data: locations } = useSuspenseQuery(locationsQuery);

  const [active, setActive] = useState<Set<LocationCategory>>(() => new Set());
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
    <div id="discover" className="max-w-7xl mx-auto px-4 py-6 space-y-4">
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

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <div className={`${view === "feed" ? "hidden lg:block" : ""} h-[60vh] lg:h-[calc(100vh-260px)] rounded-2xl border-2 border-outline overflow-hidden bg-surface-container`}>
          <Suspense fallback={<div className="h-full grid place-items-center text-xs text-muted-foreground">Loading map…</div>}>
            <AtlasMap
              locations={filtered as never}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Suspense>
        </div>

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
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(loc.website!, "_blank", "noreferrer");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(loc.website!, "_blank", "noreferrer");
                      }
                    }}
                    className="flex items-center gap-1 hover:text-primary cursor-pointer"
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>open_in_new</span>
                    Website
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Link
        to="/onboarding"
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30 flex items-center gap-2 bg-accent text-accent-foreground px-5 py-3.5 rounded-2xl border-2 border-outline shadow-lime font-semibold text-sm active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 20 }}>auto_awesome</span>
        Get matched
      </Link>
    </div>
  );
}

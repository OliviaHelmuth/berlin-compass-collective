import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { getOpportunities } from "@/lib/atlas.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const oppsQuery = queryOptions({ queryKey: ["opportunities"], queryFn: () => getOpportunities() });

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Kiez Founders Berlin" },
      { name: "description", content: "Accelerators, incubators, grants, office hours and co-founder searches in Berlin." },
      { property: "og:title", content: "Berlin startup opportunities" },
      { property: "og:description", content: "Programs, open calls, grants, and office hours for Berlin founders." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(oppsQuery),
  component: OppsPage,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load opportunities: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type Tab = "programs" | "opps";

function OppsPage() {
  const { data } = useSuspenseQuery(oppsQuery);
  const opps = data.opportunities;
  const programs = data.programs;

  const [tab, setTab] = useState<Tab>("programs");
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    const oppMatch = hash.match(/^#opp-(.+)$/);
    if (!oppMatch) return;
    const id = oppMatch[1];
    setFocusId(id);
    // Switch to the right tab based on which list contains the id
    if (opps.some((o) => o.id === id)) setTab("opps");
    else if (programs.some((p) => p.id === id)) setTab("programs");
    requestAnimationFrame(() => {
      document.getElementById(`opp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [opps, programs]);

  // Build tag universe from the active tab
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    const src = tab === "programs" ? programs.map((p) => p.tags ?? []) : opps.map((o) => o.tags ?? []);
    for (const arr of src) for (const t of arr) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t).slice(0, 20);
  }, [tab, programs, opps]);

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programs.filter((p) => {
      if (q) {
        const hay = `${p.name} ${p.description ?? ""} ${p.district ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeTags.length > 0) {
        const tags = p.tags ?? [];
        if (!activeTags.every((t) => tags.includes(t))) return false;
      }
      return true;
    });
  }, [programs, query, activeTags]);

  const filteredOpps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return opps.filter((o) => {
      if (q) {
        const hay = `${o.title} ${o.org ?? ""} ${o.description ?? ""} ${(o.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeTags.length > 0) {
        const tags = o.tags ?? [];
        if (!activeTags.every((t) => tags.includes(t))) return false;
      }
      return true;
    });
  }, [opps, query, activeTags]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const clearAll = () => { setQuery(""); setActiveTags([]); };
  const hasFilters = query !== "" || activeTags.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Opportunities</h1>
        <p className="text-muted-foreground mt-2">Programs, open calls, grants and office hours for Berlin founders.</p>
      </header>

      <div className="flex p-1 bg-surface-container rounded-lg border-2 border-outline w-fit">
        <button
          onClick={() => { setTab("programs"); setActiveTags([]); }}
          className={cn(
            "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
            tab === "programs" ? "bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground",
          )}
        >
          Programs ({programs.length})
        </button>
        <button
          onClick={() => { setTab("opps"); setActiveTags([]); }}
          className={cn(
            "px-4 py-1.5 text-xs font-semibold rounded-md transition-all",
            tab === "opps" ? "bg-accent text-accent-foreground shadow-brutal-sm" : "text-muted-foreground",
          )}
        >
          Open calls ({opps.length})
        </button>
      </div>

      <div className="rounded-xl border-2 border-outline bg-surface p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === "programs" ? "Search programs by name, focus, district…" : "Search opportunities…"}
            className="pl-9"
          />
        </div>
        {topTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topTags.map((t) => {
              const active = activeTags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                    active ? "bg-primary text-on-primary border-primary" : "bg-surface-container border-outline/30 hover:border-outline",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {tab === "programs" ? filteredPrograms.length : filteredOpps.length} results
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              <X className="size-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {tab === "programs" && (
        <div className="space-y-3">
          {filteredPrograms.length === 0 && (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-outline/30">
              <p className="text-sm text-muted-foreground">No programs match your filters.</p>
            </div>
          )}
          {filteredPrograms.map((p) => (
            <Link
              key={p.id}
              id={`opp-${p.id}`}
              to="/location/$id"
              params={{ id: p.id }}
              className={cn(
                "block p-5 rounded-xl border-2 border-outline bg-surface hover:bg-surface-container hover:shadow-brutal-sm transition-all",
                focusId === p.id && "ring-4 ring-primary/60 shadow-brutal",
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  {p.category === "incubator" ? "egg" : "rocket_launch"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{p.category}</span>
                {p.district && <span className="text-[10px] text-muted-foreground">· {p.district}</span>}
              </div>
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              {p.description && <p className="text-sm mt-2 line-clamp-2">{p.description}</p>}
              {Array.isArray(p.tags) && p.tags.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {p.tags.slice(0, 6).map((t) => (
                    <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container border border-outline/30">{t}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {tab === "opps" && (
        <div className="space-y-4">
          {filteredOpps.length === 0 && (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-outline/30">
              <p className="text-sm text-muted-foreground">No open calls match your filters.</p>
            </div>
          )}
          {filteredOpps.map((o, i) => (
            <div
              key={o.id}
              className={`p-5 rounded-2xl border-2 border-outline ${
                i === 0 ? "bg-primary text-primary-foreground shadow-lime" : "bg-surface-container shadow-brutal-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                  {o.opp_type === "grant" ? "redeem" : o.opp_type === "cofounder" ? "diversity_3" : o.opp_type === "office_hours" ? "schedule" : "rocket_launch"}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest">{o.opp_type.replace("_", " ")}</span>
              </div>
              <h3 className="font-display text-lg font-semibold">{o.title}</h3>
              {o.org && <p className={`text-xs mt-0.5 ${i === 0 ? "opacity-80" : "text-muted-foreground"}`}>{o.org}</p>}
              {o.description && <p className={`text-sm mt-2 ${i === 0 ? "opacity-90" : ""}`}>{o.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs font-medium ${i === 0 ? "opacity-80" : "text-muted-foreground"}`}>
                  {o.deadline ? `Deadline ${new Date(o.deadline).toLocaleDateString("en", { day: "numeric", month: "short" })}` : "Rolling"}
                </span>
                {o.url && (
                  <a
                    href={o.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 ${
                      i === 0 ? "bg-primary-foreground text-primary border-primary-foreground" : "bg-accent text-accent-foreground border-outline"
                    }`}
                  >
                    Apply
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

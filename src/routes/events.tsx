import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { getEvents } from "@/lib/atlas.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const eventsQuery = queryOptions({ queryKey: ["events"], queryFn: () => getEvents() });

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events — Berlin Founder Atlas" },
      { name: "description", content: "Upcoming startup events, meetups and pitch nights in Berlin." },
      { property: "og:title", content: "Berlin startup events" },
      { property: "og:description", content: "Curated events for Berlin founders." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(eventsQuery),
  component: EventsPage,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load events: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

const SYNC_KEY = "events:lastSync";
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h

type DatePreset = "all" | "today" | "week" | "weekend" | "month" | "custom";

const PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "weekend", label: "Weekend" },
  { value: "month", label: "This month" },
];

function presetRange(preset: DatePreset): { from?: Date; to?: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset === "today") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { from: start, to: end };
  }
  if (preset === "week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { from: start, to: end };
  }
  if (preset === "weekend") {
    // upcoming Sat 00:00 -> Mon 00:00
    const day = start.getDay(); // 0 Sun .. 6 Sat
    const daysUntilSat = (6 - day + 7) % 7;
    const sat = new Date(start);
    sat.setDate(sat.getDate() + daysUntilSat);
    const mon = new Date(sat);
    mon.setDate(mon.getDate() + 2);
    return { from: sat, to: mon };
  }
  if (preset === "month") {
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { from: start, to: end };
  }
  return {};
}

function EventsPage() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const qc = useQueryClient();
  const triggered = useRef(false);

  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    if (typeof window === "undefined") return;

    const last = Number(window.localStorage.getItem(SYNC_KEY) ?? 0);
    const stale = Date.now() - last > SYNC_INTERVAL_MS;
    if (!stale && events.length > 0) return;

    (async () => {
      try {
        const res = await fetch("/api/public/cron/scrape-events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: "{}",
        });
        if (!res.ok) return;
        window.localStorage.setItem(SYNC_KEY, String(Date.now()));
        await qc.invalidateQueries({ queryKey: ["events"] });
        await qc.invalidateQueries({ queryKey: ["feed"] });
      } catch {
        // silent
      }
    })();
  }, [events.length, qc]);

  // Top tags by frequency
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (!Array.isArray(e.tags)) continue;
      for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [events]);

  const visibleTags = showAllTags ? topTags : topTags.slice(0, 12);

  const dateRange = preset === "custom" ? customRange : presetRange(preset);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateRange?.from?.getTime();
    const to = dateRange?.to?.getTime();
    return events.filter((e) => {
      if (q) {
        const hay = `${e.title ?? ""} ${e.description ?? ""} ${e.venue ?? ""} ${e.host ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeTags.length > 0) {
        const tags = Array.isArray(e.tags) ? e.tags : [];
        if (!activeTags.every((t) => tags.includes(t))) return false;
      }
      if (from || to) {
        const ts = new Date(e.starts_at).getTime();
        if (from && ts < from) return false;
        if (to && ts >= to) return false;
      }
      return true;
    });
  }, [events, query, activeTags, dateRange?.from, dateRange?.to]);

  const toggleTag = (t: string) =>
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const hasFilters = query !== "" || activeTags.length > 0 || preset !== "all";
  const clearAll = () => {
    setQuery("");
    setActiveTags([]);
    setPreset("all");
    setCustomRange(undefined);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-2">Upcoming events for Berlin founders.</p>
      </header>

      {/* Filters */}
      <div className="rounded-xl border-2 border-outline bg-surface p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, venue, host…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={cn(
                "text-xs font-medium px-3 py-1.5 rounded-full border-2 border-outline transition-colors",
                preset === p.value
                  ? "bg-primary text-on-primary"
                  : "bg-surface hover:bg-surface-container",
              )}
            >
              {p.label}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <button
                onClick={() => setPreset("custom")}
                className={cn(
                  "text-xs font-medium px-3 py-1.5 rounded-full border-2 border-outline transition-colors inline-flex items-center gap-1.5",
                  preset === "custom"
                    ? "bg-primary text-on-primary"
                    : "bg-surface hover:bg-surface-container",
                )}
              >
                <CalendarIcon className="size-3" />
                {preset === "custom" && customRange?.from
                  ? `${customRange.from.toLocaleDateString()}${customRange.to ? ` – ${customRange.to.toLocaleDateString()}` : ""}`
                  : "Custom"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={(r) => {
                  setCustomRange(r);
                  setPreset("custom");
                }}
                numberOfMonths={1}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {topTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((t) => {
              const active = activeTags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors",
                    active
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container border-outline/30 hover:border-outline",
                  )}
                >
                  {t}
                </button>
              );
            })}
            {topTags.length > 12 && (
              <button
                onClick={() => setShowAllTags((v) => !v)}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-dashed border-outline/50 text-muted-foreground hover:text-foreground"
              >
                {showAllTags ? "Show less" : `+${topTags.length - 12} more`}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              <X className="size-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {events.length === 0 && (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-outline/30">
            <p className="text-sm text-muted-foreground">No events yet — check back soon.</p>
          </div>
        )}
        {events.length > 0 && filtered.length === 0 && (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-outline/30 space-y-3">
            <p className="text-sm text-muted-foreground">No events match your filters.</p>
            <Button variant="outline" size="sm" onClick={clearAll}>Clear filters</Button>
          </div>
        )}
        {filtered.map((e) => {
          const d = new Date(e.starts_at);
          return (
            <a
              key={e.id}
              href={e.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="block p-5 rounded-xl border-2 border-outline bg-surface hover:bg-surface-container hover:shadow-brutal-sm transition-all"
            >
              <div className="flex gap-4 items-start">
                <div className="size-14 shrink-0 rounded-lg bg-primary-container text-on-primary-container border-2 border-outline grid place-items-center font-display">
                  <span className="text-[10px] font-bold uppercase">{d.toLocaleString("en", { month: "short" })}</span>
                  <span className="text-lg font-bold leading-none -mt-0.5">{d.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold">{e.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {e.venue ?? "Berlin"}{e.district ? ` · ${e.district}` : ""} · {d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {e.description && <p className="text-sm mt-2 line-clamp-2">{e.description}</p>}
                  {Array.isArray(e.tags) && e.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {e.tags.slice(0, 5).map((t) => (
                        <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container border border-outline/30">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

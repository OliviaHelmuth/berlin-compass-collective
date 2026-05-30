import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getEvents } from "@/lib/atlas.functions";

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

function EventsPage() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const qc = useQueryClient();
  const triggered = useRef(false);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-2">Upcoming events for Berlin founders.</p>
      </header>

      <div className="space-y-3">
        {events.length === 0 && (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-outline/30">
            <p className="text-sm text-muted-foreground">No events yet — check back soon.</p>
          </div>
        )}
        {events.map((e) => {
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

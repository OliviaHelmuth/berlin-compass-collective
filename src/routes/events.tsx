import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
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

function EventsPage() {
  const { data: events } = useSuspenseQuery(eventsQuery);
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    setMsg("Scraping fresh events from Lu.ma + Silicon Allee…");
    try {
      const res = await fetch("/api/public/cron/scrape-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: "{}",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setMsg(`Done — ${json.totalUpserted ?? 0} events imported.`);
      await qc.invalidateQueries({ queryKey: ["events"] });
      await qc.invalidateQueries({ queryKey: ["feed"] });
    } catch (e) {
      setMsg(`Failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-2">Real upcoming events scraped from Berlin's startup calendar.</p>
        </div>
        <button
          onClick={refresh}
          disabled={busy}
          className="h-10 px-4 rounded-full bg-accent text-accent-foreground font-semibold text-sm border-2 border-outline shadow-brutal-sm disabled:opacity-60 flex items-center gap-2"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{busy ? "hourglass_top" : "refresh"}</span>
          {busy ? "Scraping…" : "Refresh from web"}
        </button>
      </header>

      {msg && (
        <div className="p-3 rounded-lg bg-surface-container border-2 border-outline/40 text-sm">{msg}</div>
      )}

      <div className="space-y-3">
        {events.length === 0 && (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-outline/30">
            <p className="text-sm text-muted-foreground">No events yet. Hit "Refresh from web" to pull in real Berlin events.</p>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold">{e.title}</h3>
                    {(e as { source?: string }).source && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-outline/30 px-1.5 py-0.5 rounded">
                        {(e as { source?: string }).source}
                      </span>
                    )}
                  </div>
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

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
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
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mt-2">What's happening in Berlin's startup scene this month.</p>
      </header>
      <div className="space-y-3">
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
                    {e.venue ?? "Berlin"} · {e.district ?? ""} · {d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {e.description && <p className="text-sm mt-2 line-clamp-2">{e.description}</p>}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

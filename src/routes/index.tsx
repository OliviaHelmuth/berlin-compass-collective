import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getEvents, getOpportunities, getLocations } from "@/lib/atlas.functions";
import { CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";

const eventsQuery = queryOptions({ queryKey: ["events"], queryFn: () => getEvents() });
const oppsQuery = queryOptions({ queryKey: ["opportunities"], queryFn: () => getOpportunities() });
const locationsQuery = queryOptions({ queryKey: ["locations"], queryFn: () => getLocations() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kiez Founders Berlin — your map to the ecosystem" },
      { name: "description", content: "Find coworking, accelerators, VCs, universities, events and open opportunities across Berlin's startup ecosystem." },
      { property: "og:title", content: "Kiez Founders Berlin" },
      { property: "og:description", content: "The connective layer for Berlin's startup ecosystem — places, events, opportunities, people." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(eventsQuery),
      context.queryClient.ensureQueryData(oppsQuery),
      context.queryClient.ensureQueryData(locationsQuery),
    ]),
  component: Home,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function Home() {
  return (
    <div>
      <Hero />
      <HappeningNow />
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
            <Link
              to="/ecosystem"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-surface text-foreground font-semibold text-sm border-2 border-outline"
            >
              Browse the map
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { icon: "groups", label: "Co-working", cat: "coworking" as const },
            { icon: "rocket_launch", label: "Accelerators", cat: "accelerator" as const },
            { icon: "school", label: "Universities", cat: "university" as const },
            { icon: "payments", label: "VCs", cat: "vc" as const },
            { icon: "event", label: "Events", to: "/events" as const },
            { icon: "bolt", label: "Opportunities", to: "/opportunities" as const },
          ] as const).map((c, i) => {
            const className = `p-4 rounded-2xl border-2 border-outline ${i % 3 === 0 ? "bg-accent text-accent-foreground" : "bg-surface"} shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-brutal transition-transform`;
            const inner = (
              <>
                <span className="material-symbols-rounded" style={{ fontSize: 28 }}>{c.icon}</span>
                <div className="mt-2 font-display font-bold text-sm">{c.label}</div>
              </>
            );
            return "cat" in c ? (
              <Link key={c.label} to="/ecosystem" search={{ cat: c.cat }} className={className}>
                {inner}
              </Link>
            ) : (
              <Link key={c.label} to={c.to} className={className}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HappeningNow() {
  const { data: eventsData } = useSuspenseQuery(eventsQuery);
  const { data: oppsData } = useSuspenseQuery(oppsQuery);
  const { data: locations } = useSuspenseQuery(locationsQuery);

  const upcomingEvents = eventsData.events.slice(0, 3);
  const openOpps = oppsData.opportunities.slice(0, 3);
  const newPlaces = locations.slice(-3).reverse();

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <section className="border-b-2 border-outline bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Happening now</h2>
            <p className="text-sm text-muted-foreground mt-1">Fresh from across the ecosystem.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Events */}
          <Link
            to="/events"
            className="block p-5 rounded-2xl border-2 border-outline bg-surface-container shadow-brutal-sm hover:shadow-brutal transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>event</span>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide">Upcoming events</h3>
            </div>
            <ul className="space-y-2">
              {upcomingEvents.length === 0 && (
                <li className="text-xs text-muted-foreground">Nothing scheduled.</li>
              )}
              {upcomingEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="text-[10px] font-bold text-primary block">{fmtDate(e.starts_at)}</span>
                  <span className="line-clamp-1 font-medium">{e.title}</span>
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary">
              See all <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span>
            </span>
          </Link>

          {/* Opportunities */}
          <Link
            to="/opportunities"
            className="block p-5 rounded-2xl border-2 border-outline bg-accent text-accent-foreground shadow-brutal-sm hover:shadow-brutal transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>bolt</span>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide">Open opportunities</h3>
            </div>
            <ul className="space-y-2">
              {openOpps.length === 0 && (
                <li className="text-xs opacity-70">No open calls right now.</li>
              )}
              {openOpps.map((o) => (
                <li key={o.id} className="text-sm">
                  <span className="line-clamp-2 font-medium">{o.title}</span>
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold">
              See all <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span>
            </span>
          </Link>

          {/* New places */}
          <Link
            to="/ecosystem"
            className="block p-5 rounded-2xl border-2 border-outline bg-surface-container shadow-brutal-sm hover:shadow-brutal transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>map</span>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide">New in the ecosystem</h3>
            </div>
            <ul className="space-y-2">
              {newPlaces.map((l) => (
                <li key={l.id} className="text-sm">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    {CATEGORY_LABEL[l.category as LocationCategory] ?? l.category}
                  </span>
                  <span className="line-clamp-1 font-medium">{l.name}</span>
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary">
              Browse all <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span>
            </span>
          </Link>
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

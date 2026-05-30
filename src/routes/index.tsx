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
      { title: "Kiez Founders Berlin — your shortcut into the startup scene" },
      { name: "description", content: "AI concierge + curated map of Berlin's startup ecosystem. Find coworking, accelerators, VCs, legal help, German classes, events and open calls — in 10 seconds." },
      { property: "og:title", content: "Kiez Founders Berlin" },
      { property: "og:description", content: "Your shortcut into Berlin's startup scene. Matched by AI, validated by founders." },
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
      <StuckGrid />
      <AiTeaser />
      <HappeningNow />
      <CommunityProof />
      <HowItWorks />
      <FinalCta />
    </div>
  );
}

function Hero() {
  const { data: eventsData } = useSuspenseQuery(eventsQuery);
  const { data: oppsData } = useSuspenseQuery(oppsQuery);
  const { data: locations } = useSuspenseQuery(locationsQuery);

  const stats = [
    { n: locations.length, l: "places mapped" },
    { n: eventsData.events.length, l: "events" },
    { n: oppsData.opportunities.length, l: "open calls" },
    { n: "10s", l: "to your match" },
  ];

  return (
    <section className="relative border-b-2 border-outline bg-surface-container overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 py-14 md:py-24 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
            <span className="material-symbols-rounded animate-pulse" style={{ fontSize: 14 }}>bolt</span>
            Built for new founders in Berlin
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold mt-5 leading-[1.02] tracking-tight">
            Berlin's startup scene,<br />
            <span className="bg-primary text-primary-foreground px-2 inline-block -rotate-1 mt-1">finally in one place.</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed">
            Skip the WhatsApp groups and 12 open tabs. Our AI concierge reads the entire ecosystem and tells you
            <span className="text-foreground font-semibold"> exactly where to go </span>
            for coworking, visas, accelerators, German classes, capital and your people.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/match"
              className="group relative inline-flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm border-2 border-outline shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal-lg transition-all"
            >
              <span className="material-symbols-rounded group-hover:rotate-12 transition-transform" style={{ fontSize: 18 }}>auto_awesome</span>
              Match me with my Berlin
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground border border-outline">FREE</span>
            </Link>
            <Link
              to="/ecosystem"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-surface text-foreground font-semibold text-sm border-2 border-outline hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>map</span>
              Explore the map
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-4 gap-3 max-w-md">
            {stats.map((s) => (
              <div key={s.l} className="text-left">
                <div className="font-display text-2xl md:text-3xl font-bold leading-none">{s.n}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 leading-tight">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {([
            { icon: "groups", label: "Co-working", cat: "coworking" as const },
            { icon: "rocket_launch", label: "Accelerators", cat: "accelerator" as const },
            { icon: "school", label: "Universities", cat: "university" as const },
            { icon: "payments", label: "VCs & Angels", cat: "vc" as const },
            { icon: "event", label: "Events", to: "/events" as const },
            { icon: "bolt", label: "Open calls", to: "/opportunities" as const },
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

function StuckGrid() {
  const items = [
    { icon: "desk", q: "Need a desk in Kreuzberg this week", to: "/ecosystem", search: { cat: "coworking" as const }, color: "bg-surface-container" },
    { icon: "gavel", q: "Lost in Anmeldung, visa & Steuer", to: "/ecosystem", color: "bg-accent text-accent-foreground" },
    { icon: "rocket_launch", q: "Want an accelerator that takes me", to: "/ecosystem", search: { cat: "accelerator" as const }, color: "bg-surface-container" },
    { icon: "translate", q: "My German is… not yet", to: "/ecosystem", color: "bg-surface-container" },
    { icon: "payments", q: "Need intros to angels & VCs", to: "/opportunities", color: "bg-accent text-accent-foreground" },
    { icon: "diversity_3", q: "Just need to find my people", to: "/match", color: "bg-surface-container" },
  ];
  return (
    <section className="border-b-2 border-outline bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Stuck on…</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Pick the thing keeping you up at night.</h2>
          <p className="mt-3 text-muted-foreground">Every founder in Berlin hits these walls. One click takes you to the people who already solved them.</p>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((it) => {
            const cls = `group p-5 rounded-2xl border-2 border-outline ${it.color} shadow-brutal-sm hover:shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex items-start gap-3`;
            const inner = (
              <>
                <span className="material-symbols-rounded shrink-0" style={{ fontSize: 28 }}>{it.icon}</span>
                <div className="flex-1">
                  <div className="font-display font-bold text-base leading-snug">{it.q}</div>
                  <div className="mt-2 text-xs font-semibold inline-flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    Show me the way
                    <span className="material-symbols-rounded group-hover:translate-x-0.5 transition-transform" style={{ fontSize: 14 }}>arrow_forward</span>
                  </div>
                </div>
              </>
            );
            return "search" in it && it.search ? (
              <Link key={it.q} to={it.to} search={it.search} className={cls}>{inner}</Link>
            ) : (
              <Link key={it.q} to={it.to} className={cls}>{inner}</Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AiTeaser() {
  return (
    <section className="border-b-2 border-outline bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>auto_awesome</span>
            AI Matchmaker
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mt-4 leading-tight">
            Tell us where you're stuck. Get 5 spot-on matches.
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-base leading-relaxed max-w-md">
            Our concierge reads our entire database of places, events and open calls — then picks the ones built for your exact situation. No login. Takes 10 seconds.
          </p>
          <Link
            to="/match"
            className="mt-6 inline-flex items-center gap-2 h-12 px-6 rounded-full bg-accent text-accent-foreground font-semibold text-sm border-2 border-outline shadow-brutal-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal transition-all"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>arrow_forward</span>
            Try it now — free
          </Link>
        </div>
        <div className="p-5 rounded-2xl bg-surface text-foreground border-2 border-outline shadow-brutal space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">You ask</div>
          <div className="p-3 rounded-xl bg-surface-container border-2 border-outline/40 text-sm">
            "Solo technical founder, climate tech, just moved from Lisbon. Need coworking in Kreuzberg, climate community, and help with my Blue Card."
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">AI replies in 10s</div>
          <ul className="space-y-2">
            {[
              { k: "PLACE", t: "Greentech Hub Kreuzberg", w: "Climate-only coworking, 4-min walk from U-Bhf Schlesisches Tor." },
              { k: "EVENT", t: "Berlin Climate Founders Drinks", w: "Next Thursday — exactly your crowd." },
              { k: "HELP", t: "Expath visa consultancy", w: "English-speaking, handles Blue Card end-to-end." },
            ].map((p) => (
              <li key={p.t} className="p-3 rounded-xl border-2 border-outline bg-surface-container">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{p.k}</span>
                <div className="font-display font-bold text-sm mt-0.5">{p.t}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.w}</div>
              </li>
            ))}
          </ul>
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
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Happening this week</h2>
            <p className="text-sm text-muted-foreground mt-1">Live from the ecosystem.</p>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Link to="/events" className="block p-5 rounded-2xl border-2 border-outline bg-surface-container shadow-brutal-sm hover:shadow-brutal transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded text-primary" style={{ fontSize: 20 }}>event</span>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide">Upcoming events</h3>
            </div>
            <ul className="space-y-2">
              {upcomingEvents.length === 0 && <li className="text-xs text-muted-foreground">Nothing scheduled.</li>}
              {upcomingEvents.map((e) => (
                <li key={e.id} className="text-sm">
                  <span className="text-[10px] font-bold text-primary block">{fmtDate(e.starts_at)}</span>
                  <span className="line-clamp-1 font-medium">{e.title}</span>
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary">See all <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span></span>
          </Link>

          <Link to="/opportunities" className="block p-5 rounded-2xl border-2 border-outline bg-accent text-accent-foreground shadow-brutal-sm hover:shadow-brutal transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>bolt</span>
              <h3 className="font-display font-bold text-sm uppercase tracking-wide">Open opportunities</h3>
            </div>
            <ul className="space-y-2">
              {openOpps.length === 0 && <li className="text-xs opacity-70">No open calls right now.</li>}
              {openOpps.map((o) => (
                <li key={o.id} className="text-sm">
                  <span className="line-clamp-2 font-medium">{o.title}</span>
                </li>
              ))}
            </ul>
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold">See all <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span></span>
          </Link>

          <Link to="/ecosystem" className="block p-5 rounded-2xl border-2 border-outline bg-surface-container shadow-brutal-sm hover:shadow-brutal transition-all">
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
            <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-primary">Browse all <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span></span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function CommunityProof() {
  const { data: locations } = useSuspenseQuery(locationsQuery);
  const top = [...locations]
    .filter((l: any) => (l.review_count ?? 0) >= 3 && l.avg_rating)
    .sort((a: any, b: any) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    .slice(0, 3);

  if (top.length === 0) return null;

  return (
    <section className="border-b-2 border-outline bg-surface-container">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Community favourites</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Rated by founders who actually used them.</h2>
          <p className="mt-2 text-muted-foreground text-sm">No paid placements. Just peer reviews from the Kiez Founders community.</p>
        </div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {top.map((l: any) => (
            <Link
              key={l.id}
              to="/location/$id"
              params={{ id: l.id }}
              className="block p-5 rounded-2xl border-2 border-outline bg-surface shadow-brutal-sm hover:shadow-brutal transition-all"
            >
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="material-symbols-rounded" style={{ fontSize: 16, fontVariationSettings: i < Math.round(l.avg_rating) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                ))}
                <span className="text-xs text-muted-foreground ml-1">{l.avg_rating.toFixed(1)} · {l.review_count} reviews</span>
              </div>
              <h3 className="font-display font-bold text-lg mt-2">{l.name}</h3>
              <p className="text-[11px] uppercase tracking-wider text-primary mt-1 font-bold">
                {CATEGORY_LABEL[l.category as LocationCategory] ?? l.category}
                {l.district ? ` · ${l.district}` : ""}
              </p>
              {l.description && <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{l.description}</p>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Tell the AI what you need", d: "One sentence. Your stage, your stuck point, your vibe." },
    { n: "02", t: "Get a curated shortlist", d: "Places, events, open calls — picked from 230+ sources in 10 seconds." },
    { n: "03", t: "Plug in and grow", d: "RSVP, apply, message founders. Build your Berlin in week one." },
  ];
  return (
    <section className="border-b-2 border-outline bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="font-display text-3xl md:text-4xl font-bold">How it works</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">Berlin already has everything you need. We're the connective layer that hands it to you on day one.</p>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.n} className="p-6 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal-sm">
              <span className="text-[10px] font-bold tracking-widest text-primary">STEP {s.n}</span>
              <h3 className="mt-2 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-accent text-accent-foreground border-b-2 border-outline">
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
          Your first week in Berlin's startup scene<br />starts in 10 seconds.
        </h2>
        <p className="mt-4 text-base opacity-80 max-w-xl mx-auto">No signup. No spam. Just the right 5 doors, opened for you.</p>
        <div className="mt-7 flex flex-wrap gap-3 justify-center">
          <Link
            to="/match"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-semibold text-sm border-2 border-outline shadow-brutal hover:translate-x-[-2px] hover:translate-y-[-2px] transition-transform"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>auto_awesome</span>
            Get my matches
          </Link>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-surface text-foreground font-semibold text-sm border-2 border-outline"
          >
            Create my founder profile
          </Link>
        </div>
      </div>
    </section>
  );
}

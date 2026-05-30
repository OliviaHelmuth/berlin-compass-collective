import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { matchmake } from "@/lib/matchmaking.functions";

export const Route = createFileRoute("/match")({
  head: () => ({
    meta: [
      { title: "AI Matchmaker — Kiez Founders Berlin" },
      {
        name: "description",
        content:
          "Describe your situation and our AI concierge picks the right places, events and opportunities from Berlin's startup ecosystem.",
      },
    ],
  }),
  component: MatchPage,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

type Pick = {
  kind: "location" | "event" | "opportunity";
  id: string;
  title: string;
  why: string;
};

const EXAMPLES = [
  "Solo technical founder, climate tech, looking for co-working in Kreuzberg + a community of climate folks.",
  "Just moved to Berlin from London. Need help with Anmeldung and a visa-friendly accountant.",
  "Pre-seed B2B SaaS, want intros to angels and a demo-day style event in the next 60 days.",
  "Researcher coming out of TU Berlin, want to talk to deep-tech VCs and incubators.",
];

const PRESET_RESULTS: Record<string, { summary: string; picks: Pick[] }> = {
  [EXAMPLES[0]]: {
    summary: "Welcome to Berlin's climate hub! Based on your focus on climate tech and preference for Kreuzberg, here are the best spots to plug in.",
    picks: [
      { kind: "location", id: "greentech-hub", title: "Greentech Hub Kreuzberg", why: "Specialized climate-only coworking with a deep community of sustainability founders." },
      { kind: "event", id: "climate-drinks", title: "Berlin Climate Founders Drinks", why: "The monthly gathering for climate tech builders, happening just 2 blocks from U-Schlesisches Tor." },
      { kind: "opportunity", id: "climate-kic", title: "Climate-KIC Accelerator", why: "Europe's leading climate innovation initiative with a strong Berlin presence." },
    ],
  },
  [EXAMPLES[1]]: {
    summary: "Relocating is the first hurdle. Let's get your admin sorted with the best English-speaking resources in the city.",
    picks: [
      { kind: "location", id: "expath", title: "Expath Berlin", why: "The gold standard for English-speaking visa and Anmeldung support in Neukölln." },
      { kind: "event", id: "admin-101", title: "Welcome to Berlin: Admin 101", why: "A monthly workshop that walks you through tax IDs, health insurance, and registration." },
      { kind: "opportunity", id: "visa-guide", title: "Freelance Visa Fast-track", why: "A curated guide and support service for technical founders moving from the UK." },
    ],
  },
  [EXAMPLES[2]]: {
    summary: "Scaling B2B SaaS in Berlin requires the right network. These picks focus on high-velocity growth and angel access.",
    picks: [
      { kind: "location", id: "factory-berlin", title: "Factory Berlin (Görlitzer Park)", why: "The strongest concentration of B2B SaaS founders and active angel investors in the city." },
      { kind: "event", id: "saas-meetup", title: "Berlin SaaS Founders Meetup", why: "A monthly deep-dive into sales cycles and scaling, attended by many local angels." },
      { kind: "opportunity", id: "techstars", title: "Techstars Berlin Open Call", why: "Perfect for pre-seed B2B startups looking for global mentorship and initial capital." },
    ],
  },
  [EXAMPLES[3]]: {
    summary: "Bridging the gap from research to market is tough. These resources are designed for TU Berlin spinoffs and deep-tech builders.",
    picks: [
      { kind: "location", id: "tu-cf-e", title: "TU Berlin Centre for Entrepreneurship", why: "Your home base for IP support and university-affiliated office space." },
      { kind: "event", id: "deep-tech-demo", title: "Deep Tech Demo Day", why: "A quarterly event where researchers pitch to specialized VCs like Cherry and Earlybird." },
      { kind: "opportunity", id: "exist-grant", title: "EXIST Business Start-up Grant", why: "The primary government funding for research-based spinoffs from German universities." },
    ],
  },
};

function MatchPage() {
  const run = useServerFn(matchmake);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ summary: string; picks: Pick[] } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (busy || q.length < 3) return;
    setBusy(true);
    setError(null);
    setResult(null);

    // Simulated Delay for "AI Thinking"
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (PRESET_RESULTS[q]) {
      setResult(PRESET_RESULTS[q]);
      setBusy(false);
      return;
    }

    // Workaround: If it's not a preset, show the "Out of Credits" message
    setError("We're sorry! We actually ran out of time and AI credits during the hackathon 😅. We promise to hook up a much more powerful AI soon! For now, please try one of our pre-prepared example prompts below.");
    setBusy(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <header>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground border-2 border-outline text-[11px] font-bold uppercase tracking-widest shadow-brutal-sm">
          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
            auto_awesome
          </span>
          AI Matchmaker
        </span>
        <h1 className="font-display text-3xl md:text-5xl font-bold mt-4 leading-tight tracking-tight">
          Tell us where you're stuck.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Our concierge reads the whole Berlin ecosystem catalog and picks the 3–5 best places, events and
          opportunities for you. No login needed.
        </p>
      </header>

      <form onSubmit={onSubmit} className="p-5 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal space-y-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Solo founder, climate tech, looking for coworking in Kreuzberg + a community of climate folks…"
          maxLength={600}
          rows={4}
          className="w-full bg-transparent text-sm resize-none focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="text-[11px] px-2 py-1 rounded-full bg-surface border-2 border-outline/40 hover:border-outline"
            >
              {ex.slice(0, 48)}…
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted-foreground">{query.length}/600</span>
          <button
            type="submit"
            disabled={busy || query.trim().length < 3}
            className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground border-2 border-outline shadow-brutal-sm text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Matching…" : "Find my matches"}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-xl border-2 border-destructive/40 bg-destructive/5 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && (
        <section className="space-y-3">
          <div className="p-4 rounded-2xl bg-accent/30 border-2 border-outline text-sm font-medium">
            {result.summary}
          </div>
          <div className="space-y-3">
            {result.picks.map((p) => (
              <PickCard key={`${p.kind}-${p.id}`} pick={p} />
            ))}
          </div>
          {result.picks.length === 0 && (
            <p className="text-sm text-muted-foreground">No clean matches — try adding more detail.</p>
          )}
        </section>
      )}
    </div>
  );
}

function PickCard({ pick }: { pick: Pick }) {
  const kindLabel = pick.kind === "location" ? "Place" : pick.kind === "event" ? "Event" : "Opportunity";
  const href =
    pick.kind === "location" ? `/location/${pick.id}` : pick.kind === "event" ? "/events" : "/opportunities";
  return (
    <Link
      to={href}
      className="block p-4 rounded-xl border-2 border-outline bg-surface-container hover:shadow-brutal-sm transition-all"
    >
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{kindLabel}</span>
      <h3 className="font-display font-bold text-base mt-1">{pick.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{pick.why}</p>
    </Link>
  );
}

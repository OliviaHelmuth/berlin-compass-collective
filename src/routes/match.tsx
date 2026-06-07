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

    try {
      const res = await run({ data: { query: q } });
      setResult(res as { summary: string; picks: Pick[] });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes("429")) {
        setError("Rate limit reached. Give it a few seconds and try again.");
      } else if (msg.includes("402")) {
        setError("AI credits exhausted on this workspace. Add credits in Settings → Workspace → Usage.");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
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
            {busy ? "Matching across the ecosystem…" : "Find my matches"}
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
            <p className="text-sm text-muted-foreground">No clean matches — try adding more detail about your stage, focus area, or what you need next.</p>
          )}
        </section>
      )}
    </div>
  );
}

function PickCard({ pick }: { pick: Pick }) {
  const kindLabel = pick.kind === "location" ? "Place" : pick.kind === "event" ? "Event" : "Opportunity";

  const common =
    "block p-4 rounded-xl border-2 border-outline bg-surface-container hover:shadow-brutal-sm transition-all";
  const inner = (
    <>
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{kindLabel}</span>
      <h3 className="font-display font-bold text-base mt-1">{pick.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{pick.why}</p>
    </>
  );

  if (pick.kind === "location") {
    return (
      <Link to="/location/$id" params={{ id: pick.id }} className={common}>
        {inner}
      </Link>
    );
  }
  if (pick.kind === "event") {
    return (
      <Link to="/events" hash={`event-${pick.id}`} className={common}>
        {inner}
      </Link>
    );
  }
  return (
    <Link to="/opportunities" hash={`opp-${pick.id}`} className={common}>
      {inner}
    </Link>
  );
}

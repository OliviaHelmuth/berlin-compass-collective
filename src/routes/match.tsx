import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { matchmake } from "@/lib/matchmaking.functions";
import { DEMO_MATCH_KEY } from "@/lib/demo-persona";

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

type FriendlyError = {
  headline: string;
  message: string;
  raw: string;
};

const EXAMPLES = [
  "Solo technical founder, climate tech, looking for co-working in Kreuzberg + a community of climate folks.",
  "Just moved to Berlin from London. Need help with Anmeldung and a visa-friendly accountant.",
  "Pre-seed B2B SaaS, want intros to angels and a demo-day style event in the next 60 days.",
  "Researcher coming out of TU Berlin, want to talk to deep-tech VCs and incubators.",
];

const LOADING_STEPS = [
  "Reading 60 places, 20 events, 20 opportunities…",
  "Asking the AI concierge…",
  "Picking the best 3–5 matches for you…",
  "Writing why each one fits…",
];

function mapError(raw: string): FriendlyError {
  const lower = raw.toLowerCase();
  if (raw.includes("429") || lower.includes("rate limit")) {
    return {
      headline: "Too many requests right now",
      message: "Give it a few seconds and try again.",
      raw,
    };
  }
  if (raw.includes("402") || lower.includes("credits")) {
    return {
      headline: "AI credits used up",
      message: "The AI credits for this workspace are used up. Add more in Settings → Workspace → Usage.",
      raw,
    };
  }
  if (lower.includes("not configured")) {
    return {
      headline: "AI isn't connected yet",
      message: "Please contact the site admin to enable the AI matchmaker.",
      raw,
    };
  }
  if (lower.includes("unreadable") || lower.includes("parse") || lower.includes("schema") || lower.includes("json")) {
    return {
      headline: "The AI got confused by that one",
      message: "Try rephrasing with your stage, focus area, or what you need next.",
      raw,
    };
  }
  if (lower.includes("failed to fetch") || lower.includes("network") || lower.includes("networkerror")) {
    return {
      headline: "Couldn't reach the AI service",
      message: "Check your connection and try again.",
      raw,
    };
  }
  return {
    headline: "Something went wrong on our side",
    message: "Please try again in a moment.",
    raw,
  };
}

function MatchPage() {
  const { t } = useTranslation();
  const run = useServerFn(matchmake);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [result, setResult] = useState<{ summary: string; picks: Pick[] } | null>(null);
  const [step, setStep] = useState(0);
  const lastQueryRef = useRef<string>("");
  const autoRanRef = useRef(false);

  useEffect(() => {
    if (!busy) return;
    setStep(0);
    const id = setInterval(() => {
      setStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 1600);
    return () => clearInterval(id);
  }, [busy]);

  async function submit(q: string) {
    if (busy || q.length < 3) return;
    lastQueryRef.current = q;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await run({ data: { query: q } });
      setResult(res as { summary: string; picks: Pick[] });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setError(mapError(msg));
    } finally {
      setBusy(false);
    }
  }

  // Auto-run when arriving from the /demo flow
  useEffect(() => {
    if (autoRanRef.current) return;
    if (typeof window === "undefined") return;
    const demoQuery = sessionStorage.getItem(DEMO_MATCH_KEY);
    if (demoQuery && demoQuery.length >= 3) {
      autoRanRef.current = true;
      sessionStorage.removeItem(DEMO_MATCH_KEY);
      setQuery(demoQuery);
      void submit(demoQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(query.trim());
  }

  const loadingSteps = [
    t("match.steps.reading"),
    t("match.steps.asking"),
    t("match.steps.picking"),
    t("match.steps.writing"),
  ];


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

      {busy && <LoadingPanel step={step} />}

      {error && !busy && (
        <div className="p-5 rounded-2xl border-2 border-destructive/40 bg-destructive/5 shadow-brutal-sm space-y-3">
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-rounded text-destructive shrink-0"
              style={{ fontSize: 28 }}
              aria-hidden
            >
              sentiment_dissatisfied
            </span>
            <div className="space-y-1">
              <h2 className="font-display font-bold text-base text-destructive">{error.headline}</h2>
              <p className="text-sm text-foreground/80">{error.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => submit(lastQueryRef.current || query.trim())}
              disabled={!lastQueryRef.current && query.trim().length < 3}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground border-2 border-outline shadow-brutal-sm text-xs font-semibold disabled:opacity-50"
            >
              Try again
            </button>
            <details className="text-[11px] opacity-70">
              <summary className="cursor-pointer">Technical details</summary>
              <pre className="mt-1 whitespace-pre-wrap break-all max-w-full">{error.raw}</pre>
            </details>
          </div>
        </div>
      )}

      {result && !busy && (
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

function LoadingPanel({ step }: { step: number }) {
  return (
    <section className="space-y-3" aria-live="polite" aria-busy="true">
      <div className="p-5 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal space-y-3">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <h2 className="font-display font-bold text-base">Scanning the Berlin ecosystem…</h2>
        </div>
        <p className="text-sm text-muted-foreground transition-opacity">{LOADING_STEPS[step]}</p>
        <p className="text-[11px] text-muted-foreground/80">This usually takes 5–15 seconds.</p>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border-2 border-outline/40 bg-surface-container/60 animate-pulse"
          >
            <div className="h-2 w-16 rounded bg-foreground/15" />
            <div className="h-4 w-2/3 rounded bg-foreground/15 mt-2" />
            <div className="h-3 w-full rounded bg-foreground/10 mt-2" />
            <div className="h-3 w-5/6 rounded bg-foreground/10 mt-1" />
          </div>
        ))}
      </div>
    </section>
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

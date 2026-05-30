import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveOnboarding, getMyProfile } from "@/lib/personalize.functions";
import {
  ROLES,
  STAGES,
  INDUSTRY_GROUPS,
  LOOKING_FOR,
  BACKGROUNDS,
} from "@/lib/tags";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your founder profile — Berlin Founder Atlas" },
      { name: "description", content: "Tell us who you are so we can match you with the right people, places and opportunities in Berlin." },
    ],
  }),
  component: OnboardingPage,
});

type Answers = {
  role: string;
  stage: string;
  industries: string[];
  looking_for: string[];
  background: string[];
};

const EMPTY: Answers = { role: "", stage: "", industries: [], looking_for: [], background: [] };

function OnboardingPage() {
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const loadProfile = useServerFn(getMyProfile);
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(EMPTY);
  const [authChecked, setAuthChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/login", search: { next: "/onboarding" } as never, replace: true });
        return;
      }
      try {
        const p = await loadProfile();
        if (p) {
          setA({
            role: p.role ?? "",
            stage: p.stage ?? "",
            industries: p.industries ?? [],
            looking_for: p.looking_for ?? [],
            background: p.background ?? [],
          });
        }
      } catch {
        /* ignore */
      }
      setAuthChecked(true);
    })();
  }, [navigate, loadProfile]);

  const toggle = (key: "industries" | "looking_for" | "background", v: string) => {
    setA((cur) => {
      const has = cur[key].includes(v);
      return { ...cur, [key]: has ? cur[key].filter((x) => x !== v) : [...cur[key], v] };
    });
  };

  const total = 5;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canAdvance =
    (step === 0 && a.role) ||
    (step === 1 && a.stage) ||
    (step === 2 && a.industries.length > 0) ||
    (step === 3 && a.looking_for.length > 0) ||
    step === 4;

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await save({ data: a });
      navigate({ to: "/", replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!authChecked) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest">← Skip for now</Link>

      <div className="mt-4 mb-8">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
          <span>Step {step + 1} of {total}</span>
          <span>{Math.round(((step + 1) / total) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-surface-container border-2 border-outline overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl bg-surface border-2 border-outline shadow-brutal p-6 md:p-8">
        {step === 0 && (
          <Step title="What best describes you?" subtitle="Pick the role that fits you today.">
            <ChipGrid
              options={[...ROLES]}
              selected={a.role ? [a.role] : []}
              onClick={(v) => setA((c) => ({ ...c, role: v }))}
            />
          </Step>
        )}

        {step === 1 && (
          <Step title="What stage are you at?" subtitle="Where are you in your journey right now?">
            <ChipGrid
              options={[...STAGES]}
              selected={a.stage ? [a.stage] : []}
              onClick={(v) => setA((c) => ({ ...c, stage: v }))}
            />
          </Step>
        )}

        {step === 2 && (
          <Step title="Which industries interest you?" subtitle="Select all that apply.">
            <div className="space-y-5">
              {INDUSTRY_GROUPS.map((g) => (
                <div key={g.group}>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">{g.group}</h3>
                  <ChipGrid options={g.tags} selected={a.industries} onClick={(v) => toggle("industries", v)} />
                </div>
              ))}
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step title="What are you looking for right now?" subtitle="Pick everything that matters.">
            <ChipGrid options={[...LOOKING_FOR]} selected={a.looking_for} onClick={(v) => toggle("looking_for", v)} />
          </Step>
        )}

        {step === 4 && (
          <Step title="What's your background?" subtitle="Optional — helps us match you with collaborators.">
            <ChipGrid options={[...BACKGROUNDS]} selected={a.background} onClick={(v) => toggle("background", v)} />
          </Step>
        )}

        {err && <p className="mt-4 text-sm text-destructive">{err}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={back}
            disabled={step === 0}
            className="h-11 px-5 rounded-full text-sm font-semibold border-2 border-outline/30 disabled:opacity-40"
          >
            Back
          </button>

          {step < total - 1 ? (
            <button
              onClick={next}
              disabled={!canAdvance}
              className="h-11 px-6 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 shadow-brutal-sm border-2 border-outline"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={busy}
              className="h-11 px-6 rounded-full bg-accent text-accent-foreground font-semibold text-sm shadow-lime border-2 border-outline disabled:opacity-50"
            >
              {busy ? "Saving…" : "Show me my Berlin"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function ChipGrid({ options, selected, onClick }: { options: string[]; selected: string[]; onClick: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => onClick(o)}
            className={`px-4 h-10 rounded-full text-sm font-medium border-2 transition-all ${
              active
                ? "bg-accent text-accent-foreground border-outline shadow-brutal-sm"
                : "bg-surface-container border-outline/20 hover:border-outline"
            }`}
          >
            {active && <span className="material-symbols-rounded align-middle mr-1" style={{ fontSize: 16 }}>check</span>}
            {o}
          </button>
        );
      })}
    </div>
  );
}

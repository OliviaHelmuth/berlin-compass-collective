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
  ARRIVAL_STATUS,
  RESIDENCE_STATUS,
  GERMAN_LEVEL,
  CURRENT_FOCUS,
  INTERESTS,
} from "@/lib/tags";
import { DEMO_FLAG_KEY, DEMO_MATCH_KEY, FRANZISKA_PREFILL, FRANZISKA_MATCH_QUERY } from "@/lib/demo-persona";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your founder profile — Kiez Founders Berlin" },
      { name: "description", content: "Tell us who you are so we can match you with the right people, places and opportunities in Berlin." },
    ],
  }),
  component: OnboardingPage,
});

type ArrayKey = "industries" | "looking_for" | "background" | "current_focus" | "interests";

type Answers = {
  role: string;
  stage: string;
  industries: string[];
  looking_for: string[];
  background: string[];
  arrival_status: string;
  residence_status: string;
  german_level: string;
  current_focus: string[];
  interests: string[];
};

const EMPTY: Answers = {
  role: "",
  stage: "",
  industries: [],
  looking_for: [],
  background: [],
  arrival_status: "",
  residence_status: "",
  german_level: "",
  current_focus: [],
  interests: [],
};

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
      const isDemo = typeof window !== "undefined" && sessionStorage.getItem(DEMO_FLAG_KEY) === "franziska";
      try {
        const p = await loadProfile();
        if (isDemo) {
          // Prefill Franziska's persona for the demo (manual advance)
          setA({ ...EMPTY, ...FRANZISKA_PREFILL });
        } else if (p) {
          setA({
            role: p.role ?? "",
            stage: p.stage ?? "",
            industries: p.industries ?? [],
            looking_for: p.looking_for ?? [],
            background: p.background ?? [],
            arrival_status: p.arrival_status ?? "",
            residence_status: p.residence_status ?? "",
            german_level: p.german_level ?? "",
            current_focus: p.current_focus ?? [],
            interests: p.interests ?? [],
          });
        }
      } catch {
        /* ignore */
      }
      setAuthChecked(true);
    })();
  }, [navigate, loadProfile]);

  const toggle = (key: ArrayKey, v: string) => {
    setA((cur) => {
      const has = cur[key].includes(v);
      return { ...cur, [key]: has ? cur[key].filter((x) => x !== v) : [...cur[key], v] };
    });
  };

  const steps = [
    { id: "role", required: !!a.role },
    { id: "arrival", required: !!a.arrival_status },
    { id: "residence", required: !!a.residence_status },
    { id: "german", required: !!a.german_level },
    { id: "stage", required: !!a.stage },
    { id: "focus", required: a.current_focus.length > 0 },
    { id: "industries", required: a.industries.length > 0 },
    { id: "interests", required: a.interests.length > 0 },
    { id: "looking", required: a.looking_for.length > 0 },
    { id: "background", required: true }, // optional
  ];
  const total = steps.length;
  const next = () => setStep((s) => Math.min(s + 1, total - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const canAdvance = steps[step].required;

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await save({
        data: {
          ...a,
          arrival_status: a.arrival_status || null,
          residence_status: a.residence_status || null,
          german_level: a.german_level || null,
        },
      });
      navigate({ to: "/", replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!authChecked) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;

  const id = steps[step].id;

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
        {id === "role" && (
          <Step title="What best describes you?" subtitle="Pick the role that fits you today.">
            <ChipGrid options={[...ROLES]} selected={a.role ? [a.role] : []} onClick={(v) => setA((c) => ({ ...c, role: v }))} />
          </Step>
        )}

        {id === "arrival" && (
          <Step title="Are you already in Berlin?" subtitle="So we can show you the right next step.">
            <ChipGrid options={[...ARRIVAL_STATUS]} selected={a.arrival_status ? [a.arrival_status] : []} onClick={(v) => setA((c) => ({ ...c, arrival_status: v }))} />
          </Step>
        )}

        {id === "residence" && (
          <Step title="What's your residence status?" subtitle="EU citizen, or visa / permit needed?">
            <ChipGrid options={[...RESIDENCE_STATUS]} selected={a.residence_status ? [a.residence_status] : []} onClick={(v) => setA((c) => ({ ...c, residence_status: v }))} />
          </Step>
        )}

        {id === "german" && (
          <Step title="How's your German?" subtitle="We'll filter events and programs accordingly.">
            <ChipGrid options={[...GERMAN_LEVEL]} selected={a.german_level ? [a.german_level] : []} onClick={(v) => setA((c) => ({ ...c, german_level: v }))} />
          </Step>
        )}

        {id === "stage" && (
          <Step title="What stage are you at?" subtitle="Where are you in your startup journey?">
            <ChipGrid options={[...STAGES]} selected={a.stage ? [a.stage] : []} onClick={(v) => setA((c) => ({ ...c, stage: v }))} />
          </Step>
        )}

        {id === "focus" && (
          <Step title="What do you need to tackle now?" subtitle="Select everything that's on your plate.">
            <ChipGrid options={[...CURRENT_FOCUS]} selected={a.current_focus} onClick={(v) => toggle("current_focus", v)} />
          </Step>
        )}

        {id === "industries" && (
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

        {id === "interests" && (
          <Step title="What kinds of events & opportunities?" subtitle="Pick the formats and themes you want to see.">
            <ChipGrid options={[...INTERESTS]} selected={a.interests} onClick={(v) => toggle("interests", v)} />
          </Step>
        )}

        {id === "looking" && (
          <Step title="What are you looking for right now?" subtitle="Pick everything that matters.">
            <ChipGrid options={[...LOOKING_FOR]} selected={a.looking_for} onClick={(v) => toggle("looking_for", v)} />
          </Step>
        )}

        {id === "background" && (
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

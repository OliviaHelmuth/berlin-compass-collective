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

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Kiez Founders Berlin" },
      { name: "description", content: "Update your interests, stage and preferences." },
    ],
  }),
  component: SettingsPage,
});

type State = {
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
  district: string;
  bio: string;
};

const EMPTY: State = {
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
  district: "",
  bio: "",
};

function SettingsPage() {
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const save = useServerFn(saveOnboarding);
  const [s, setS] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/login", replace: true });
        return;
      }
      try {
        const p = await loadProfile();
        if (p) {
          setS({
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
            district: p.district ?? "",
            bio: p.bio ?? "",
          });
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
      setReady(true);
    })();
  }, [navigate, loadProfile]);

  type ArrayKey = "industries" | "looking_for" | "background" | "current_focus" | "interests";
  const toggle = (key: ArrayKey, v: string) =>
    setS((c) => {
      const has = c[key].includes(v);
      return { ...c, [key]: has ? c[key].filter((x) => x !== v) : [...c[key], v] };
    });

  const onSave = async () => {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await save({
        data: {
          ...s,
          arrival_status: s.arrival_status || null,
          residence_status: s.residence_status || null,
          german_level: s.german_level || null,
          district: s.district || null,
          bio: s.bio || null,
          role: s.role || "Founder",
          stage: s.stage || "Exploring Ideas",
        },
      });
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  if (!ready) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest">← Back</Link>
          <h1 className="font-display text-4xl font-bold mt-2">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Update your interests, stage and preferences anytime.</p>
        </div>
        <button onClick={onSignOut} className="h-10 px-4 rounded-full text-sm font-semibold border-2 border-outline/30 hover:border-outline">Sign out</button>
      </div>

      <Section title="Your role">
        <ChipGrid options={[...ROLES]} selected={s.role ? [s.role] : []} onClick={(v) => setS((c) => ({ ...c, role: v }))} />
      </Section>

      <Section title="Your stage">
        <ChipGrid options={[...STAGES]} selected={s.stage ? [s.stage] : []} onClick={(v) => setS((c) => ({ ...c, stage: v }))} />
      </Section>

      <Section title="In Berlin?">
        <ChipGrid options={[...ARRIVAL_STATUS]} selected={s.arrival_status ? [s.arrival_status] : []} onClick={(v) => setS((c) => ({ ...c, arrival_status: v }))} />
      </Section>

      <Section title="Residence status">
        <ChipGrid options={[...RESIDENCE_STATUS]} selected={s.residence_status ? [s.residence_status] : []} onClick={(v) => setS((c) => ({ ...c, residence_status: v }))} />
      </Section>

      <Section title="German level">
        <ChipGrid options={[...GERMAN_LEVEL]} selected={s.german_level ? [s.german_level] : []} onClick={(v) => setS((c) => ({ ...c, german_level: v }))} />
      </Section>

      <Section title="Current focus">
        <ChipGrid options={[...CURRENT_FOCUS]} selected={s.current_focus} onClick={(v) => toggle("current_focus", v)} />
      </Section>

      <Section title="Industries">
        <div className="space-y-5">
          {INDUSTRY_GROUPS.map((g) => (
            <div key={g.group}>
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">{g.group}</h3>
              <ChipGrid options={g.tags} selected={s.industries} onClick={(v) => toggle("industries", v)} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Interests" subtitle="Drives what shows up in your events & opportunities feed.">
        <ChipGrid options={[...INTERESTS]} selected={s.interests} onClick={(v) => toggle("interests", v)} />
      </Section>

      <Section title="Looking for">
        <ChipGrid options={[...LOOKING_FOR]} selected={s.looking_for} onClick={(v) => toggle("looking_for", v)} />
      </Section>

      <Section title="Background">
        <ChipGrid options={[...BACKGROUNDS]} selected={s.background} onClick={(v) => toggle("background", v)} />
      </Section>

      <Section title="About you">
        <input
          value={s.district}
          onChange={(e) => setS((c) => ({ ...c, district: e.target.value }))}
          placeholder="Your Kiez / district (e.g. Kreuzberg)"
          className="w-full h-11 rounded-lg px-3 bg-surface-container border-2 border-outline/20 focus:border-outline outline-none text-sm mb-3"
        />
        <textarea
          value={s.bio}
          onChange={(e) => setS((c) => ({ ...c, bio: e.target.value }))}
          placeholder="A short bio (optional)"
          rows={4}
          maxLength={500}
          className="w-full rounded-lg px-3 py-2 bg-surface-container border-2 border-outline/20 focus:border-outline outline-none text-sm"
        />
      </Section>

      <div className="flex items-center gap-3 sticky bottom-4 bg-surface/90 backdrop-blur p-3 rounded-2xl border-2 border-outline shadow-brutal">
        <button
          onClick={onSave}
          disabled={busy}
          className="h-11 px-6 rounded-full bg-accent text-accent-foreground font-semibold text-sm shadow-lime border-2 border-outline disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
        {msg && <span className="text-sm text-emerald-600">{msg}</span>}
        {err && <span className="text-sm text-destructive">{err}</span>}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface border-2 border-outline shadow-brutal-sm p-5 md:p-6">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
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

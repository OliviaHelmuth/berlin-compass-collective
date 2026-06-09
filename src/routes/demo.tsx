import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoUser } from "@/lib/demo.functions";
import i18n from "@/i18n";
import { DEMO_FLAG_KEY } from "@/lib/demo-persona";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo — Kiez Founders Berlin" },
      { name: "description", content: "Geführte Demo-Tour durch Kiez Founders Berlin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoOrchestrator,
});

type StepKey = "lang" | "signin" | "reset" | "onboarding";

function DemoOrchestrator() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ensure = useServerFn(ensureDemoUser);
  const [step, setStep] = useState<StepKey>("lang");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Force German for the demo
        setStep("lang");
        await i18n.changeLanguage("de");
        if (typeof document !== "undefined") document.documentElement.lang = "de";

        // 2. Ensure Franziska's account + reset her profile via admin server fn
        setStep("reset");
        const { email, password } = await ensure();
        if (cancelled) return;

        // 3. Sign her out then back in fresh
        setStep("signin");
        await supabase.auth.signOut();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (cancelled) return;

        // 4. Flag the demo in sessionStorage so onboarding prefills + match auto-runs
        sessionStorage.setItem("kf:demo", "franziska");

        // 5. Go to onboarding
        setStep("onboarding");
        navigate({ to: "/onboarding", replace: true });
      } catch (e) {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensure, navigate]);

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface border-2 border-outline shadow-brutal text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-accent border-2 border-outline shadow-brutal-sm grid place-items-center mb-5">
          <span className="material-symbols-rounded animate-pulse" style={{ fontSize: 26 }}>
            auto_awesome
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold">{t("demo.title")}</h1>
        <ul className="mt-6 space-y-2 text-sm text-left">
          {(["lang", "signin", "reset", "onboarding"] as StepKey[]).map((k) => {
            const order: StepKey[] = ["lang", "reset", "signin", "onboarding"];
            const done = order.indexOf(k) < order.indexOf(step);
            const active = k === step;
            return (
              <li key={k} className="flex items-center gap-2">
                <span
                  className={`material-symbols-rounded ${
                    done ? "text-primary" : active ? "text-foreground animate-pulse" : "text-muted-foreground/40"
                  }`}
                  style={{ fontSize: 20 }}
                >
                  {done ? "check_circle" : active ? "progress_activity" : "radio_button_unchecked"}
                </span>
                <span className={active || done ? "" : "text-muted-foreground"}>
                  {t(`demo.steps.${k}`)}
                </span>
              </li>
            );
          })}
        </ul>
        {err && (
          <p className="mt-5 text-sm text-destructive">
            {t("demo.error", { msg: err })}
          </p>
        )}
      </div>
    </div>
  );
}

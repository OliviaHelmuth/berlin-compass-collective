import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Kiez Founders Berlin" },
      { name: "description", content: "Sign in to review hubs, RSVP to events and submit opportunities." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      let isNew = false;
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        isNew = true;
      }
      navigate({ to: isNew ? "/onboarding" : "/" });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setErr(result.error instanceof Error ? result.error.message : String(result.error));
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md p-6 rounded-2xl bg-surface border-2 border-outline shadow-brutal">
        <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest">{t("login.backHome")}</Link>
        <h1 className="font-display text-3xl font-bold mt-3">{mode === "signin" ? t("login.welcomeBack") : t("login.joinTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("login.subtitle")}</p>

        <button
          onClick={onGoogle}
          className="mt-6 w-full h-11 rounded-full bg-accent text-accent-foreground font-semibold text-sm border-2 border-outline shadow-brutal-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>login</span>
          {t("login.google")}
        </button>

        <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> {t("login.or")} <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("login.displayName")}
              className="w-full h-11 rounded-lg px-3 bg-surface-container border-2 border-outline/20 focus:border-outline outline-none text-sm"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("login.email")}
            className="w-full h-11 rounded-lg px-3 bg-surface-container border-2 border-outline/20 focus:border-outline outline-none text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.password")}
            className="w-full h-11 rounded-lg px-3 bg-surface-container border-2 border-outline/20 focus:border-outline outline-none text-sm"
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "…" : mode === "signin" ? t("login.signIn") : t("login.createAccount")}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs font-medium text-muted-foreground hover:text-primary"
        >
          {mode === "signin" ? t("login.toSignup") : t("login.toSignin")}
        </button>
      </div>
    </div>
  );
}

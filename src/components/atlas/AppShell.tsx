import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Discover", icon: "explore" },
  { to: "/ecosystem", label: "Ecosystem", icon: "map" },
  { to: "/match", label: "AI Match", icon: "auto_awesome" },
  { to: "/events", label: "Events", icon: "event" },
  { to: "/opportunities", label: "Opportunities", icon: "bolt" },
  { to: "/my-hub", label: "My Hub", icon: "hub" },
  { to: "/messages", label: "Messages", icon: "chat" },
];


export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("atlas-theme") : null;
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("atlas-theme", next ? "dark" : "light");
  };

  const initials = email ? email.slice(0, 2).toUpperCase() : null;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur border-b-2 border-outline">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl tracking-tight uppercase">
            <span className="size-8 grid place-items-center rounded-lg bg-primary text-primary-foreground shadow-brutal-sm">
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>map</span>
            </span>
            <span>Kiez Founders</span>
            <span className="hidden sm:inline text-[10px] font-sans font-medium text-muted-foreground tracking-widest ml-1">BERLIN</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => {
              const active = path === n.to;
              const isNew = n.to === "/match";
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`relative flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                      : "hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }}>{n.icon}</span>
                  {n.label}
                  {isNew && (
                    <span className="ml-1 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground border border-outline">NEW</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="size-10 rounded-full bg-surface-container grid place-items-center hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>{dark ? "light_mode" : "dark_mode"}</span>
            </button>
            {email ? (
              <Link
                to="/settings"
                aria-label="Settings"
                className="size-10 rounded-full bg-primary-container ring-2 ring-primary grid place-items-center font-display text-xs font-bold text-on-primary-container hover:opacity-90"
              >
                {initials}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 h-10 rounded-full bg-accent text-accent-foreground font-semibold text-sm grid place-items-center shadow-brutal-sm border-2 border-outline"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-surface-container border-t-2 border-outline flex items-center justify-around">
        {NAV.map((n) => {
          const active = path === n.to;
          return (
            <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5">
              <span
                className={`px-4 py-0.5 rounded-full ${active ? "bg-primary-container text-on-primary-container" : ""}`}
              >
                <span className={`material-symbols-rounded ${active ? "fill" : ""}`} style={{ fontSize: 22 }}>{n.icon}</span>
              </span>
              <span className={`text-[10px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPersonalizedFeed } from "@/lib/personalize.functions";
import { CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";

export const Route = createFileRoute("/my-hub")({
  head: () => ({
    meta: [
      { title: "My Hub — Kiez Founders Berlin" },
      { name: "description", content: "Your curated events, opportunities and spaces in Berlin." },
    ],
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: "/my-hub" } });
    }
  },
  component: MyHub,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function MyHub() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["my-hub", userId],
    queryFn: () => getPersonalizedFeed({ data: { userId } }),
    enabled: !!userId,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            {data?.personalized ? "Curated for you" : "Berlin highlights"}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">My Hub</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Events, opportunities and partners ranked by your stage, focus and interests.
          </p>
        </div>
        <Link to="/settings" className="text-xs font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest">
          Edit interests
        </Link>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading your picks…</div>}

      {data && (
        <>
          <Section title="Events for you" icon="event" linkTo="/events" empty="No matching events yet.">
            {data.events.map((e) => (
              <a
                key={e.id}
                href={e.url ?? "#"}
                target={e.url ? "_blank" : undefined}
                rel="noreferrer"
                className="block p-4 rounded-2xl bg-surface border-2 border-outline shadow-brutal-sm hover:shadow-brutal transition-shadow"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {new Date(e.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <h3 className="mt-1 font-display font-semibold text-base leading-snug line-clamp-2">{e.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{e.venue ?? e.host ?? "Berlin"}</p>
                {e.tags?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {e.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container border border-outline/40">{t}</span>
                    ))}
                  </div>
                ) : null}
              </a>
            ))}
          </Section>

          <Section title="Opportunities for you" icon="bolt" linkTo="/opportunities" empty="No matching opportunities yet.">
            {data.opportunities.map((o) => (
              <a
                key={o.id}
                href={o.url ?? "#"}
                target={o.url ? "_blank" : undefined}
                rel="noreferrer"
                className="block p-4 rounded-2xl bg-surface border-2 border-outline shadow-brutal-sm hover:shadow-brutal transition-shadow"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{o.opp_type}</span>
                <h3 className="mt-1 font-display font-semibold text-base leading-snug line-clamp-2">{o.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{o.org ?? ""}</p>
                {o.deadline && (
                  <p className="mt-2 text-[11px] font-semibold text-foreground">
                    Deadline {new Date(o.deadline).toLocaleDateString()}
                  </p>
                )}
              </a>
            ))}
          </Section>

          <Section title="Spaces & partners" icon="place" linkTo="/" empty="No partners match yet.">
            {data.locations.map((l) => (
              <Link
                key={l.id}
                to="/location/$id"
                params={{ id: l.id }}
                className="block p-4 rounded-2xl bg-surface border-2 border-outline shadow-brutal-sm hover:shadow-brutal transition-shadow"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {CATEGORY_LABEL[l.category as LocationCategory] ?? l.category}
                </span>
                <h3 className="mt-1 font-display font-semibold text-base leading-snug line-clamp-2">{l.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{l.district ?? "Berlin"}</p>
              </Link>
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  linkTo,
  empty,
  children,
}: {
  title: string;
  icon: string;
  linkTo: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const isEmpty = arr.filter(Boolean).length === 0;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-xl flex items-center gap-2">
          <span className="material-symbols-rounded" style={{ fontSize: 22 }}>{icon}</span>
          {title}
        </h2>
        <Link to={linkTo} className="text-[11px] font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest">
          See all →
        </Link>
      </div>
      {isEmpty ? (
        <div className="p-6 text-center rounded-2xl border-2 border-dashed border-outline/30 text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
      )}
    </section>
  );
}

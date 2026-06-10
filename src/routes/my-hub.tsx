import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { getPersonalizedFeed } from "@/lib/personalize.functions";
import { CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";
import { DEMO_FLAG_KEY } from "@/lib/demo-persona";

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
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    if (typeof window !== "undefined") {
      setIsDemo(sessionStorage.getItem(DEMO_FLAG_KEY) === "franziska");
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["my-hub", userId],
    queryFn: () => getPersonalizedFeed({ data: { userId } }),
    enabled: !!userId,
  });

  const topEvent = data?.events?.[0];
  const topOpp = data?.opportunities?.[0];
  const topSpace = data?.locations?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {isDemo && (
        <section className="rounded-3xl bg-gradient-to-br from-accent/40 via-surface to-primary-container/40 border-2 border-outline shadow-brutal p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="size-16 md:size-20 rounded-2xl bg-accent border-2 border-outline shadow-brutal-sm grid place-items-center shrink-0">
              <span className="material-symbols-rounded" style={{ fontSize: 36 }}>eco</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(["tag1", "tag2", "tag3"] as const).map((k) => (
                  <span key={k} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface border-2 border-outline">
                    {t(`myHub.demo.${k}`)}
                  </span>
                ))}
              </div>
              <h1 className="font-display text-2xl md:text-4xl font-bold leading-tight">{t("myHub.demo.headline")}</h1>
              <p className="mt-2 text-sm md:text-base text-foreground/80 max-w-3xl">{t("myHub.demo.summary")}</p>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
              {t("myHub.demo.nextMoves")}
            </h2>
            <div className="grid md:grid-cols-3 gap-3">
              <NextMove
                icon="event"
                step="1"
                title={t("myHub.demo.moveEvent")}
                subtitle={topEvent?.title}
                meta={topEvent ? new Date(topEvent.starts_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : null}
              />
              <NextMove
                icon="bolt"
                step="2"
                title={t("myHub.demo.moveOpp")}
                subtitle={topOpp?.title}
                meta={topOpp?.deadline ? `${t("myHub.deadline")} ${new Date(topOpp.deadline).toLocaleDateString()}` : topOpp?.org ?? null}
              />
              <NextMove
                icon="place"
                step="3"
                title={t("myHub.demo.moveSpace")}
                subtitle={topSpace?.name}
                meta={topSpace?.district ?? "Berlin"}
              />
            </div>
          </div>
        </section>
      )}

      <header className="flex items-end justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            {data?.personalized ? t("myHub.curatedFor") : t("myHub.berlinHighlights")}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-1">{t("myHub.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{t("myHub.intro")}</p>
        </div>
        <Link to="/settings" className="text-xs font-semibold text-muted-foreground hover:text-primary uppercase tracking-widest">
          {t("myHub.editInterests")}
        </Link>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">{t("myHub.loading")}</div>}

      {data && (
        <>
          <Section title={t("myHub.events")} icon="event" linkTo="/events" empty={t("myHub.emptyEvents")} seeAll={t("myHub.seeAll")}>
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
                    {e.tags.slice(0, 3).map((tg) => (
                      <span key={tg} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container border border-outline/40">{tg}</span>
                    ))}
                  </div>
                ) : null}
              </a>
            ))}
          </Section>

          <Section title={t("myHub.opportunities")} icon="bolt" linkTo="/opportunities" empty={t("myHub.emptyOpps")} seeAll={t("myHub.seeAll")}>
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
                    {t("myHub.deadline")} {new Date(o.deadline).toLocaleDateString()}
                  </p>
                )}
              </a>
            ))}
          </Section>

          <Section title={t("myHub.spaces")} icon="place" linkTo="/" empty={t("myHub.emptySpaces")} seeAll={t("myHub.seeAll")}>
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

function NextMove({ icon, step, title, subtitle, meta }: { icon: string; step: string; title: string; subtitle?: string | null; meta?: string | null }) {
  return (
    <div className="p-4 rounded-2xl bg-surface border-2 border-outline shadow-brutal-sm flex gap-3">
      <span className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold text-sm shrink-0">{step}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-bold">
          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>{icon}</span>
        </div>
        <h3 className="font-display font-semibold text-sm leading-snug mt-0.5">{title}</h3>
        {subtitle && <p className="text-xs text-foreground/80 mt-1 line-clamp-2">{subtitle}</p>}
        {meta && <p className="text-[11px] text-muted-foreground mt-1">{meta}</p>}
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  linkTo,
  empty,
  seeAll,
  children,
}: {
  title: string;
  icon: string;
  linkTo: string;
  empty: string;
  seeAll: string;
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
          {seeAll}
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

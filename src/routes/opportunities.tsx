import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getOpportunities } from "@/lib/atlas.functions";

const oppsQuery = queryOptions({ queryKey: ["opportunities"], queryFn: () => getOpportunities() });

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Berlin Founder Atlas" },
      { name: "description", content: "Accelerator calls, grants, office hours and co-founder searches in Berlin." },
      { property: "og:title", content: "Berlin startup opportunities" },
      { property: "og:description", content: "Open calls, grants, and office hours for Berlin founders." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(oppsQuery),
  component: OppsPage,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load opportunities: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Not found.</div>,
});

function OppsPage() {
  const { data: opps } = useSuspenseQuery(oppsQuery);
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight">Opportunities</h1>
        <p className="text-muted-foreground mt-2">Open calls, grants and office hours for Berlin founders.</p>
      </header>
      <div className="space-y-4">
        {opps.map((o, i) => (
          <div
            key={o.id}
            className={`p-5 rounded-2xl border-2 border-outline ${
              i === 0 ? "bg-primary text-primary-foreground shadow-lime" : "bg-surface-container shadow-brutal-sm"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                {o.opp_type === "grant" ? "redeem" : o.opp_type === "cofounder" ? "diversity_3" : o.opp_type === "office_hours" ? "schedule" : "rocket_launch"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest">{o.opp_type.replace("_", " ")}</span>
            </div>
            <h3 className="font-display text-lg font-semibold">{o.title}</h3>
            {o.org && <p className={`text-xs mt-0.5 ${i === 0 ? "opacity-80" : "text-muted-foreground"}`}>{o.org}</p>}
            {o.description && <p className={`text-sm mt-2 ${i === 0 ? "opacity-90" : ""}`}>{o.description}</p>}
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-xs font-medium ${i === 0 ? "opacity-80" : "text-muted-foreground"}`}>
                {o.deadline ? `Deadline ${new Date(o.deadline).toLocaleDateString("en", { day: "numeric", month: "short" })}` : "Rolling"}
              </span>
              {o.url && (
                <a
                  href={o.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border-2 ${
                    i === 0 ? "bg-primary-foreground text-primary border-primary-foreground" : "bg-accent text-accent-foreground border-outline"
                  }`}
                >
                  Apply
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

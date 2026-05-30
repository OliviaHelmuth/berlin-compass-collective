import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getLocation } from "@/lib/atlas.functions";
import { CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";

const locationQuery = (id: string) =>
  queryOptions({ queryKey: ["location", id], queryFn: () => getLocation({ data: { id } }) });

export const Route = createFileRoute("/location/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Location — Berlin Founder Atlas" },
      { name: "description", content: "Details, reviews and recommendations for this Berlin startup ecosystem location." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(locationQuery(params.id)),
  component: LocationPage,
  errorComponent: ({ error }) => <div className="p-8">Couldn't load: {error.message}</div>,
  notFoundComponent: () => <div className="p-8">Location not found.</div>,
});

function LocationPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(locationQuery(id));
  const { location, reviews, avgRating, recommendPct } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary">← Discover</Link>

      <div className="p-6 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {CATEGORY_LABEL[location.category as LocationCategory]}
        </span>
        <h1 className="font-display text-3xl font-bold mt-1">{location.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {location.address ?? ""} · {location.district ?? "Berlin"}
        </p>
        {location.description && <p className="mt-4 text-sm leading-relaxed">{location.description}</p>}

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="Rating" value={avgRating ? avgRating.toFixed(1) : "—"} />
          <Stat label="Recommend" value={recommendPct !== null ? `${recommendPct}%` : "—"} />
          <Stat label="Reviews" value={String(reviews.length)} />
        </div>

        {location.website && (
          <a
            href={location.website}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground border-2 border-outline shadow-brutal-sm text-xs font-semibold"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>open_in_new</span>
            Visit website
          </a>
        )}
      </div>

      <section>
        <h2 className="font-display text-xl font-bold mb-3">Community reviews</h2>
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground p-6 rounded-xl border-2 border-dashed border-outline/30 text-center">
            No reviews yet. Be the first to share.
          </p>
        )}
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-xl border-2 border-outline/40 bg-surface">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm">{(r as any).profiles?.display_name ?? "Anonymous"}</span>
                <span className="text-xs font-bold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="text-sm">{r.comment}</p>}
              {(r.pros || r.cons) && (
                <div className="mt-2 text-xs grid grid-cols-2 gap-2">
                  {r.pros && <div><span className="font-bold text-primary">+ </span>{r.pros}</div>}
                  {r.cons && <div><span className="font-bold text-destructive">− </span>{r.cons}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface border-2 border-outline/20">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold mt-0.5">{value}</div>
    </div>
  );
}

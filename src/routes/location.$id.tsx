import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLocation, submitPost, submitReview, deletePost } from "@/lib/atlas.functions";
import { CATEGORY_LABEL, type LocationCategory } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const locationQuery = (id: string) =>
  queryOptions({ queryKey: ["location", id], queryFn: () => getLocation({ data: { id } }) });

export const Route = createFileRoute("/location/$id")({
  head: () => ({
    meta: [
      { title: "Location — Berlin Founder Atlas" },
      { name: "description", content: "Details, reviews and community discussion for this Berlin startup ecosystem location." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(locationQuery(params.id)),
  component: LocationPage,
  errorComponent: ({ error, reset }) => (
    <div className="p-8 max-w-2xl mx-auto">
      <p className="text-sm text-destructive mb-3">Couldn't load: {error.message}</p>
      <button onClick={reset} className="text-xs font-semibold underline">Retry</button>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Location not found.</div>,
});

function useCurrentUserId() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, s) => setUid(s?.user?.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return uid;
}

function LocationPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(locationQuery(id));
  const { location, reviews, posts, events, avgRating, recommendPct } = data;
  const uid = useCurrentUserId();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-primary">← Discover</Link>

      {/* Header card */}
      <div className="p-6 rounded-2xl bg-surface-container border-2 border-outline shadow-brutal">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          {CATEGORY_LABEL[location.category as LocationCategory]}
        </span>
        <h1 className="font-display text-3xl font-bold mt-1">{location.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {[location.address, location.district ?? "Berlin"].filter(Boolean).join(" · ")}
        </p>
        {location.description && <p className="mt-4 text-sm leading-relaxed">{location.description}</p>}

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Stat label="Rating" value={avgRating ? avgRating.toFixed(1) : "—"} />
          <Stat label="Recommend" value={recommendPct !== null ? `${recommendPct}%` : "—"} />
          <Stat label="Reviews" value={String(reviews.length)} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {location.website && (
            <a
              href={location.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground border-2 border-outline shadow-brutal-sm text-xs font-semibold"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>open_in_new</span>
              Visit website
            </a>
          )}
          {location.lat && location.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border-2 border-outline shadow-brutal-sm text-xs font-semibold"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>directions</span>
              Directions
            </a>
          )}
        </div>
      </div>

      {events && events.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl font-bold">Upcoming events here</h2>
            <span className="text-xs text-muted-foreground">{events.length}</span>
          </div>
          <div className="space-y-2">
            {events.map((e: any) => {
              const d = new Date(e.starts_at);
              return (
                <a
                  key={e.id}
                  href={e.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 items-start p-4 rounded-xl border-2 border-outline bg-surface hover:bg-surface-container transition-colors"
                >
                  <div className="size-12 shrink-0 rounded-lg bg-primary text-primary-foreground border-2 border-outline grid place-items-center font-display">
                    <span className="text-[10px] font-bold uppercase">{d.toLocaleString("en", { month: "short" })}</span>
                    <span className="text-base font-bold leading-none -mt-0.5">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm">{e.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.toLocaleDateString("en", { weekday: "short" })} · {d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                      {e.host ? ` · ${e.host}` : ""}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Review composer */}
      <ReviewComposer locationId={id} disabled={!uid} />


      {/* Reviews */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">Community reviews</h2>
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground p-6 rounded-xl border-2 border-dashed border-outline/30 text-center">
            No reviews yet. Be the first to share.
          </p>
        )}
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="p-4 rounded-xl border-2 border-outline/40 bg-surface">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm">{r.author?.display_name ?? "Anonymous"}</span>
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

      {/* Discussion */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl font-bold">Discussion</h2>
          <span className="text-xs text-muted-foreground">{posts.length} posts</span>
        </div>
        <PostComposer locationId={id} disabled={!uid} />
        <div className="space-y-3 mt-4">
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground p-6 rounded-xl border-2 border-dashed border-outline/30 text-center">
              Start the conversation. Ask a question or share a tip.
            </p>
          )}
          {posts.map((p: any) => (
            <PostItem key={p.id} post={p} currentUserId={uid} locationId={id} />
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

function PostComposer({ locationId, disabled }: { locationId: string; disabled: boolean }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const submit = useServerFn(submitPost);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await submit({ data: { location_id: locationId, body: body.trim() } });
      setBody("");
      await qc.invalidateQueries({ queryKey: ["location", locationId] });
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <div className="p-4 rounded-xl border-2 border-dashed border-outline/30 text-sm text-muted-foreground text-center">
        <Link to="/login" className="font-semibold text-primary underline">Sign in</Link> to join the discussion.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-4 rounded-xl bg-surface border-2 border-outline/40 space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a tip, ask a question, post an update…"
        maxLength={2000}
        rows={3}
        className="w-full bg-transparent text-sm resize-none focus:outline-none"
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground">{body.length}/2000</span>
        <button
          type="submit"
          disabled={!body.trim() || busy}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground border-2 border-outline shadow-brutal-sm text-xs font-semibold disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}

function PostItem({ post, currentUserId, locationId }: { post: any; currentUserId: string | null; locationId: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deletePost);
  const isMine = currentUserId && post.user_id === currentUserId;

  async function onDelete() {
    if (!confirm("Delete this post?")) return;
    await del({ data: { id: post.id } });
    await qc.invalidateQueries({ queryKey: ["location", locationId] });
  }

  return (
    <div className="p-4 rounded-xl border-2 border-outline/40 bg-surface">
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold text-sm">{post.author?.display_name ?? "Anonymous"}</span>
        <span className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{post.body}</p>
      {isMine && (
        <button onClick={onDelete} className="mt-2 text-[10px] uppercase tracking-widest text-destructive font-semibold">
          Delete
        </button>
      )}
    </div>
  );
}

function ReviewComposer({ locationId, disabled }: { locationId: string; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [recommend, setRecommend] = useState(true);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const submit = useServerFn(submitReview);

  if (disabled) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await submit({
        data: {
          location_id: locationId,
          rating,
          would_recommend: recommend,
          pros: pros || undefined,
          cons: cons || undefined,
          comment: comment || undefined,
        },
      });
      setOpen(false);
      setPros(""); setCons(""); setComment("");
      await qc.invalidateQueries({ queryKey: ["location", locationId] });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full p-3 rounded-xl border-2 border-outline/30 text-sm font-semibold hover:bg-surface-container"
      >
        + Write a review
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="p-4 rounded-xl bg-surface border-2 border-outline space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest">Rating</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className="text-xl">
            {n <= rating ? "★" : "☆"}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} />
        I'd recommend this to other founders
      </label>
      <input value={pros} onChange={(e) => setPros(e.target.value)} placeholder="Pros (optional)" maxLength={500} className="w-full text-sm bg-transparent border-b-2 border-outline/30 py-2 focus:outline-none focus:border-primary" />
      <input value={cons} onChange={(e) => setCons(e.target.value)} placeholder="Cons (optional)" maxLength={500} className="w-full text-sm bg-transparent border-b-2 border-outline/30 py-2 focus:outline-none focus:border-primary" />
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Anything else? (optional)" maxLength={1000} rows={3} className="w-full text-sm bg-transparent resize-none focus:outline-none" />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-xs font-semibold">Cancel</button>
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-full bg-primary text-primary-foreground border-2 border-outline shadow-brutal-sm text-xs font-semibold disabled:opacity-50">
          {busy ? "Saving…" : "Submit review"}
        </button>
      </div>
    </form>
  );
}

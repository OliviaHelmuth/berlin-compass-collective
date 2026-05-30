import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureWelcomeBerlinEvents } from "@/lib/welcome-events.server";

export const getLocations = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("locations")
    .select("id, name, category, lat, lng, address, district, description, website")
    .eq("approved", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data;
});

export const getLocation = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const [{ data: location, error }, { data: reviews, error: rErr }, { data: posts, error: pErr }] = await Promise.all([
      supabaseAdmin.from("locations").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("reviews")
        .select("id, rating, would_recommend, pros, cons, comment, created_at, user_id, author:profiles!reviews_user_id_profiles_fkey(display_name, avatar_url)")
        .eq("location_id", data.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("location_posts")
        .select("id, body, created_at, user_id, author:profiles!location_posts_user_id_fkey(display_name, avatar_url)")
        .eq("location_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!location) throw new Error("Location not found");
    if (rErr) throw new Error(rErr.message);
    if (pErr) throw new Error(pErr.message);
    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
      : null;
    const recommendPct = reviews && reviews.length > 0
      ? Math.round((reviews.filter((r) => r.would_recommend).length / reviews.length) * 100)
      : null;
    return { location, reviews: reviews ?? [], posts: posts ?? [], avgRating, recommendPct };
  });

export const getEvents = createServerFn({ method: "GET" }).handler(async () => {
  await ensureWelcomeBerlinEvents();

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
});

export const getOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      location_id: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      would_recommend: z.boolean(),
      pros: z.string().max(500).optional(),
      cons: z.string().max(500).optional(),
      comment: z.string().max(1000).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reviews").upsert(
      { ...data, user_id: userId },
      { onConflict: "location_id,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const submitPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      location_id: z.string().uuid(),
      body: z.string().min(1).max(2000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("location_posts").insert({ ...data, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("location_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

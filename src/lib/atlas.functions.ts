import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    const [{ data: location, error }, { data: reviews, error: rErr }] = await Promise.all([
      supabaseAdmin.from("locations").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("reviews")
        .select("id, rating, would_recommend, pros, cons, comment, created_at, user_id, profiles:profiles!reviews_user_id_fkey(display_name, avatar_url)")
        .eq("location_id", data.id)
        .order("created_at", { ascending: false }),
    ]);
    if (error) throw new Error(error.message);
    if (!location) throw new Error("Location not found");
    if (rErr) throw new Error(rErr.message);
    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
      : null;
    const recommendPct = reviews && reviews.length > 0
      ? Math.round((reviews.filter((r) => r.would_recommend).length / reviews.length) * 100)
      : null;
    return { location, reviews: reviews ?? [], avgRating, recommendPct };
  });

export const getEvents = createServerFn({ method: "GET" }).handler(async () => {
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

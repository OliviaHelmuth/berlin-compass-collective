import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { rankBy, type UserProfileTags } from "@/lib/recommend";

const OnboardingSchema = z.object({
  role: z.string().min(1).max(60),
  stage: z.string().min(1).max(60),
  industries: z.array(z.string().min(1).max(60)).max(40),
  looking_for: z.array(z.string().min(1).max(60)).max(40),
  background: z.array(z.string().min(1).max(60)).max(40),
  arrival_status: z.string().max(60).optional().nullable(),
  residence_status: z.string().max(60).optional().nullable(),
  german_level: z.string().max(60).optional().nullable(),
  current_focus: z.array(z.string().min(1).max(60)).max(40).optional(),
  interests: z.array(z.string().min(1).max(60)).max(60).optional(),
  district: z.string().max(80).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => OnboardingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ ...data, onboarded_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, role, stage, industries, looking_for, background, arrival_status, residence_status, german_level, current_focus, interests, district, bio, onboarded_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });


export const getPersonalizedFeed = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid().nullable().optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    // Pull user tags (public read on profiles is allowed by RLS)
    let user: UserProfileTags = {};
    if (data.userId) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("role, stage, industries, looking_for, background, interests, current_focus")
        .eq("id", data.userId)
        .maybeSingle();
      if (p) user = p as UserProfileTags;
    }

    const [{ data: events }, { data: opps }, { data: locations }] = await Promise.all([
      supabaseAdmin
        .from("events")
        .select("id, title, description, starts_at, venue, district, host, category, tags, url")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(50),
      supabaseAdmin
        .from("opportunities")
        .select("id, title, org, description, deadline, opp_type, district, tags, url, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("locations")
        .select("id, name, category, district, description, website, tags")
        .eq("approved", true)
        .limit(80),
    ]);

    return {
      events: rankBy(user, events ?? [], 6),
      opportunities: rankBy(user, opps ?? [], 6),
      locations: rankBy(user, locations ?? [], 6),
      personalized: Boolean(data.userId && (user.industries?.length || user.looking_for?.length)),
    };
  });

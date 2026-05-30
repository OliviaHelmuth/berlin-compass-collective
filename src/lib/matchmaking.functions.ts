import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAi } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  query: z.string().min(3).max(600),
});

const ResultSchema = z.object({
  summary: z.string(),
  picks: z
    .array(
      z.object({
        kind: z.enum(["location", "event", "opportunity"]),
        id: z.string(),
        title: z.string(),
        why: z.string(),
      }),
    )
    .min(1)
    .max(5),
});

export const matchmake = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const [{ data: locs }, { data: events }, { data: opps }] = await Promise.all([
      supabaseAdmin
        .from("locations")
        .select("id, name, category, district, description, tags")
        .eq("approved", true)
        .limit(120),
      supabaseAdmin
        .from("events")
        .select("id, title, description, starts_at, host, district, tags")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(40),
      supabaseAdmin
        .from("opportunities")
        .select("id, title, org, description, opp_type, deadline, tags")
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

    const catalog = {
      locations: (locs ?? []).map((l) => ({
        id: l.id,
        title: l.name,
        category: l.category,
        district: l.district,
        tags: l.tags,
        blurb: (l.description ?? "").slice(0, 220),
      })),
      events: (events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        when: e.starts_at,
        host: e.host,
        tags: e.tags,
        blurb: (e.description ?? "").slice(0, 180),
      })),
      opportunities: (opps ?? []).map((o) => ({
        id: o.id,
        title: o.title,
        org: o.org,
        type: o.opp_type,
        deadline: o.deadline,
        tags: o.tags,
        blurb: (o.description ?? "").slice(0, 180),
      })),
    };

    const ai = createLovableAi(apiKey);
    const model = ai("google/gemini-2.5-flash");

    const system = `You are a Berlin startup ecosystem concierge. Given a founder's situation, pick the 3-5 best matches from the provided catalog. Always return ids that exist in the catalog. "kind" must match where the id came from (location, event, opportunity). Each "why" is one specific sentence — no fluff. The "summary" is one warm sentence framing the picks.`;

    const prompt = `Founder asked: "${data.query}"\n\nCatalog (JSON):\n${JSON.stringify(catalog).slice(0, 60000)}`;

    const { object } = await generateObject({
      model,
      system,
      prompt,
      schema: ResultSchema,
    });

    const validIds: Record<"location" | "event" | "opportunity", Set<string>> = {
      location: new Set(catalog.locations.map((x) => x.id)),
      event: new Set(catalog.events.map((x) => x.id)),
      opportunity: new Set(catalog.opportunities.map((x) => x.id)),
    };
    const picks = object.picks.filter((p) => validIds[p.kind].has(p.id));
    return { summary: object.summary, picks };
  });


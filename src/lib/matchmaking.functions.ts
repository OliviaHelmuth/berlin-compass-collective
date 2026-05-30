import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateObject } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAi } from "@/lib/ai-gateway.server";

const InputSchema = z.object({
  query: z.string().min(3).max(600),
});

const PickSchema = z.object({
  kind: z.string(),
  id: z.string(),
  title: z.string(),
  why: z.string(),
});
const ResultSchema = z.object({
  summary: z.string(),
  picks: z.array(PickSchema).max(8),
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
        .limit(60),
      supabaseAdmin
        .from("events")
        .select("id, title, description, starts_at, host, district, tags")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(20),
      supabaseAdmin
        .from("opportunities")
        .select("id, title, org, description, opp_type, deadline, tags")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const catalog = {
      locations: (locs ?? []).map((l) => ({
        id: l.id,
        title: l.name,
        category: l.category,
        district: l.district,
        tags: l.tags,
        blurb: (l.description ?? "").slice(0, 140),
      })),
      events: (events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        when: e.starts_at,
        host: e.host,
        tags: e.tags,
        blurb: (e.description ?? "").slice(0, 120),
      })),
      opportunities: (opps ?? []).map((o) => ({
        id: o.id,
        title: o.title,
        org: o.org,
        type: o.opp_type,
        deadline: o.deadline,
        tags: o.tags,
        blurb: (o.description ?? "").slice(0, 120),
      })),
    };

    const ai = createLovableAi(apiKey);

    const system = `You are a Berlin startup ecosystem concierge. Given a founder's situation, pick the 3-5 best matches from the provided catalog.

Rules:
- Use ONLY ids that appear in the catalog.
- "kind" must be exactly one of: "location", "event", "opportunity" — matching where the id came from.
- Each "why" is ONE specific sentence explaining the fit. No fluff, no generic praise.
- "summary" is one warm sentence framing the picks for the founder.
- Return 3 to 5 picks.`;

    const prompt = `Founder asked: "${data.query}"\n\nCatalog (JSON):\n${JSON.stringify(catalog).slice(0, 50000)}`;

    async function tryGenerate(modelId: string) {
      return generateObject({
        model: ai(modelId),
        system,
        prompt,
        schema: ResultSchema,
      });
    }

    let object;
    try {
      ({ object } = await tryGenerate("google/gemini-3-flash-preview"));
    } catch (e1) {
      console.warn("[match] flash failed, falling back to pro", e1);
      ({ object } = await tryGenerate("google/gemini-2.5-pro"));
    }

    const validKinds = new Set(["location", "event", "opportunity"]);
    const validIds: Record<string, Set<string>> = {
      location: new Set(catalog.locations.map((x) => x.id)),
      event: new Set(catalog.events.map((x) => x.id)),
      opportunity: new Set(catalog.opportunities.map((x) => x.id)),
    };
    const picks = object.picks
      .map((p) => ({ ...p, kind: p.kind.toLowerCase().trim() }))
      .filter((p) => validKinds.has(p.kind) && validIds[p.kind].has(p.id))
      .slice(0, 5) as Array<{ kind: "location" | "event" | "opportunity"; id: string; title: string; why: string }>;

    return { summary: object.summary, picks };
  });


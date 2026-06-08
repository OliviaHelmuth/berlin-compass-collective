import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
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

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in model response");
  }
  return candidate.slice(start, end + 1);
}

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

You MUST respond with ONLY a JSON object (no prose, no markdown fences) matching exactly this shape:
{
  "summary": "one warm sentence framing the picks for the founder",
  "picks": [
    { "kind": "location" | "event" | "opportunity", "id": "<id from catalog>", "title": "<title from catalog>", "why": "one specific sentence on the fit" }
  ]
}

Rules:
- Use ONLY ids that appear in the catalog. Never invent ids.
- "kind" must match where the id came from in the catalog (locations -> "location", events -> "event", opportunities -> "opportunity").
- Each "why" is ONE specific sentence. No fluff, no generic praise.
- Return 3 to 5 picks.`;

    const prompt = `Founder asked: "${data.query}"\n\nCatalog (JSON):\n${JSON.stringify(catalog).slice(0, 50000)}\n\nReturn the JSON object now.`;

    async function tryGenerate(modelId: string) {
      const { text } = await generateText({
        model: ai(modelId),
        system,
        prompt,
      });
      const json = extractJson(text);
      const parsed = JSON.parse(json);
      return ResultSchema.parse(parsed);
    }

    let object: z.infer<typeof ResultSchema>;
    try {
      object = await tryGenerate("google/gemini-2.5-flash");
    } catch (e1: any) {
      const msg = String(e1?.message ?? e1);
      if (msg.includes("429")) throw new Error("429 Rate limit reached. Please retry in a few seconds.");
      if (msg.includes("402")) throw new Error("402 AI credits exhausted for this workspace.");
      console.warn("[match] flash failed, falling back to pro:", msg);
      try {
        object = await tryGenerate("google/gemini-2.5-pro");
      } catch (e2: any) {
        const msg2 = String(e2?.message ?? e2);
        if (msg2.includes("429")) throw new Error("429 Rate limit reached. Please retry in a few seconds.");
        if (msg2.includes("402")) throw new Error("402 AI credits exhausted for this workspace.");
        console.error("[match] pro also failed:", msg2);
        throw new Error("AI returned an unreadable response. Try rephrasing your request.");
      }
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


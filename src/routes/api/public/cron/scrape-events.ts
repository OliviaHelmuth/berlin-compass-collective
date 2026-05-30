import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";
import { generateObject } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAi } from "@/lib/ai-gateway.server";

type ScrapeRow = {
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue: string | null;
  district: string | null;
  host: string | null;
  url: string;
  category: string | null;
  tags: string[];
  source: string;
  external_id: string;
};

const EventSchema = z.object({
  title: z.string().min(2).max(200),
  starts_at: z.string().describe("ISO 8601 datetime. If only a date is shown, use 18:00 Europe/Berlin."),
  ends_at: z.string().nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  district: z.string().max(80).nullable().optional(),
  host: z.string().max(200).nullable().optional(),
  description: z.string().max(800).nullable().optional(),
  url: z.string().url(),
  category: z.string().max(80).nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(8).default([]),
});

const ListingSchema = z.object({ events: z.array(EventSchema).max(40) });
const SingleEventSchema = z.object({ event: EventSchema.nullable() });

const SYSTEM_TAGS =
  "Tag from this vocabulary when relevant: AI, ClimateTech, DeepTech, Web3, SaaS, Fintech, Biotech, Health, Robotics, Hardware, Founder, Funding, Pitch, Networking, Workshop, Conference.";

export const Route = createFileRoute("/api/public/cron/scrape-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return jsonErr("Unauthorized", 401);
        }

        const fcKey = process.env.FIRECRAWL_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!fcKey) return jsonErr("FIRECRAWL_API_KEY missing", 500);
        if (!lovableKey) return jsonErr("LOVABLE_API_KEY missing", 500);

        const firecrawl = new Firecrawl({ apiKey: fcKey });
        const ai = createLovableAi(lovableKey);
        const model = ai("google/gemini-2.5-flash");

        const sources: Record<string, unknown>[] = [];
        let totalUpserted = 0;

        // 1. welcomeberlin.net — static listing
        sources.push(
          await runListing({
            firecrawl,
            model,
            id: "welcomeberlin",
            url: "https://welcomeberlin.net/networking-events/",
            label: "Welcome Berlin",
            waitFor: 0,
          }).then((r) => {
            totalUpserted += r.upserted ?? 0;
            return r;
          }),
        );

        // 2. Silicon Allee — static listing
        sources.push(
          await runListing({
            firecrawl,
            model,
            id: "silicon-allee",
            url: "https://www.siliconallee.com/events",
            label: "Silicon Allee",
            waitFor: 0,
          }).then((r) => {
            totalUpserted += r.upserted ?? 0;
            return r;
          }),
        );

        // 3. Lu.ma — two-stage with JS rendering
        sources.push(
          await runLuma({ firecrawl, model }).then((r) => {
            totalUpserted += r.upserted ?? 0;
            return r;
          }),
        );

        return new Response(
          JSON.stringify(
            { ok: true, ranAt: new Date().toISOString(), totalUpserted, sources },
            null,
            2,
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});

async function runListing(args: {
  firecrawl: Firecrawl;
  model: ReturnType<ReturnType<typeof createLovableAi>>;
  id: string;
  url: string;
  label: string;
  waitFor: number;
}): Promise<Record<string, unknown> & { upserted?: number }> {
  const { firecrawl, model, id, url, label, waitFor } = args;
  const entry: Record<string, unknown> & { upserted?: number } = { id, url };
  try {
    const scrape = await firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: waitFor || undefined,
    });
    const markdown = extractMarkdown(scrape);
    if (!markdown) {
      entry.error = "no markdown";
      return entry;
    }
    const { object } = await generateObject({
      model,
      schema: ListingSchema,
      system: `You extract upcoming Berlin startup/tech/networking events from a listing page. Only events with a clear future date. Use Europe/Berlin timezone. ${SYSTEM_TAGS} Use the absolute event detail URL when present, otherwise the listing URL.`,
      prompt: `Source: ${label} (${url})\n\nMARKDOWN:\n${markdown.slice(0, 30_000)}`,
    });
    const rows = toRows(object.events, id, label);
    entry.upserted = await upsertRows(rows);
    return entry;
  } catch (e) {
    entry.error = e instanceof Error ? e.message : String(e);
    return entry;
  }
}

async function runLuma(args: {
  firecrawl: Firecrawl;
  model: ReturnType<ReturnType<typeof createLovableAi>>;
}): Promise<Record<string, unknown> & { upserted?: number }> {
  const { firecrawl, model } = args;
  const entry: Record<string, unknown> & { upserted?: number } = {
    id: "luma",
    url: "https://lu.ma/berlin",
  };
  try {
    // Stage 1: get rendered links
    const listing = await firecrawl.scrape("https://lu.ma/berlin", {
      formats: ["links"],
      onlyMainContent: false,
      waitFor: 3500,
    });
    const links =
      (listing as { links?: string[] }).links ??
      (listing as { data?: { links?: string[] } }).data?.links ??
      [];
    const exclude =
      /^https:\/\/lu\.ma\/(discover|signin|home|cities|u\/|create|pricing|help|about|terms|privacy|events|berlin|search)/i;
    const eventUrls = Array.from(
      new Set(
        links
          .filter((l) => typeof l === "string" && /^https:\/\/lu\.ma\/[a-z0-9-]{4,}$/i.test(l))
          .filter((l) => !exclude.test(l)),
      ),
    ).slice(0, 15);

    entry.candidates = eventUrls.length;

    if (eventUrls.length === 0) {
      entry.error = "no event links found";
      return entry;
    }

    // Stage 2: scrape each detail page in parallel
    const detailResults = await Promise.allSettled(
      eventUrls.map(async (eventUrl) => {
        const detail = await firecrawl.scrape(eventUrl, {
          formats: ["markdown"],
          onlyMainContent: true,
          waitFor: 2000,
        });
        const md = extractMarkdown(detail);
        if (!md) return null;
        const { object } = await generateObject({
          model,
          schema: SingleEventSchema,
          system: `You extract a single upcoming event from a Lu.ma event detail page. Use Europe/Berlin timezone. The url field MUST be exactly "${eventUrl}". ${SYSTEM_TAGS} If no future event, return null.`,
          prompt: md.slice(0, 15_000),
        });
        if (!object.event) return null;
        return { ...object.event, url: eventUrl };
      }),
    );

    const parsed = detailResults
      .filter((r): r is PromiseFulfilledResult<z.infer<typeof EventSchema> | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((e): e is z.infer<typeof EventSchema> => e !== null);

    const rows = toRows(parsed, "luma", "Lu.ma");
    entry.upserted = await upsertRows(rows);
    return entry;
  } catch (e) {
    entry.error = e instanceof Error ? e.message : String(e);
    return entry;
  }
}

function toRows(
  events: z.infer<typeof EventSchema>[],
  source: string,
  label: string,
): ScrapeRow[] {
  return events
    .filter((e) => {
      const t = new Date(e.starts_at).getTime();
      return Number.isFinite(t) && t > Date.now() - 86_400_000;
    })
    .map((e) => ({
      title: e.title,
      description: e.description ?? null,
      starts_at: new Date(e.starts_at).toISOString(),
      ends_at: e.ends_at ? new Date(e.ends_at).toISOString() : null,
      venue: e.venue ?? null,
      district: e.district ?? null,
      host: e.host ?? label,
      url: e.url,
      category: e.category ?? null,
      tags: e.tags ?? [],
      source,
      external_id: e.url,
    }));
}

async function upsertRows(rows: ScrapeRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const { error } = await supabaseAdmin
    .from("events")
    .upsert(rows, { onConflict: "source,external_id" });
  if (error) throw new Error(error.message);
  return rows.length;
}

function extractMarkdown(scrape: unknown): string {
  const s = scrape as { markdown?: string; data?: { markdown?: string } };
  return s.markdown ?? s.data?.markdown ?? "";
}

function jsonErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

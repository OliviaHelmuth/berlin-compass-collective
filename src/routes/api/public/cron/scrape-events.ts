import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import Firecrawl from "@mendable/firecrawl-js";
import { generateObject } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createLovableAi } from "@/lib/ai-gateway.server";

const SOURCES = [
  { id: "luma", url: "https://lu.ma/berlin", label: "Lu.ma Berlin" },
  { id: "silicon-allee", url: "https://www.siliconallee.com/events", label: "Silicon Allee" },
] as const;

const EventSchema = z.object({
  title: z.string().min(2).max(200),
  starts_at: z.string().describe("ISO 8601 datetime. If only a date is shown, use 18:00 local Berlin time."),
  ends_at: z.string().nullable().optional(),
  venue: z.string().max(200).nullable().optional(),
  district: z.string().max(80).nullable().optional(),
  host: z.string().max(200).nullable().optional(),
  description: z.string().max(800).nullable().optional(),
  url: z.string().url(),
  category: z.string().max(80).nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(8).default([]),
});

const ExtractionSchema = z.object({
  events: z.array(EventSchema).max(40),
});

export const Route = createFileRoute("/api/public/cron/scrape-events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-api-key");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const fcKey = process.env.FIRECRAWL_API_KEY;
        const lovableKey = process.env.LOVABLE_API_KEY;
        if (!fcKey) return jsonErr("FIRECRAWL_API_KEY missing", 500);
        if (!lovableKey) return jsonErr("LOVABLE_API_KEY missing", 500);

        const firecrawl = new Firecrawl({ apiKey: fcKey });
        const ai = createLovableAi(lovableKey);
        const model = ai("google/gemini-2.5-flash");

        const report: Record<string, unknown> = { sources: [] as unknown[] };
        let totalUpserted = 0;
        const now = new Date().toISOString();

        for (const src of SOURCES) {
          const entry: Record<string, unknown> = { id: src.id, url: src.url };
          try {
            const scrape = await firecrawl.scrape(src.url, {
              formats: ["markdown"],
              onlyMainContent: true,
            });
            const markdown =
              (scrape as { markdown?: string }).markdown ??
              (scrape as { data?: { markdown?: string } }).data?.markdown ??
              "";
            if (!markdown) {
              entry.error = "no markdown";
              (report.sources as unknown[]).push(entry);
              continue;
            }

            const { object } = await generateObject({
              model,
              schema: ExtractionSchema,
              system:
                "You extract upcoming Berlin startup/tech events from a listing page. Only include events with a clear date in the future. Use Berlin timezone (Europe/Berlin) when converting to ISO. Tag each event from this controlled vocabulary when relevant: AI, ClimateTech, DeepTech, Web3, SaaS, Fintech, Biotech, Health, Robotics, Hardware, Founder, Funding, Pitch, Networking, Workshop, Conference. Use the absolute event detail URL when present, otherwise the listing URL.",
              prompt: `Source: ${src.label} (${src.url})\n\nMARKDOWN:\n${markdown.slice(0, 30_000)}`,
            });

            const rows = object.events
              .filter((e) => new Date(e.starts_at).getTime() > Date.now() - 86_400_000)
              .map((e) => ({
                title: e.title,
                description: e.description ?? null,
                starts_at: new Date(e.starts_at).toISOString(),
                ends_at: e.ends_at ? new Date(e.ends_at).toISOString() : null,
                venue: e.venue ?? null,
                district: e.district ?? null,
                host: e.host ?? src.label,
                url: e.url,
                category: e.category ?? null,
                tags: e.tags ?? [],
                source: src.id,
                external_id: e.url,
              }));

            if (rows.length > 0) {
              const { error } = await supabaseAdmin
                .from("events")
                .upsert(rows, { onConflict: "source,external_id" });
              if (error) {
                entry.error = error.message;
              } else {
                entry.upserted = rows.length;
                totalUpserted += rows.length;
              }
            } else {
              entry.upserted = 0;
            }
          } catch (e) {
            entry.error = e instanceof Error ? e.message : String(e);
          }
          (report.sources as unknown[]).push(entry);
        }

        return new Response(
          JSON.stringify({ ok: true, ranAt: now, totalUpserted, ...report }, null, 2),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});

function jsonErr(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

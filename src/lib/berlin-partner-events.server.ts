import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const URL = "https://www.berlin-partner.de/events";
const SOURCE = "berlin-partner";

type ParsedEvent = {
  title: string;
  starts_at: string; // ISO
  ends_at?: string | null;
  venue?: string | null;
  description?: string | null;
  url?: string | null;
};

const DAY_MS = 86_400_000;

export async function ensureBerlinPartnerEvents() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return; // connector not linked
  try {
    // Check if we've recently synced (any berlin-partner row with a future date)
    const { count } = await supabaseAdmin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("source", SOURCE)
      .gte("starts_at", new Date().toISOString());
    if ((count ?? 0) > 0) return;
    await syncBerlinPartnerEvents();
  } catch (e) {
    console.error("Berlin Partner sync failed", e);
  }
}

export async function syncBerlinPartnerEvents(): Promise<{ parsed: number; upserted: number }> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY not configured");
  const fc = new Firecrawl({ apiKey });

  const result: any = await fc.scrape(URL, {
    formats: [
      {
        type: "json",
        prompt:
          "Extract every upcoming event from this Berlin Partner events page. " +
          "For each event return: title (string), starts_at (ISO 8601 date or date-time, use Europe/Berlin), " +
          "ends_at (optional ISO), venue (string, e.g. 'Berlin Partner, Fasanenstraße 85'), " +
          "description (one short sentence), url (absolute URL to the event detail page). " +
          "Skip past events. Return a JSON object with key 'events' containing the array.",
      },
    ],
    onlyMainContent: true,
    waitFor: 1500,
  });

  const json = result?.json ?? result?.data?.json ?? {};
  const rawEvents: ParsedEvent[] = Array.isArray(json?.events) ? json.events : Array.isArray(json) ? json : [];

  const now = Date.now();
  const cutoff = now - DAY_MS;
  const rows = rawEvents
    .map((e) => normalize(e))
    .filter((r): r is NonNullable<ReturnType<typeof normalize>> => !!r)
    .filter((r) => new Date(r.starts_at).getTime() >= cutoff);

  if (rows.length === 0) return { parsed: rawEvents.length, upserted: 0 };

  const { error } = await supabaseAdmin
    .from("events")
    .upsert(rows, { onConflict: "external_id" });
  if (error) throw new Error(error.message);

  return { parsed: rawEvents.length, upserted: rows.length };
}

function normalize(e: ParsedEvent) {
  if (!e?.title || !e?.starts_at) return null;
  const startDate = new Date(e.starts_at);
  if (Number.isNaN(startDate.getTime())) return null;
  const url = e.url && /^https?:\/\//.test(e.url) ? e.url : URL;
  const tags = ["Networking"];
  const text = `${e.title} ${e.description ?? ""}`.toLowerCase();
  if (/(ai|ki|automation)/.test(text)) tags.push("AI");
  if (/founder|startup|grü/.test(text)) tags.push("Founder");
  if (/pitch|demo/.test(text)) tags.push("Pitch");
  if (/workshop|training|seminar/.test(text)) tags.push("Workshop");
  if (/invest|funding|kapital|vc\b/.test(text)) tags.push("Funding");

  return {
    title: e.title.slice(0, 200),
    description: e.description?.slice(0, 600) ?? null,
    starts_at: startDate.toISOString(),
    ends_at: e.ends_at ? safeIso(e.ends_at) : null,
    venue: e.venue?.slice(0, 200) ?? "Berlin Partner",
    district: null,
    host: "Berlin Partner",
    url,
    category: "Networking",
    tags,
    source: SOURCE,
    external_id: `${SOURCE}:${slug(e.title)}:${startDate.toISOString().slice(0, 10)}`,
  };
}

function safeIso(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

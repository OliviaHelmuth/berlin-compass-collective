import Firecrawl from "@mendable/firecrawl-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Category = "university" | "coworking" | "accelerator" | "incubator";

type ScrapedEntity = {
  name: string;
  website?: string | null;
  address?: string | null;
  district?: string | null;
  description?: string | null;
  tags?: string[];
};

type SyncResult = { category: Category; scraped: number; inserted: number; updated: number; errors: string[] };

const SOURCES: { category: Category; url: string }[] = [
  {
    category: "university",
    url: "https://startup-map.berlin/universities/f/all_regions/anyof_Berlin%2FBrandenburg%20Metropolitan%20Region",
  },
  {
    category: "coworking",
    url: "https://startup-map.berlin/companies.workspaces/f/all_regions/anyof_Berlin%2FBrandenburg%20Metropolitan%20Region/company_status/not_closed",
  },
  {
    category: "accelerator",
    url: "https://startup-map.berlin/companies.accelerators/f/all_regions/anyof_Berlin%2FBrandenburg%20Metropolitan%20Region/company_status/not_closed",
  },
  {
    category: "incubator",
    url: "https://startup-map.berlin/companies.incubators/f/all_regions/anyof_Berlin%2FBrandenburg%20Metropolitan%20Region/company_status/not_closed",
  },
];

const EXTRACTION_PROMPT = `Extract every organization listed on this page (scroll through all entries if present).
For each, return: name (required), website (homepage URL if shown), address (street + city if shown),
district (Berlin district like Kreuzberg/Mitte/Charlottenburg if inferable from the address),
description (one-sentence summary if available), tags (focus areas / keywords like AI, DeepTech, Climate, Health, etc.).
Skip closed/dead entries. Return as JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          website: { type: "string" },
          address: { type: "string" },
          district: { type: "string" },
          description: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["name"],
      },
    },
  },
  required: ["entities"],
} as const;

function requireFirecrawl(): string {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) throw new Error("FIRECRAWL_API_KEY not configured");
  return key;
}

async function scrapeSource(url: string): Promise<ScrapedEntity[]> {
  const fc = new Firecrawl({ apiKey: requireFirecrawl() });
  const result: any = await fc.scrape(url, {
    formats: [{ type: "json", schema: SCHEMA as any, prompt: EXTRACTION_PROMPT } as any],
    onlyMainContent: true,
    waitFor: 4000,
  } as any);

  const payload = result?.json ?? result?.data?.json ?? null;
  const entities: ScrapedEntity[] = Array.isArray(payload?.entities) ? payload.entities : [];
  return entities.filter((e) => e?.name && typeof e.name === "string");
}

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  const lak = process.env.LOVABLE_API_KEY;
  const gmk = process.env.GOOGLE_MAPS_API_KEY;
  if (!lak || !gmk) {
    geocodeCache.set(key, null);
    return null;
  }
  try {
    const q = `${address}, Berlin, Germany`;
    const res = await fetch(`${GATEWAY}/maps/api/geocode/json?address=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${lak}`, "X-Connection-Api-Key": gmk },
    });
    const json: any = await res.json();
    const loc = json?.results?.[0]?.geometry?.location;
    const out = loc ? { lat: Number(loc.lat), lng: Number(loc.lng) } : null;
    geocodeCache.set(key, out);
    return out;
  } catch {
    geocodeCache.set(key, null);
    return null;
  }
}

const BERLIN_DISTRICTS = [
  "Mitte", "Kreuzberg", "Friedrichshain", "Prenzlauer Berg", "Neukölln", "Charlottenburg",
  "Wilmersdorf", "Schöneberg", "Tempelhof", "Wedding", "Moabit", "Tiergarten",
  "Treptow", "Köpenick", "Lichtenberg", "Pankow", "Spandau", "Steglitz", "Zehlendorf",
  "Reinickendorf", "Marzahn", "Hellersdorf", "Adlershof",
];

function inferDistrict(address: string | null | undefined): string | null {
  if (!address) return null;
  return BERLIN_DISTRICTS.find((d) => address.includes(d)) ?? null;
}

function normalizeTags(category: Category, entity: ScrapedEntity, district: string | null): string[] {
  const set = new Set<string>();
  set.add(category);
  if (district) set.add(district);
  for (const t of entity.tags ?? []) {
    if (typeof t === "string" && t.trim()) set.add(t.trim());
  }
  return Array.from(set).slice(0, 12);
}

async function syncCategory(category: Category, url: string): Promise<SyncResult> {
  const errors: string[] = [];
  let scraped = 0;
  let inserted = 0;
  let updated = 0;

  let entities: ScrapedEntity[] = [];
  try {
    entities = await scrapeSource(url);
    scraped = entities.length;
  } catch (e: any) {
    errors.push(`scrape failed: ${e?.message ?? String(e)}`);
    return { category, scraped, inserted, updated, errors };
  }

  for (const e of entities) {
    try {
      const address = e.address?.trim() || null;
      const district = e.district?.trim() || inferDistrict(address);
      const tags = normalizeTags(category, e, district);

      // Look up existing
      const { data: existing } = await supabaseAdmin
        .from("locations")
        .select("id, lat, lng")
        .eq("name", e.name)
        .eq("category", category)
        .maybeSingle();

      let lat: number | null = existing?.lat ?? null;
      let lng: number | null = existing?.lng ?? null;
      if ((lat == null || lng == null) && address) {
        const geo = await geocode(address);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }
      // Locations table requires lat/lng NOT NULL. Default to Berlin centre if unknown.
      if (lat == null || lng == null) {
        lat = 52.52;
        lng = 13.405;
      }

      const row = {
        name: e.name,
        category,
        lat,
        lng,
        address,
        district,
        description: e.description?.trim() || null,
        website: e.website?.trim() || null,
        tags,
        approved: true,
      };

      const { error: upsertErr } = await supabaseAdmin
        .from("locations")
        .upsert(row, { onConflict: "name,category" });
      if (upsertErr) {
        errors.push(`${e.name}: ${upsertErr.message}`);
        continue;
      }
      if (existing) updated += 1;
      else inserted += 1;
    } catch (err: any) {
      errors.push(`${e.name}: ${err?.message ?? String(err)}`);
    }
  }

  return { category, scraped, inserted, updated, errors: errors.slice(0, 20) };
}

export async function syncStartupMapAll(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const src of SOURCES) {
    results.push(await syncCategory(src.category, src.url));
  }
  return results;
}

const WEBSITE_SCHEMA = {
  type: "object",
  properties: { website: { type: "string" } },
  required: ["website"],
} as const;

const WEBSITE_PROMPT = `Find the official external website / homepage URL of the organization profiled on this page.
Return ONLY the external homepage (e.g. "https://www.tu-berlin.de"), NOT a startup-map.berlin URL,
NOT a social media link, NOT a LinkedIn/Twitter/Facebook URL. If multiple links are shown, prefer the one
labeled "Website" or the organization's primary domain. Return as JSON: { "website": "https://..." }.`;

async function fetchRealWebsite(detailUrl: string): Promise<string | null> {
  const fc = new Firecrawl({ apiKey: requireFirecrawl() });
  try {
    const result: any = await fc.scrape(detailUrl, {
      formats: [{ type: "json", schema: WEBSITE_SCHEMA as any, prompt: WEBSITE_PROMPT } as any],
      onlyMainContent: true,
      waitFor: 2500,
    } as any);
    const payload = result?.json ?? result?.data?.json ?? null;
    const w = typeof payload?.website === "string" ? payload.website.trim() : "";
    if (!w) return null;
    if (w.includes("startup-map.berlin")) return null;
    if (!/^https?:\/\//i.test(w)) return null;
    return w;
  } catch {
    return null;
  }
}

export async function fixStartupMapWebsites(): Promise<{ checked: number; updated: number; cleared: number; errors: string[] }> {
  const errors: string[] = [];
  let checked = 0;
  let updated = 0;
  let cleared = 0;

  const { data: rows, error } = await supabaseAdmin
    .from("locations")
    .select("id, name, website")
    .like("website", "%startup-map.berlin%");
  if (error) throw new Error(error.message);

  for (const r of rows ?? []) {
    checked += 1;
    const real = await fetchRealWebsite(r.website as string);
    if (real) {
      const { error: upErr } = await supabaseAdmin
        .from("locations")
        .update({ website: real })
        .eq("id", r.id);
      if (upErr) errors.push(`${r.name}: ${upErr.message}`);
      else updated += 1;
    } else {
      const { error: upErr } = await supabaseAdmin
        .from("locations")
        .update({ website: null })
        .eq("id", r.id);
      if (upErr) errors.push(`${r.name}: ${upErr.message}`);
      else cleared += 1;
    }
  }

  return { checked, updated, cleared, errors: errors.slice(0, 30) };
}

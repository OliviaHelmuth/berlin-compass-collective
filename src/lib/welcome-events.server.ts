import { supabaseAdmin } from "@/integrations/supabase/client.server";

const WELCOME_EVENTS_URL = "https://welcomeberlin.net/networking-events/";
const DAY_MS = 86_400_000;

type EventInsert = {
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

export async function ensureWelcomeBerlinEvents() {
  const now = new Date().toISOString();
  const { count, error } = await supabaseAdmin
    .from("events")
    .select("id", { count: "exact", head: true })
    .gte("starts_at", now);

  if (error || (count ?? 0) > 0) return;
  await syncWelcomeBerlinEvents();
}

export async function syncWelcomeBerlinEvents(): Promise<{ parsed: number; upserted: number }> {
  const response = await fetch(WELCOME_EVENTS_URL, {
    headers: { "User-Agent": "Berlin Founder Atlas event importer" },
  });
  if (!response.ok) throw new Error(`Welcome Berlin returned ${response.status}`);

  const html = await response.text();
  const rows = parseWelcomeBerlinEvents(html);
  if (rows.length === 0) return { parsed: 0, upserted: 0 };

  const { error } = await supabaseAdmin
    .from("events")
    .upsert(rows, { onConflict: "source,external_id" });
  if (error) throw new Error(error.message);
  return { parsed: rows.length, upserted: rows.length };
}

function parseWelcomeBerlinEvents(html: string): EventInsert[] {
  const lines = htmlToLines(html);
  const rows: EventInsert[] = [];
  const now = Date.now();

  for (let i = 0; i < lines.length; i += 1) {
    const date = parseDateLine(lines[i]);
    if (!date) continue;

    const nextDateIndex = findNextDateIndex(lines, i + 1);
    const blockEnd = nextDateIndex === -1 ? Math.min(lines.length, i + 28) : nextDateIndex;
    const timeIndex = findIndex(lines, i + 1, blockEnd, (line) => parseTimeLine(line) !== null);
    if (timeIndex === -1) continue;

    const time = parseTimeLine(lines[timeIndex]);
    const titleIndex = findIndex(lines, timeIndex + 1, blockEnd, (line) => isLikelyTitle(line));
    if (!time || titleIndex === -1) continue;

    const title = cleanTitle(lines[titleIndex]);
    const detailLines = lines.slice(titleIndex + 1, blockEnd);
    const whyIndex = detailLines.findIndex((line) => /^(why go|warum hingehen)\s*:/i.test(line));
    const locationText = detailLines
      .slice(0, whyIndex === -1 ? 3 : whyIndex)
      .filter((line) => !line.startsWith("http") && !/reserve|sichere/i.test(line))
      .join(" ");
    const description = whyIndex === -1 ? null : detailLines[whyIndex].replace(/^(why go|warum hingehen)\s*:\s*/i, "");
    const url = firstEventUrl(detailLines) ?? WELCOME_EVENTS_URL;
    const startsAt = toBerlinIso(date.startDay, date.month, time.startHour, time.startMinute);
    const endsAt = toBerlinIso(date.endDay ?? date.startDay, date.month, time.endHour, time.endMinute);

    if (new Date(startsAt).getTime() < now - DAY_MS) continue;

    const { venue, district } = parseLocation(locationText);
    const tags = inferTags(`${title} ${description ?? ""}`);

    rows.push({
      title,
      description,
      starts_at: startsAt,
      ends_at: endsAt,
      venue,
      district,
      host: "Welcome Berlin",
      url,
      category: tags[0] ?? "Networking",
      tags,
      source: "welcomeberlin",
      external_id: `${url}#${startsAt.slice(0, 10)}#${slug(title)}`,
    });
  }

  return rows.slice(0, 60);
}

function htmlToLines(html: string): string[] {
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const withAnchorUrls = withoutScripts.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, label: string) => `\n${stripTags(label)} ${href}\n`,
  );
  return withAnchorUrls
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|div|section|article)>/gi, "\n")
    .split("\n")
    .map((line) => decodeHtml(stripTags(line)).replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function decodeHtml(value: string) {
  const named: Record<string, string> = { amp: "&", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—" };
  return value
    .replace(/&#(\d+);/g, (_m, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_m, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => named[name] ?? match);
}

function parseDateLine(line: string): { startDay: number; endDay: number | null; month: number } | null {
  const match = line.match(/^(\d{2})(?:-(\d{2}))?\/(\d{2})\.$/);
  if (!match) return null;
  return { startDay: Number(match[1]), endDay: match[2] ? Number(match[2]) : null, month: Number(match[3]) };
}

function parseTimeLine(line: string) {
  const match = line.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})\s*(?:hrs|uhr)?$/i);
  if (!match) return null;
  return {
    startHour: Number(match[1]),
    startMinute: Number(match[2]),
    endHour: Number(match[3]),
    endMinute: Number(match[4]),
  };
}

function findNextDateIndex(lines: string[], start: number) {
  return findIndex(lines, start, lines.length, (line) => parseDateLine(line) !== null);
}

function findIndex(lines: string[], start: number, end: number, predicate: (line: string) => boolean) {
  for (let i = start; i < end; i += 1) if (predicate(lines[i])) return i;
  return -1;
}

function isLikelyTitle(line: string) {
  return !parseDateLine(line) && !parseTimeLine(line) && !/^(mon|tue|wed|thu|fri|sat|sun|sam|son|mo|di|mi|do|fr|sa|so)$/i.test(line) && line.length > 2;
}

function cleanTitle(value: string) {
  return value.replace(/\\([#.|])/g, "$1").replace(/\s+/g, " ").trim();
}

function firstEventUrl(lines: string[]) {
  for (const line of lines) {
    const match = line.match(/https?:\/\/[^\s)\]]+/);
    if (!match) continue;
    const url = match[0].replace(/[.,]+$/, "");
    if (/sibforms|welcomeberlin\.net\/wp-content/i.test(url)) continue;
    return url;
  }
  return null;
}

function toBerlinIso(day: number, month: number, hour: number, minute: number) {
  const now = new Date();
  let year = now.getUTCFullYear();
  const offset = month >= 4 && month <= 10 ? "+02:00" : "+01:00";
  let iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${offset}`;
  if (new Date(iso).getTime() < now.getTime() - 60 * DAY_MS) {
    year += 1;
    iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${offset}`;
  }
  return new Date(iso).toISOString();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseLocation(value: string): { venue: string | null; district: string | null } {
  const cleaned = value.replace(/[📍👤🇩🇪]/g, "").replace(/\s*\|\s*/g, " | ").trim();
  const parts = cleaned.split("|").map((part) => part.trim()).filter(Boolean);
  const venue = parts[0]?.replace(/^[*\s]+|[*\s]+$/g, "") ?? null;
  const district = inferDistrict(cleaned);
  return { venue, district };
}

function inferDistrict(value: string) {
  const postal: Record<string, string> = {
    "10115": "Mitte",
    "10117": "Mitte",
    "10178": "Mitte",
    "10179": "Mitte",
    "10405": "Prenzlauer Berg",
    "10435": "Prenzlauer Berg",
    "10551": "Moabit",
    "10587": "Charlottenburg",
    "10623": "Charlottenburg",
    "10785": "Tiergarten",
    "10969": "Kreuzberg",
    "10997": "Kreuzberg",
    "12043": "Neukölln",
    "12053": "Neukölln",
    "12057": "Neukölln",
    "12059": "Neukölln",
    "12435": "Treptow",
  };
  const code = value.match(/\b(10\d{3}|12\d{3})\b/)?.[1];
  if (code && postal[code]) return postal[code];
  return ["Kreuzberg", "Mitte", "Prenzlauer Berg", "Neukölln", "Charlottenburg", "Moabit", "Treptow"].find((d) => value.includes(d)) ?? null;
}

function inferTags(text: string) {
  const tags = new Set<string>(["Networking"]);
  if (/\b(ai|gpt|claude|cursor|huggingface|automation|agentic|prototype)\b/i.test(text)) tags.add("AI");
  if (/founder|startup|cofounder|entrepreneur/i.test(text)) tags.add("Founder");
  if (/pitch|demo/i.test(text)) tags.add("Pitch");
  if (/workshop|hackathon|build|training|learn|coding/i.test(text)) tags.add("Workshop");
  if (/funding|investor|capital|vc\b/i.test(text)) tags.add("Funding");
  if (/climate/i.test(text)) tags.add("ClimateTech");
  return Array.from(tags).slice(0, 6);
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
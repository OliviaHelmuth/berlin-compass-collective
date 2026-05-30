// Match an event venue/title to one of the known locations (universities,
// coworking spaces, hubs, etc.) by name. Pure string heuristics — runs on
// both server and client.

export type MatchableLocation = {
  id: string;
  name: string;
};

function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[.,/()&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchEventToLocation<L extends MatchableLocation>(
  event: { venue?: string | null; title?: string | null; description?: string | null },
  locations: L[],
): L | null {
  const hay = `${normalize(event.venue)} ${normalize(event.title)} ${normalize(event.description)}`.trim();
  if (!hay) return null;

  let best: L | null = null;
  let bestScore = 0;

  for (const loc of locations) {
    const n = normalize(loc.name);
    if (!n) continue;
    const first = n.split(" ")[0];
    let score = 0;

    if (n.length >= 4 && hay.includes(n)) {
      score = n.length + 10; // strong full-name match
    } else if (n.length >= 4 && normalize(event.venue).includes(n.split(" ").slice(0, 2).join(" "))) {
      score = n.length + 5;
    } else if (first.length >= 6 && normalize(event.venue).split(" ").includes(first)) {
      score = first.length;
    }

    if (score > bestScore) {
      bestScore = score;
      best = loc;
    }
  }

  return best;
}

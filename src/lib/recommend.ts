// Simple weighted tag-overlap scorer for personalized recommendations.

export type UserProfileTags = {
  role?: string | null;
  stage?: string | null;
  industries?: string[] | null;
  looking_for?: string[] | null;
  background?: string[] | null;
  interests?: string[] | null;
  current_focus?: string[] | null;
};

const norm = (s: string) => s.toLowerCase().trim();

export function scoreItem(
  user: UserProfileTags,
  item: { tags?: string[] | null; category?: string | null; created_at?: string | null; starts_at?: string | null },
): number {
  const itemTags = new Set((item.tags ?? []).map(norm));
  if (item.category) itemTags.add(norm(item.category));

  let score = 0;
  for (const t of user.interests ?? []) if (itemTags.has(norm(t))) score += 4;
  for (const t of user.industries ?? []) if (itemTags.has(norm(t))) score += 3;
  for (const t of user.looking_for ?? []) if (itemTags.has(norm(t))) score += 2;
  for (const t of user.current_focus ?? []) if (itemTags.has(norm(t))) score += 2;
  if (user.stage && itemTags.has(norm(user.stage))) score += 1;
  if (user.role && itemTags.has(norm(user.role))) score += 1;

  // Recency bonus
  const when = item.starts_at ?? item.created_at;
  if (when) {
    const days = (Date.now() - new Date(when).getTime()) / 86_400_000;
    if (days < 14) score += 1;
    if (days < 3) score += 0.5;
  }

  return score;
}

export function rankBy<T extends { tags?: string[] | null; category?: string | null; created_at?: string | null; starts_at?: string | null }>(
  user: UserProfileTags,
  items: T[],
  limit = 8,
): T[] {
  return [...items]
    .map((i) => ({ i, s: scoreItem(user, i) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.i);
}

// League tiers (profiles.league_tier, migration 0026): everyone starts in
// Sprout; each Monday the top 20% of active players in a tier move up one
// and the bottom 20% move down one. Order matches the smallint values 0-4.
//
// In the UI a tier is a "bed" in the garden (Sprout bed → Diamond bed) — the
// ranking page copy says "moves up to a sunnier bed", never "promoted to the
// Bronze league". Colours follow the 2026-08-29 palette (desaturated accents
// on cream) rather than raw Tailwind-600s.
export const LEAGUE_TIERS = [
  { name: "Sprout", emoji: "🌱", accent: "#3E7C59", bg: "#EAF3EC", border: "#C9E4D0" },
  { name: "Bronze", emoji: "🥉", accent: "#B14F27", bg: "#FFF7ED", border: "#FED7AA" },
  { name: "Silver", emoji: "🥈", accent: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  { name: "Gold", emoji: "🥇", accent: "#C47A25", bg: "#FFFBEB", border: "#FDE68A" },
  { name: "Diamond", emoji: "💎", accent: "#3363CC", bg: "#EFF6FF", border: "#BFDBFE" },
] as const;

export function leagueTier(tier: number | null | undefined) {
  return LEAGUE_TIERS[Math.min(Math.max(tier ?? 0, 0), LEAGUE_TIERS.length - 1)];
}

/** Days until the fair closes (next Monday 00:00 UTC, matching date_trunc('week')). */
export function daysUntilWeekEnd(now = new Date()): number {
  const day = now.getUTCDay(); // 0 Sun … 6 Sat
  const untilMonday = day === 0 ? 1 : 8 - day;
  return untilMonday;
}

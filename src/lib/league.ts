// League tiers (profiles.league_tier, migration 0026): everyone starts in
// Sprout; each Monday the top 20% of active players in a tier move up one
// and the bottom 20% move down one. Order matches the smallint values 0-4.
export const LEAGUE_TIERS = [
  { name: "Sprout", emoji: "🌱", accent: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  { name: "Bronze", emoji: "🥉", accent: "#B45309", bg: "#FFF7ED", border: "#FED7AA" },
  { name: "Silver", emoji: "🥈", accent: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
  { name: "Gold", emoji: "🥇", accent: "#CA8A04", bg: "#FFFBEB", border: "#FDE68A" },
  { name: "Diamond", emoji: "💎", accent: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" },
] as const;

export function leagueTier(tier: number | null | undefined) {
  return LEAGUE_TIERS[Math.min(Math.max(tier ?? 0, 0), LEAGUE_TIERS.length - 1)];
}

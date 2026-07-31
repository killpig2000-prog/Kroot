import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// Numeric player level (Lv.1-30), driven by XP. CEFR is a separate axis: it
// tags content difficulty, while this level tracks effort and drives rewards.
export const MAX_LEVEL = 30;

// XP needed to go from level n to n+1: 50 + 10n. Cumulative closed form below.
export function xpToReach(level: number): number {
  const l = Math.min(Math.max(level, 1), MAX_LEVEL);
  return (l - 1) * (50 + 5 * l);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpToReach(level + 1)) level++;
  return level;
}

// Progress inside the current level, as { into, needed, pct }.
export function levelProgress(xp: number): { level: number; into: number; needed: number; pct: number } {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) return { level, into: 0, needed: 0, pct: 100 };
  const base = xpToReach(level);
  const needed = xpToReach(level + 1) - base;
  const into = xp - base;
  return { level, into, needed, pct: Math.min(100, Math.round((into / needed) * 100)) };
}

// The tree evolves every 5 levels: 🌰1-5 → 🌱6-10 → 🪴11-15 → 🌳16-20 → 🌸21-25 → 🍎26-30.
// Reuses the 6 visual stages previously keyed by CEFR (LevelCreature etc.).
export function treeStageForLevel(level: number): CefrLevel {
  const stage = Math.min(5, Math.floor((Math.max(1, level) - 1) / 5));
  return LEVEL_ORDER[stage];
}

// Content-difficulty gates: harder CEFR tiers unlock as the player levels up
// (a level test can still set current_level directly and implies readiness).
export const DIFFICULTY_UNLOCK_LEVEL: Record<CefrLevel, number> = {
  A1: 1,
  A2: 1,
  B1: 8,
  B2: 14,
  C1: 20,
  C2: 26,
};

export function isDifficultyUnlocked(
  difficulty: CefrLevel,
  playerLevel: number,
  cefrFromTest: CefrLevel
): boolean {
  // Anything at or below the tested CEFR level is always open.
  if (LEVEL_ORDER.indexOf(difficulty) <= LEVEL_ORDER.indexOf(cefrFromTest)) return true;
  return playerLevel >= DIFFICULTY_UNLOCK_LEVEL[difficulty];
}

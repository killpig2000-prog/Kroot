import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// Numeric player level, driven by XP. CEFR is a separate axis: it tags
// content difficulty (and picks the tree species), while this level tracks
// effort, grows the tree, and drives rewards.
//
// Curve v2 — fast early, open-ended late. One chapter (10-15 XP) is one
// level-up for the first ten levels, then the cost ramps gently so the tree
// is fully grown at Lv.50 (~1,065 XP, about 85 chapters). Past 50 the tree
// only grows *taller*; each level costs a little more than the last with no
// hard ceiling on XP, and Lv.120 wears the star topper as the display cap.
//
// Mirror of public.level_from_xp() in supabase/migrations/0029_level_curve_v2_softer.sql —
// change both together.
export const FULLY_GROWN_LEVEL = 50;
export const MAX_LEVEL = 120;

// XP needed to go from level n to n+1.
export function xpForNext(level: number): number {
  if (level < 10) return 10;
  if (level < 20) return 15;
  if (level < 35) return 25;
  if (level < FULLY_GROWN_LEVEL) return 30;
  return 60 + 3 * (level - FULLY_GROWN_LEVEL);
}

// Cumulative XP needed to *reach* a level. Tiny table, computed once.
const CUMULATIVE: number[] = [0, 0];
for (let l = 1; l < MAX_LEVEL; l++) CUMULATIVE.push(CUMULATIVE[l] + xpForNext(l));

export function xpToReach(level: number): number {
  const l = Math.min(Math.max(Math.floor(level), 1), MAX_LEVEL);
  return CUMULATIVE[l];
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= CUMULATIVE[level + 1]) level++;
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

// The tree evolves every 10 levels: 🌰1-9 → 🌱10-19 → 🪴20-29 → 🌳30-39 →
// 🌸40-49 → 🍎50+. Reuses the 6 visual stages keyed by CEFR (LevelCreature).
// From 50 on the stage stays put and the tree grows taller instead (VeteranTree).
export const STAGE_SPAN = 10;
export function treeStageForLevel(level: number): CefrLevel {
  const stage = Math.min(5, Math.floor(Math.max(1, level) / STAGE_SPAN));
  return LEVEL_ORDER[stage];
}

// Veteran growth (Lv.50+): one extra canopy tier per 10 levels, each with a
// keepsake hung on it. Height in metres is the brag number on the card.
export const VETERAN_TIER_SPAN = 10;
export function veteranTiers(level: number): number {
  return Math.max(0, Math.floor((Math.min(level, MAX_LEVEL) - FULLY_GROWN_LEVEL) / VETERAN_TIER_SPAN));
}
export function treeHeightMetres(level: number): number {
  if (level < FULLY_GROWN_LEVEL) return 0;
  return Math.round((2 + (Math.min(level, MAX_LEVEL) - FULLY_GROWN_LEVEL) * 0.125) * 10) / 10;
}

// Content-difficulty gate: harder CEFR tiers open only by proving skill in a
// level/promotion test (current_level). Player level never unlocks content —
// it's a reward axis only.
export function isDifficultyUnlocked(difficulty: CefrLevel, cefrFromTest: CefrLevel): boolean {
  return LEVEL_ORDER.indexOf(difficulty) <= LEVEL_ORDER.indexOf(cefrFromTest);
}

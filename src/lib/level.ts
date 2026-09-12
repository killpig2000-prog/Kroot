import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// Numeric player level, driven by XP. CEFR is a separate axis: it tags
// content difficulty, while this level tracks effort, grows the tree, and
// drives rewards.
//
// Curve v4 (2026-09-12, user call) — max Lv.50, and reaching it costs about
// 70% of one grade's content. A grade is ~5,700-6,100 XP (160 reading
// passages, 52 writing chapters, 160 listening dialogues, its grammar and its
// vocab Days); Lv.50 is 4,131 XP, 68-73% of any of them. The first four
// looks come quickly; from Lv.21 (the fifth look, the grown tree) each level
// costs a little more, and keeps climbing to the Guardian Tree.
//
// Mirror of public.level_from_xp() in
// supabase/migrations/0082_level_curve_bend_at_21.sql — change both together.
// Integer-only on purpose: 4.1 per level is written as (41n + 5) / 10 so JS
// and Postgres round the same way.
export const MAX_LEVEL = 50;

// XP needed to go from level n to n+1.
export function xpForNext(level: number): number {
  if (level < 21) return 10 + 2 * (level - 1);
  return 65 + Math.floor((41 * (level - 21) + 5) / 10);
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

// The oak's seven looks, by first level: seed, sprout, young tree, sturdy
// tree, grown tree, elder tree, Guardian Tree. The Guardian Tree is the max
// level — the tree is finished when the level is. The elder tree sits at
// Lv.38 so the last two stretches take about as long as each other.
export const ART_STAGE_STARTS = [1, 3, 7, 13, 21, 38, 50] as const;
/** Message keys for the seven looks (dashboard.tree.looks.<key>). */
export const LOOK_KEYS = ["seed", "sprout", "young", "sturdy", "grown", "elder", "guardian"] as const;

export function artStageForLevel(level: number): number {
  let stage = 0;
  while (stage < ART_STAGE_STARTS.length - 1 && level >= ART_STAGE_STARTS[stage + 1]) stage++;
  return stage;
}

/** How far the tree is from its next look — what the garden's XP line shows. */
export function evolutionProgress(xp: number): {
  level: number;
  look: number;
  /** null once the tree is the Guardian Tree */
  nextLook: number | null;
  xpLeft: number;
  pct: number;
} {
  const level = levelFromXp(xp);
  const look = artStageForLevel(level);
  if (look >= ART_STAGE_STARTS.length - 1) return { level, look, nextLook: null, xpLeft: 0, pct: 100 };
  const from = xpToReach(ART_STAGE_STARTS[look]);
  const to = xpToReach(ART_STAGE_STARTS[look + 1]);
  return {
    level,
    look,
    nextLook: look + 1,
    xpLeft: to - xp,
    pct: Math.min(100, Math.max(0, Math.round(((xp - from) / (to - from)) * 100))),
  };
}

// The six named stages (growth popup art, shop, stage-only callers) start on
// look boundaries so a stage change is always a visible change. They skip the
// grown tree, as LevelCreature's STAGE_LOOK does.
export const STAGE_STARTS = [1, 3, 7, 13, 38, 50] as const;

export function treeStageForLevel(level: number): CefrLevel {
  let stage = 0;
  while (stage < STAGE_STARTS.length - 1 && level >= STAGE_STARTS[stage + 1]) stage++;
  return LEVEL_ORDER[stage];
}

// Content-difficulty gate: harder CEFR tiers open only by proving skill in a
// level/promotion test (current_level). Player level never unlocks content —
// it's a reward axis only.
export function isDifficultyUnlocked(difficulty: CefrLevel, cefrFromTest: CefrLevel): boolean {
  return LEVEL_ORDER.indexOf(difficulty) <= LEVEL_ORDER.indexOf(cefrFromTest);
}

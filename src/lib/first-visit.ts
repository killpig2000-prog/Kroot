// "First-visit dashboard": a brand-new account sees one plan card instead of
// the full Garden, and the other widgets unlock one session at a time. Pure
// helpers — the dashboard page feeds in what it already fetched.

/** Accounts older than this always get the full dashboard. */
export const NEW_ACCOUNT_DAYS = 7;
/** Completed sessions at which the full dashboard opens. */
export const SESSIONS_FOR_FULL = 3;
/** Streak length that unlocks the study-garden heatmap. */
export const HEATMAP_STREAK = 3;
/** Set to "1" by the "Show everything now" escape hatch (see dashboard/actions.ts). */
export const SHOW_ALL_COOKIE = "kroot_show_all";

export type FirstVisitUnlocks = {
  /** Today's quest — after session 1. */
  quest: boolean;
  /** Word of the day — after session 2. */
  wotd: boolean;
  /** Level map — after session 3 (coincides with the full dashboard). */
  levelMap: boolean;
  /** Study-garden heatmap — at a 3-day streak. */
  heatmap: boolean;
};

export type FirstVisitState = {
  /** True while the gated first-visit dashboard should render. */
  active: boolean;
  /** 1-based day since signup, for "Day 1 · your garden starts here". */
  day: number;
  sessions: number;
  unlocked: FirstVisitUnlocks;
};

export function firstVisitState({
  createdAt,
  sessions,
  streakDays,
  showAll,
  now = new Date(),
}: {
  /** profiles.created_at; a missing value means "not new" (never gate an unknown account). */
  createdAt: string | null | undefined;
  sessions: number;
  streakDays: number;
  showAll: boolean;
  now?: Date;
}): FirstVisitState {
  const createdMs = createdAt ? Date.parse(createdAt) : NaN;
  const ageDays = Number.isFinite(createdMs) ? Math.max(0, (now.getTime() - createdMs) / 86_400_000) : Infinity;
  const day = Number.isFinite(ageDays) ? Math.floor(ageDays) + 1 : 1;
  const active = !showAll && ageDays < NEW_ACCOUNT_DAYS && sessions < SESSIONS_FOR_FULL;
  return {
    active,
    day,
    sessions,
    unlocked: {
      quest: sessions >= 1,
      wotd: sessions >= 2,
      levelMap: sessions >= 3,
      heatmap: streakDays >= HEATMAP_STREAK,
    },
  };
}

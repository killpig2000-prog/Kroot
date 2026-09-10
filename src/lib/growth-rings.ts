import { iso } from "@/lib/study-garden";

// Growth rings (2026-09-10): the Garden's weekly attendance, drawn as tree
// rings. One ring is one week, Monday to Sunday, seven segments; a segment
// is filled the first time the learner opens the app that day. The segment's
// tone is how deep the day went — showed up / a lesson / a lesson and a
// review — read off rows the app already keeps, so no day is scored twice.
//
// Attendance is the union of three things: an attendance_days row (opened
// the app), a daily_activity row with minutes (studied), a vocabulary
// review that day. The first only exists from the apply date of migration
// 0079 onward; the other two reach back, so older weeks still draw.

/** 0 away · 1 showed up · 2 a lesson · 3 a lesson and a review */
export type DayDepth = 0 | 1 | 2 | 3;

export type WeekRing = {
  /** Monday, YYYY-MM-DD */
  start: string;
  /** Mon..Sun; days after today (current week only) are 0 */
  days: DayDepth[];
  attended: number;
  /** mean depth over attended days, 0 when none */
  avg: number;
  /** XP earned that week — a good week leaves a thicker ring, like a real
   *  tree in a good year (2026-09-10). 0 when the caller has no XP rows. */
  xp: number;
};

/** How many closed weeks the sheet shows behind the current one. */
export const RING_WEEKS = 12;

export const TONE: Record<DayDepth, string> = {
  0: "var(--c-warm-3)",
  1: "#DDC49A",
  2: "#C39A5E",
  3: "#A9743A",
};

export function depthFor(day: string, attended: Set<string>, studied: Set<string>, reviewed: Set<string>): DayDepth {
  const s = studied.has(day);
  const r = reviewed.has(day);
  if (s && r) return 3;
  if (s || r) return 2;
  return attended.has(day) ? 1 : 0;
}

function shift(d: Date, days: number) {
  const n = new Date(d);
  n.setDate(d.getDate() + days);
  return n;
}

/**
 * Weeks newest-first: index 0 is the current week (Mon..today filled, the
 * rest 0), index 1 last week, and so on. `now` decides today and the week.
 */
export function buildWeeks(
  now: Date,
  sets: { attended: Set<string>; studied: Set<string>; reviewed: Set<string>; xpByDay?: Map<string, number> },
  weeks = RING_WEEKS,
): WeekRing[] {
  const today = iso(now);
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const monday = shift(now, -dow);
  const out: WeekRing[] = [];
  for (let w = 0; w < weeks; w++) {
    const start = shift(monday, -7 * w);
    const days: DayDepth[] = [];
    let xp = 0;
    for (let i = 0; i < 7; i++) {
      const key = iso(shift(start, i));
      days.push(key > today ? 0 : depthFor(key, sets.attended, sets.studied, sets.reviewed));
      xp += sets.xpByDay?.get(key) ?? 0;
    }
    const hit = days.filter((d) => d > 0);
    out.push({
      start: iso(start),
      days,
      attended: hit.length,
      avg: hit.length ? hit.reduce<number>((a, d) => a + d, 0) / hit.length : 0,
      xp,
    });
  }
  return out;
}

/** The first day the ring history reaches back to, for one query window. */
export function ringsSince(now: Date, weeks = RING_WEEKS) {
  const dow = (now.getDay() + 6) % 7;
  return iso(shift(now, -dow - 7 * (weeks - 1)));
}

/** Sum of XP per local day from xp_events rows, for buildWeeks. */
export function xpByDayFrom(rows: { points: number | null; created_at: string }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const key = iso(new Date(r.created_at));
    m.set(key, (m.get(key) ?? 0) + (r.points ?? 0));
  }
  return m;
}

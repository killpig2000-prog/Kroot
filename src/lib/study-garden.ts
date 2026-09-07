// Study-garden arithmetic shared by My progress (where the year grass lives
// since 2026-09-07) and the dashboard (which still needs today's date and
// the week for its quest/review rows). Pure functions over ISO date strings.

/** Days studied in a month that count as "goal met" on the grass headline. */
export const MONTH_GOAL = 20;

export function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Longest run of consecutive study days across the whole history. */
export function bestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const isoDay of sorted) {
    const d = new Date(isoDay);
    run = prev && d.getTime() - prev.getTime() === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Monday-start week of `now`, as 7 dates. */
export function weekDates(now: Date) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** The four headline numbers the grass card shows, from daily_activity rows. */
export function gardenHeadline(
  activity: { activity_date: string; minutes: number | null }[],
  streakDays: number,
  now = new Date()
) {
  const minutesByDate = new Map(activity.map((a) => [a.activity_date, a.minutes ?? 0]));
  const weekTotal = weekDates(now).reduce((sum, d) => sum + (minutesByDate.get(iso(d)) ?? 0), 0);
  const totalMinutes = activity.reduce((sum, a) => sum + (a.minutes ?? 0), 0);
  const activeDates = activity.filter((a) => (a.minutes ?? 0) > 0).map((a) => a.activity_date);
  const longestStreak = Math.max(bestStreak(activeDates), streakDays);
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthDone = activity.filter((a) => a.activity_date >= monthStart && (a.minutes ?? 0) > 0).length;
  return { minutesByDate, weekTotal, totalMinutes, longestStreak, monthDone };
}

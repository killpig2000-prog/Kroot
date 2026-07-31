import type { SupabaseClient } from "@supabase/supabase-js";

// XP awarded per completed unit, by skill. Tuned so ~2-3 activities a day
// (~30-40 XP) reaches the Lv.30 cap (5,800 XP) in roughly 5-6 months.
export const XP_POINTS: Record<string, number> = {
  reading: 15,
  writing: 15,
  listening: 12,
  speaking: 12,
  vocabulary: 10,
  grammar: 10,
  pronunciation: 6,
  hangul: 6,
  slang: 4,
  quest: 10,
};

export type ProgressResult = {
  new_xp: number;
  new_level: number;
  leveled_up: boolean;
};

/** Add study minutes to today's daily_activity row (server-side, atomic). */
export async function logActivity(supabase: SupabaseClient, minutes: number): Promise<void> {
  const { error } = await supabase.rpc("log_activity", { p_minutes: Math.max(1, Math.round(minutes)) });
  if (error) console.error("log_activity failed:", error.message);
}

/**
 * Award XP for a completed unit of the given skill.
 * Returns the new XP state (so callers can show a level-up celebration),
 * or null if the call failed.
 */
export async function awardProgress(
  supabase: SupabaseClient,
  skill: keyof typeof XP_POINTS,
): Promise<ProgressResult | null> {
  const points = XP_POINTS[skill] ?? 5;
  const { data, error } = await supabase.rpc("award_xp", { p_points: points });
  if (error) {
    console.error("award_xp failed:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ProgressResult) ?? null;
}

/** Convenience: log minutes + award XP for one completed unit. */
export async function recordCompletion(
  supabase: SupabaseClient,
  skill: keyof typeof XP_POINTS,
  minutes: number,
): Promise<ProgressResult | null> {
  await logActivity(supabase, minutes);
  return awardProgress(supabase, skill);
}

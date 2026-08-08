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

/**
 * If today's daily quest asks for this skill and isn't done yet, complete it
 * and pay out its reward. Runs on real activity completion — the dashboard
 * button only navigates, it never completes.
 */
async function completeMatchingQuest(supabase: SupabaseClient, skill: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_quests")
    .update({ completed_at: new Date().toISOString() })
    .eq("quest_date", today)
    .eq("skill_key", skill)
    .is("completed_at", null)
    .select("id");
  if (error || !data || data.length === 0) return;

  const { error: coinError } = await supabase.rpc("earn_coins", { p_amount: 10 });
  if (coinError) console.error("earn_coins failed:", coinError.message);
  await awardProgress(supabase, "quest");
}

/** Convenience: log minutes + award XP for one completed unit. */
export async function recordCompletion(
  supabase: SupabaseClient,
  skill: keyof typeof XP_POINTS,
  minutes: number,
): Promise<ProgressResult | null> {
  await logActivity(supabase, minutes);
  const result = await awardProgress(supabase, skill);
  await completeMatchingQuest(supabase, skill);
  return result;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { track } from "@/lib/analytics";

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
  /** Coins this call actually granted — 0 when the activity bonus's proof-of-progress check didn't pass. */
  coins_earned: number;
};

/** Add study minutes to today's daily_activity row (server-side, atomic). */
export async function logActivity(supabase: SupabaseClient, minutes: number): Promise<void> {
  const { error } = await supabase.rpc("log_activity", { p_minutes: Math.max(1, Math.round(minutes)) });
  if (error) console.error("log_activity failed:", error.message);
}

/**
 * Award a specific number of XP points for a skill (used both for a full
 * completed unit and for partial credit — see `awardPartialCredit` below).
 * Returns the new XP state (so callers can show a level-up celebration),
 * or null if the call failed or there was nothing to award.
 */
export async function awardPoints(
  supabase: SupabaseClient,
  points: number,
  skill: keyof typeof XP_POINTS,
): Promise<ProgressResult | null> {
  if (points <= 0) return null;
  let { data, error } = await supabase.rpc("award_xp", { p_points: points, p_skill: skill });
  if (error?.code === "PGRST202") {
    // Migration 0024 not applied yet — the deployed function has no p_skill.
    ({ data, error } = await supabase.rpc("award_xp", { p_points: points }));
  }
  if (error) {
    console.error("award_xp failed:", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return (row as ProgressResult) ?? null;
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
  return awardPoints(supabase, XP_POINTS[skill] ?? 5, skill);
}

/**
 * Award proportional XP for progress made on a unit the learner didn't
 * finish (e.g. left a dialogue partway through). `ratio` is 0-1 progress
 * within the unit; `alreadyAwardedRatio` is how much of that ratio has
 * already been paid out in an earlier partial award for the same unit, so
 * repeated exits only pay the newly-made progress. Returns the new ratio to
 * remember, and the XP result if any points were actually awarded.
 */
export async function awardPartialCredit(
  supabase: SupabaseClient,
  skill: keyof typeof XP_POINTS,
  ratio: number,
  alreadyAwardedRatio: number,
): Promise<{ newAwardedRatio: number; result: ProgressResult | null }> {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped <= alreadyAwardedRatio) return { newAwardedRatio: alreadyAwardedRatio, result: null };
  const full = XP_POINTS[skill] ?? 5;
  const delta = Math.round(full * clamped) - Math.round(full * alreadyAwardedRatio);
  const result = delta > 0 ? await awardPoints(supabase, delta, skill) : null;
  return { newAwardedRatio: clamped, result };
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

/**
 * Convenience: log minutes + award XP for one completed unit. If some of
 * this unit's XP was already paid out via `awardPartialCredit` (the learner
 * left partway through, came back, and finished it), pass that ratio so
 * only the remaining points are awarded.
 */
export async function recordCompletion(
  supabase: SupabaseClient,
  skill: keyof typeof XP_POINTS,
  minutes: number,
  alreadyAwardedRatio = 0,
): Promise<ProgressResult | null> {
  await logActivity(supabase, minutes);
  const full = XP_POINTS[skill] ?? 5;
  const remaining = Math.max(0, full - Math.round(full * Math.max(0, Math.min(1, alreadyAwardedRatio))));
  const result = await awardPoints(supabase, remaining, skill);
  await completeMatchingQuest(supabase, skill);
  track("activity_completed", { skill, minutes, leveled_up: !!result?.leveled_up });
  return result;
}

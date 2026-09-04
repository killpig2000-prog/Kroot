import type { SupabaseClient } from "@supabase/supabase-js";
import { isTableMissing } from "@/lib/resume";

/**
 * item_keys (see reward-keys.ts) this learner has completed but not earned
 * coins on — a first attempt that scored below the accuracy gate in
 * migration 0063. Redoing one of these at 60%+ pays its 15 coins once (the
 * "top-up" in award_xp). Chapter/lesson list pages use this to badge those
 * items as "still earnable", rather than showing every completed item as
 * paid — the two aren't the same thing.
 *
 * `skill` narrows to one award_xp p_skill value ('writing', 'pronunciation',
 * ...); omit it to fetch across all skills for a page that needs several
 * (speaking's practice chapters and challenges are both 'pronunciation',
 * distinguished only by item_key prefix).
 */
export async function getUnpaidRewardKeys(
  supabase: SupabaseClient,
  userId: string,
  skill?: string,
): Promise<Set<string>> {
  let query = supabase.from("reward_grants").select("item_key").eq("user_id", userId).eq("coins_awarded", 0);
  if (skill) query = query.eq("skill", skill);
  const { data, error } = await query;
  // Migration 0063 not reached this environment yet — no unpaid items to flag.
  if (error && !isTableMissing(error)) console.error("getUnpaidRewardKeys failed:", error.message);
  return new Set((data ?? []).map((r) => r.item_key as string));
}

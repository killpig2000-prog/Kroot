import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel } from "@/lib/tree";

// The level is the learner's own choice. apply_level_test (0050) only accepts a
// level backed by a level_test_results row from the last hour, so the choice is
// recorded as a row first — the same row the dashboard reads as "onboarded".
export async function setMyLevel(supabase: SupabaseClient, userId: string, level: CefrLevel): Promise<void> {
  const { error: insertErr } = await supabase.from("level_test_results").insert({
    user_id: userId,
    result_level: level,
    score: 0,
    total_questions: 0,
    skipped: true,
  });
  if (insertErr) throw new Error(`level_test_results insert failed: ${insertErr.message}`);
  const { error } = await supabase.rpc("apply_level_test", { p_level: level });
  if (error) throw new Error(`apply_level_test failed: ${error.message}`);
}

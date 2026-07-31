import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel } from "@/lib/tree";
import { VOCAB_TOPICS, getWordsForTopic } from "@/lib/vocabulary";
import { COOLDOWN_HOURS, ELIGIBILITY } from "@/lib/promotion-test";

export type Eligibility = {
  wordsReviewed: number;
  wordsRequired: number;
  accuracy: number; // 0..1 over reviewed words of this grade
  hasAccuracyData: boolean; // false until at least one quiz answer exists
  accuracyRequired: number;
  readingDone: number;
  readingRequired: number;
  cooldownUntil: string | null; // ISO — set when a failed attempt is too recent
  lastWeakest: string | null; // weakest skill of the last failed attempt
  eligible: boolean;
};

// Eligibility = enough coverage + accuracy in the CURRENT grade, and no
// recent failed attempt still cooling down.
export async function computeEligibility(
  supabase: SupabaseClient,
  userId: string,
  grade: CefrLevel,
): Promise<Eligibility> {
  const gradeWordKeys = new Set(
    VOCAB_TOPICS.flatMap((t) => getWordsForTopic(t.key, grade)).map((w) => w.key),
  );
  const wordsRequired = Math.max(1, Math.ceil(gradeWordKeys.size * ELIGIBILITY.wordCoverageRatio));

  const [vocab, reading, attempts] = await Promise.all([
    supabase
      .from("vocabulary_progress")
      .select("word_key, correct_count, incorrect_count")
      .eq("user_id", userId)
      .not("last_reviewed_at", "is", null),
    supabase
      .from("reading_progress")
      .select("passage_key")
      .eq("user_id", userId),
    supabase
      .from("level_test_results")
      .select("created_at, details")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  let correct = 0;
  let total = 0;
  let reviewed = 0;
  for (const row of vocab.data ?? []) {
    if (!gradeWordKeys.has(row.word_key)) continue;
    reviewed += 1;
    correct += row.correct_count ?? 0;
    total += (row.correct_count ?? 0) + (row.incorrect_count ?? 0);
  }
  const accuracy = total > 0 ? correct / total : 0;
  const hasAccuracyData = total > 0;

  const readingDone = (reading.data ?? []).filter((r) =>
    String(r.passage_key).includes(`:${grade}:`),
  ).length;

  // Cooldown: the most recent PROMOTION attempt (details present) that failed.
  let cooldownUntil: string | null = null;
  let lastWeakest: string | null = null;
  for (const row of attempts.data ?? []) {
    const d = row.details as { passed?: boolean; weakest?: string } | null;
    if (!d || typeof d.passed !== "boolean") continue; // onboarding rows have no details
    if (d.passed) break; // passed already — no cooldown from older fails
    const until = new Date(new Date(row.created_at).getTime() + COOLDOWN_HOURS * 3600_000);
    if (until > new Date()) {
      cooldownUntil = until.toISOString();
      lastWeakest = d.weakest ?? null;
    }
    break;
  }

  const eligible =
    reviewed >= wordsRequired &&
    accuracy >= ELIGIBILITY.minAccuracy &&
    readingDone >= ELIGIBILITY.minReadingPassages &&
    cooldownUntil === null;

  return {
    wordsReviewed: reviewed,
    wordsRequired,
    accuracy,
    hasAccuracyData,
    accuracyRequired: ELIGIBILITY.minAccuracy,
    readingDone,
    readingRequired: ELIGIBILITY.minReadingPassages,
    cooldownUntil,
    lastWeakest,
    eligible,
  };
}

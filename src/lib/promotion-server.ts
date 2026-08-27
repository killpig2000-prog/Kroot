import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel } from "@/lib/tree";
import { VOCAB_TOPICS, getWordsForTopic } from "@/lib/vocabulary";
import { COOLDOWN_HOURS, ELIGIBILITY, type ExcludeKeys } from "@/lib/promotion-test";

export type Eligibility = {
  wordsMastered: number; // words of this grade sitting at box >= masteryBox
  wordsRequired: number;
  wordsSeen: number; // reviewed at least once — shown as context, not a gate
  readingDone: number;
  readingRequired: number;
  cooldownUntil: string | null; // ISO — set when a failed attempt is too recent
  lastWeakest: string | null; // weakest skill of the last failed attempt
  eligible: boolean;
};

// Eligibility = enough words of the CURRENT grade actually retained, some
// reading done, and no recent failed attempt still cooling down.
export async function computeEligibility(
  supabase: SupabaseClient,
  userId: string,
  grade: CefrLevel,
): Promise<Eligibility> {
  const gradeWordKeys = new Set(
    VOCAB_TOPICS.flatMap((t) => getWordsForTopic(t.key, grade)).map((w) => w.key),
  );
  // The ratio is only a ceiling, so a thin grade can't demand more words than
  // it has; normally the absolute target is the smaller of the two.
  const wordsRequired = Math.max(
    1,
    Math.min(
      ELIGIBILITY.targetMasteredWords,
      Math.ceil(gradeWordKeys.size * ELIGIBILITY.wordCoverageRatio),
    ),
  );

  const [vocab, reading, attempts] = await Promise.all([
    supabase
      .from("vocabulary_progress")
      .select("word_key, box")
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

  let mastered = 0;
  let seen = 0;
  for (const row of vocab.data ?? []) {
    if (!gradeWordKeys.has(row.word_key)) continue;
    seen += 1;
    if ((row.box ?? 1) >= ELIGIBILITY.masteryBox) mastered += 1;
  }

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
    mastered >= wordsRequired &&
    readingDone >= ELIGIBILITY.minReadingPassages &&
    cooldownUntil === null;

  return {
    wordsMastered: mastered,
    wordsRequired,
    wordsSeen: seen,
    readingDone,
    readingRequired: ELIGIBILITY.minReadingPassages,
    cooldownUntil,
    lastWeakest,
    eligible,
  };
}

// So a retake doesn't re-serve the exact same content the learner just saw —
// look up what the most recent attempt at this same promotion (from → to)
// actually contained, stored as details.servedKeys by TestRunner on finish.
export async function getLastServedKeys(
  supabase: SupabaseClient,
  userId: string,
  toGrade: CefrLevel,
): Promise<ExcludeKeys | undefined> {
  const { data } = await supabase
    .from("level_test_results")
    .select("details")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  for (const row of data ?? []) {
    const d = row.details as { target_level?: string; servedKeys?: ExcludeKeys } | null;
    if (d?.target_level === toGrade && d.servedKeys) return d.servedKeys;
  }
  return undefined;
}

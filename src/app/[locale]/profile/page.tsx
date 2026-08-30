import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import AvatarUploader from "@/components/profile/AvatarUploader";
import NameEditor from "@/components/profile/NameEditor";
import ReminderSettings from "@/components/profile/ReminderSettings";
import LearningProgress from "@/components/profile/LearningProgress";
import WordMemory from "@/components/profile/WordMemory";
import AccuracyStats, { type AccuracyMetric } from "@/components/profile/AccuracyStats";
import WordsToPractise, { type PractiseWord } from "@/components/profile/WordsToPractise";
import LevelHistory, { type LevelTestRow } from "@/components/profile/LevelHistory";
import { computeSkillProgress } from "@/components/profile/skill-progress";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_PATH, SPECIES, type CefrLevel } from "@/lib/tree";
import { levelProgress, treeStageForLevel, MAX_LEVEL } from "@/lib/level";
import { MAX_BOX } from "@/lib/srs";
import { PUBLIC_VOCAB_WORDS } from "@/lib/vocab-slugs";

// My account (2026-08-30): identity at the top, then the learning stats that
// used to be scattered across the Garden and the retired /stats page, with
// the settings pushed to the bottom. Every query below is tolerant of a
// missing table or column — a stats page must degrade, never 500.

type VocabRow = {
  word_key: string;
  box: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  next_review_at: string | null;
};

/** word_key is `${topic}:${level}:${korean}`; korean may itself contain ":". */
function koreanFromWordKey(key: string): string {
  const parts = key.split(":");
  return parts.length > 2 ? parts.slice(2).join(":") : key;
}

const WORD_BY_KOREAN = new Map(PUBLIC_VOCAB_WORDS.map((w) => [w.korean, w]));

/** details jsonb → the per-skill rows we can actually show, in a fixed order. */
const DETAIL_SKILLS: { field: string; navKey: string }[] = [
  { field: "listening", navKey: "listening" },
  { field: "reading", navKey: "reading" },
  { field: "writing", navKey: "writing" },
  { field: "speaking", navKey: "pronunciation" },
];

function skillsFromDetails(details: unknown): { key: string; value: number }[] {
  if (!details || typeof details !== "object") return [];
  const d = details as Record<string, unknown>;
  return DETAIL_SKILLS.flatMap(({ field, navKey }) => {
    const v = d[field];
    return typeof v === "number" && Number.isFinite(v) ? [{ key: navKey, value: Math.round(v) }] : [];
  });
}

function passedFromDetails(details: unknown): boolean | null {
  if (!details || typeof details !== "object") return null;
  const v = (details as Record<string, unknown>).passed;
  return typeof v === "boolean" ? v : null;
}

export default async function ProfilePage() {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const nowIso = new Date().toISOString();

  // One parallel batch: from Korea to us-east-1 each round trip is ~300ms,
  // so sequential awaits are the whole difference between fast and sluggish.
  const [
    { data: profile },
    extrasRes,
    vocabRes,
    readingRes,
    writingRes,
    listeningRes,
    speakingRes,
    grammarRes,
    levelTestRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, created_at, avatar_url, coins, xp")
      .eq("id", user.id)
      .single(),
    // Migration 0035 columns, tolerant of a not-yet-applied migration.
    supabase
      .from("profiles")
      .select("reminder_push, reminder_email, reminder_hour, streak_freezes")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("vocabulary_progress")
      .select("word_key, box, correct_count, incorrect_count, next_review_at")
      .eq("user_id", user.id),
    supabase.from("reading_progress").select("passage_key, correct_count, incorrect_count").eq("user_id", user.id),
    supabase.from("writing_progress").select("prompt_key").eq("user_id", user.id),
    supabase.from("listening_progress").select("dialogue_id").eq("user_id", user.id).not("completed_at", "is", null),
    supabase.from("speaking_progress").select("prompt_key, best_score").eq("user_id", user.id),
    supabase.from("grammar_progress").select("lesson_key, score").eq("user_id", user.id),
    supabase
      .from("level_test_results")
      .select("id, created_at, result_level, score, total_questions, details")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const extras = extrasRes.error ? null : extrasRes.data;
  const vocabRows = (vocabRes.error ? [] : (vocabRes.data as VocabRow[] | null) ?? []) as VocabRow[];
  const readingRows = readingRes.error ? [] : readingRes.data ?? [];
  const writingRows = writingRes.error ? [] : writingRes.data ?? [];
  const listeningRows = listeningRes.error ? [] : listeningRes.data ?? [];
  const speakingRows = speakingRes.error ? [] : speakingRes.data ?? [];
  const grammarRows = grammarRes.error ? [] : grammarRes.data ?? [];

  // `details` arrives with migration 0014; without it the whole select errors,
  // so retry once for the columns that have always existed.
  let levelTests = levelTestRes.error ? [] : levelTestRes.data ?? [];
  if (levelTestRes.error) {
    const retry = await supabase
      .from("level_test_results")
      .select("id, created_at, result_level, score, total_questions")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(8);
    levelTests = retry.error ? [] : (retry.data ?? []).map((r) => ({ ...r, details: null }));
  }

  const level = (profile?.current_level ?? "A1") as CefrLevel;

  const xp = profile?.xp ?? 0;
  const { level: playerLevel, into, needed, pct } = levelProgress(xp);
  const treeStage = LEVEL_PATH[treeStageForLevel(playerLevel)];
  const atMaxLevel = playerLevel >= MAX_LEVEL;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  // 1. Learning progress
  const skillProgress = computeSkillProgress({
    cefr: level,
    grammarKeys: grammarRows.map((r) => r.lesson_key),
    vocabKeys: vocabRows.map((r) => r.word_key),
    listeningIds: listeningRows.map((r) => r.dialogue_id),
    readingKeys: readingRows.map((r) => r.passage_key),
    writingKeys: writingRows.map((r) => r.prompt_key),
    speakingKeys: speakingRows.map((r) => r.prompt_key),
  });

  // 2. Word memory — Leitner box distribution
  const boxes = Array.from({ length: MAX_BOX }, () => 0);
  for (const row of vocabRows) {
    const box = Math.min(Math.max(row.box ?? 1, 1), MAX_BOX);
    boxes[box - 1] += 1;
  }
  const dueNow = vocabRows.filter((r) => r.next_review_at != null && r.next_review_at <= nowIso).length;

  // 3. Accuracy — a metric is shown only when it has data behind it.
  const sum = (rows: { correct_count: number | null; incorrect_count: number | null }[]) =>
    rows.reduce(
      (acc, r) => ({ ok: acc.ok + (r.correct_count ?? 0), all: acc.all + (r.correct_count ?? 0) + (r.incorrect_count ?? 0) }),
      { ok: 0, all: 0 }
    );
  const vocabAcc = sum(vocabRows);
  const readingAcc = sum(readingRows);
  const speakingScores = speakingRows.map((r) => r.best_score).filter((s): s is number => typeof s === "number");
  const grammarScores = grammarRows.map((r) => r.score).filter((s): s is number => typeof s === "number");
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

  const metrics: AccuracyMetric[] = [
    ...(vocabAcc.all > 0
      ? [{
          key: "vocabulary",
          percent: Math.round((vocabAcc.ok / vocabAcc.all) * 100),
          note: t("ofAnswers", { correct: vocabAcc.ok, total: vocabAcc.all }),
        }]
      : []),
    ...(readingAcc.all > 0
      ? [{
          key: "reading",
          percent: Math.round((readingAcc.ok / readingAcc.all) * 100),
          note: t("ofAnswers", { correct: readingAcc.ok, total: readingAcc.all }),
        }]
      : []),
    ...(speakingScores.length > 0
      ? [{ key: "pronunciation", percent: avg(speakingScores), note: t("overAttempts", { count: speakingScores.length }) }]
      : []),
    ...(grammarScores.length > 0
      ? [{ key: "grammar", percent: avg(grammarScores), note: t("overLessons", { count: grammarScores.length }) }]
      : []),
  ];

  // 4. Words to practise — the ones missed most often
  const practiseWords: PractiseWord[] = vocabRows
    .filter((r) => (r.incorrect_count ?? 0) > 0)
    .sort((a, b) => (b.incorrect_count ?? 0) - (a.incorrect_count ?? 0))
    .slice(0, 6)
    .map((r) => {
      const korean = koreanFromWordKey(r.word_key);
      const entry = WORD_BY_KOREAN.get(korean);
      return {
        korean,
        meaning: entry?.meaning_en ?? null,
        slug: entry?.slug ?? null,
        misses: r.incorrect_count ?? 0,
      };
    });

  // 5. Level history
  const levelRows: LevelTestRow[] = levelTests.map((r) => {
    const details = (r as { details?: unknown }).details ?? null;
    return {
      id: r.id,
      created_at: r.created_at,
      result_level: r.result_level,
      score: r.score,
      total_questions: r.total_questions,
      skills: skillsFromDetails(details),
      passed: passedFromDetails(details),
    };
  });

  const hasVocab = vocabRows.length > 0;
  const noScoreSkills = ["listening", "writing"];

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center kr text-[15px] mr-[9px]">
                나
              </span>
              {tn("myAccount")}
            </h1>
          </div>

          {/* grid-cols-1 pins the track to minmax(0,1fr); a bare auto track
              grows to the widest card's max-content and overflows on mobile */}
          <div className="max-w-[820px] grid grid-cols-1 gap-3.5">
            {/* identity card */}
            <div className="border border-line rounded-[14px] px-[22px] py-5 flex items-center gap-4 flex-wrap">
              <AvatarUploader userId={user.id} avatarUrl={profile?.avatar_url ?? null} />
              <div className="flex-1 min-w-[180px]">
                <b className="font-semibold text-base flex items-center gap-2">
                  <NameEditor userId={user.id} name={profile?.display_name ?? "Learner"} />
                </b>
                <span className="flex flex-wrap items-center text-[13px] text-muted">
                  {/* flex items: each segment wraps as a whole, never mid-phrase */}
                  <span className="whitespace-nowrap">{SPECIES[level].name} {SPECIES[level].emoji}</span>
                  <span className="mx-1">·</span>
                  <span className="whitespace-nowrap">{treeStage.treeName}</span>
                  <span className="mx-1">·</span>
                  <span className="whitespace-nowrap">Lv. {playerLevel}</span>
                  <span className="mx-1">·</span>
                  <span className="whitespace-nowrap">{level} difficulty</span>
                  <span className="mx-1">·</span>
                  <span className="whitespace-nowrap">growing since {memberSince}</span>
                </span>
                <div className="mt-2 max-w-[280px]">
                  <div className="h-[6px] rounded-full bg-success-bg border border-success-line overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  <small className="block mt-1 text-[12px] text-muted">
                    {atMaxLevel ? "Reached the stars 🌟" : `${into}/${needed} XP to Lv. ${playerLevel + 1}`}
                  </small>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[12.5px] font-semibold text-success bg-success-bg border border-success-line rounded-full px-3 py-1">
                  🔥 {profile?.streak_days ?? 0} day streak
                </span>
                <span className="text-[12.5px] font-semibold text-muted bg-warm border border-line rounded-full px-3 py-1">
                  🌰 {profile?.coins ?? 0} coins
                </span>
                {(extras?.streak_freezes ?? 0) > 0 && (
                  <span className="text-[12.5px] font-semibold text-sky-deep bg-[var(--tint-sky)] border border-[var(--tint-sky-line)] rounded-full px-3 py-1">
                    🧊 {extras?.streak_freezes} freeze{extras?.streak_freezes === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>

            {/* 1. learning progress — moved here from the Garden */}
            <LearningProgress cefr={level} progress={skillProgress} />

            {/* 2. word memory — only once there is a word to remember */}
            {hasVocab && <WordMemory boxes={boxes} total={vocabRows.length} due={dueNow} />}

            {/* 3. accuracy — every metric with data behind it, and nothing else */}
            {metrics.length > 0 && <AccuracyStats metrics={metrics} missingScores={noScoreSkills} />}

            {/* 4. the words that trip you up most */}
            {practiseWords.length > 0 && <WordsToPractise words={practiseWords} />}

            {/* 5. level tests taken */}
            {levelRows.length > 0 && <LevelHistory rows={levelRows} />}

            {/* nothing studied yet: one line instead of five empty cards */}
            {!hasVocab && metrics.length === 0 && (
              <div className="border border-dashed border-dash rounded-[14px] bg-cream px-[22px] py-5 text-[13px] text-muted">
                {t("noStatsYet")}
              </div>
            )}

            {/* 6. settings */}
            <h2 className="font-semibold text-[15px] mt-3.5">{t("settings")}</h2>

            <ReminderSettings
              userId={user.id}
              initialPush={extras?.reminder_push ?? false}
              initialEmail={extras?.reminder_email ?? false}
              initialHour={extras?.reminder_hour ?? 18}
              hasEmail={!!user.email}
            />

            {/* Insights is switched off until it's rebuilt (2026-08-28). The
                component still exists — restore this line and the /stats
                anchor when it comes back. Its headline metric is lifetime
                correct/incorrect, the very measure the promotion gate dropped,
                so shipping it as-is would contradict the level-up screen. */}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

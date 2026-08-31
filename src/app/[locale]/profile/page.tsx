import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ReminderSettings from "@/components/profile/ReminderSettings";
import HeadlineKpis, { type Headline } from "@/components/profile/HeadlineKpis";
import SkillAccuracy, { type SkillScore, type SkillPending } from "@/components/profile/SkillAccuracy";
import StudyDays, { type StudyDay } from "@/components/profile/StudyDays";
import BestHours from "@/components/profile/BestHours";
import WordsToReview, { type DueWord } from "@/components/profile/WordsToReview";
import { computeSkillProgress } from "@/components/profile/skill-progress";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { type CefrLevel } from "@/lib/tree";
import { PUBLIC_VOCAB_WORDS } from "@/lib/vocab-slugs";

// My account (2026-08-30, rebuilt): an ANALYSIS page. A headline that states
// the conclusion, per-skill accuracy, when the learner actually studies, and
// their words. Identity (avatar, name, XP) moved to the dashboard TreeCard
// 2026-09-01. The old SRS box ladder and the
// level-test history are gone — the ladder was unreadable ("how to read it,
// I have no idea") and the history answered a question nobody asked.
//
// Every query is unwrapped error-tolerantly: a stats page must degrade to a
// smaller page, never to a 500.

type VocabRow = {
  word_key: string;
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

const DAY_MS = 86_400_000;
const CHART_DAYS = 30;
const MIN_HOUR_EVENTS = 10;
const DUE_LIST_MAX = 8;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function ProfilePage() {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");
  const format = await getFormatter();
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const now = new Date();
  const nowIso = now.toISOString();

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
    activityRes,
    xpRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
    // Migration 0035 columns, tolerant of a not-yet-applied migration.
    supabase
      .from("profiles")
      .select("reminder_push, reminder_email, streak_freezes")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("vocabulary_progress")
      .select("word_key, correct_count, incorrect_count, next_review_at")
      .eq("user_id", user.id),
    supabase.from("reading_progress").select("passage_key, correct_count, incorrect_count").eq("user_id", user.id),
    // score / quiz_correct arrive with migration 0037; both selects are
    // retried below without them so an unapplied migration costs the score,
    // not the page.
    supabase.from("writing_progress").select("prompt_key, score").eq("user_id", user.id),
    supabase
      .from("listening_progress")
      .select("dialogue_id, quiz_correct")
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    supabase.from("speaking_progress").select("prompt_key, best_score").eq("user_id", user.id),
    supabase.from("grammar_progress").select("lesson_key, score").eq("user_id", user.id),
    supabase.from("daily_activity").select("activity_date, minutes").eq("user_id", user.id),
    supabase
      .from("xp_events")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);

  const extras = extrasRes.error ? null : extrasRes.data;
  const vocabRows = (vocabRes.error ? [] : (vocabRes.data as VocabRow[] | null) ?? []) as VocabRow[];
  const readingRows = readingRes.error ? [] : readingRes.data ?? [];
  const speakingRows = speakingRes.error ? [] : speakingRes.data ?? [];
  const grammarRows = grammarRes.error ? [] : grammarRes.data ?? [];
  const activityRows = activityRes.error ? [] : activityRes.data ?? [];
  const xpRows = xpRes.error ? [] : xpRes.data ?? [];

  type WritingRow = { prompt_key: string; score: number | null };
  type ListeningRow = { dialogue_id: string; quiz_correct: boolean | null };

  let writingRows: WritingRow[] = writingRes.error ? [] : ((writingRes.data ?? []) as WritingRow[]);
  if (writingRes.error) {
    const retry = await supabase.from("writing_progress").select("prompt_key").eq("user_id", user.id);
    writingRows = retry.error ? [] : (retry.data ?? []).map((r) => ({ prompt_key: r.prompt_key, score: null }));
  }

  let listeningRows: ListeningRow[] = listeningRes.error ? [] : ((listeningRes.data ?? []) as ListeningRow[]);
  if (listeningRes.error) {
    const retry = await supabase
      .from("listening_progress")
      .select("dialogue_id")
      .eq("user_id", user.id)
      .not("completed_at", "is", null);
    listeningRows = retry.error ? [] : (retry.data ?? []).map((r) => ({ dialogue_id: r.dialogue_id, quiz_correct: null }));
  }

  const level = (profile?.current_level ?? "A1") as CefrLevel;
  const streakDays = profile?.streak_days ?? 0;

  // ── level progress: the grey line under each skill name ──────────────────
  const skillProgress = computeSkillProgress({
    cefr: level,
    grammarKeys: grammarRows.map((r) => r.lesson_key),
    vocabKeys: vocabRows.map((r) => r.word_key),
    listeningIds: listeningRows.map((r) => r.dialogue_id),
    readingKeys: readingRows.map((r) => r.passage_key),
    writingKeys: writingRows.map((r) => r.prompt_key),
    speakingKeys: speakingRows.map((r) => r.prompt_key),
  });

  const UNITS: Record<string, string> = {
    grammar: t("unitLessons"),
    vocabulary: t("unitWords"),
    listening: t("unitClips"),
    reading: t("unitPassages"),
    writing: t("unitPrompts"),
    pronunciation: t("unitChapters"),
  };

  function progressLine(key: string): string {
    const p = skillProgress[key] ?? { done: 0, total: 0 };
    const args = { done: p.done, total: p.total, unit: UNITS[key] };
    // pronunciation counts chapters across the whole course, not per level
    return key === "pronunciation"
      ? t("progressCountPlain", args)
      : t("progressCount", { ...args, level });
  }

  // ── accuracy: one honest number per skill, each on its own basis ─────────
  const rate = (rows: { correct_count: number | null; incorrect_count: number | null }[]) =>
    rows.reduce(
      (acc, r) => ({
        ok: acc.ok + (r.correct_count ?? 0),
        all: acc.all + (r.correct_count ?? 0) + (r.incorrect_count ?? 0),
      }),
      { ok: 0, all: 0 }
    );
  const avg = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);

  const vocabRate = rate(vocabRows);
  const readingRate = rate(readingRows);
  const speakingScores = speakingRows.map((r) => r.best_score).filter((s): s is number => typeof s === "number");
  const grammarScores = grammarRows.map((r) => r.score).filter((s): s is number => typeof s === "number");
  const writingScores = writingRows.map((r) => r.score).filter((s): s is number => typeof s === "number");
  // null = clip had no quiz, or was finished before the column existed. Those
  // rows leave the denominator entirely; counting them as wrong would invent
  // failures the learner never had.
  const listeningQuizzes = listeningRows
    .map((r) => r.quiz_correct)
    .filter((v): v is boolean => typeof v === "boolean");

  const scores: SkillScore[] = [];
  const pending: SkillPending[] = [];
  const push = (key: string, hasData: boolean, percent: number, basis: string) => {
    if (hasData) scores.push({ key, percent, basis, progress: progressLine(key) });
    else pending.push({ key, progress: progressLine(key) });
  };

  push(
    "vocabulary",
    vocabRate.all > 0,
    vocabRate.all > 0 ? Math.round((vocabRate.ok / vocabRate.all) * 100) : 0,
    t("basisAnswers", { correct: vocabRate.ok, total: vocabRate.all })
  );
  push(
    "reading",
    readingRate.all > 0,
    readingRate.all > 0 ? Math.round((readingRate.ok / readingRate.all) * 100) : 0,
    t("basisAnswers", { correct: readingRate.ok, total: readingRate.all })
  );
  push(
    "pronunciation",
    speakingScores.length > 0,
    speakingScores.length > 0 ? avg(speakingScores) : 0,
    t("basisWords", { count: speakingScores.length })
  );
  push(
    "grammar",
    grammarScores.length > 0,
    grammarScores.length > 0 ? avg(grammarScores) : 0,
    t("basisLessons", { count: grammarScores.length })
  );
  push(
    "listening",
    listeningQuizzes.length > 0,
    listeningQuizzes.length > 0
      ? Math.round((listeningQuizzes.filter(Boolean).length / listeningQuizzes.length) * 100)
      : 0,
    t("basisClips", { count: listeningQuizzes.length })
  );
  push(
    "writing",
    writingScores.length > 0,
    writingScores.length > 0 ? avg(writingScores) : 0,
    t("basisPrompts", { count: writingScores.length })
  );

  const ranked = [...scores].sort((a, b) => b.percent - a.percent);
  const headline: Headline =
    ranked.length >= 2
      ? { kind: "compare", bestKey: ranked[0].key, worstKey: ranked[ranked.length - 1].key }
      : ranked.length === 1
        ? { kind: "single", skillKey: ranked[0].key }
        : null;

  // ── study time ───────────────────────────────────────────────────────────
  const minutesByDate = new Map<string, number>(
    activityRows.map((r) => [r.activity_date as string, r.minutes ?? 0])
  );
  const totalMinutes = activityRows.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const activeDays = activityRows.filter((r) => (r.minutes ?? 0) > 0).length;

  const chartDays: StudyDay[] = Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = isoDay(new Date(now.getTime() - (CHART_DAYS - 1 - i) * DAY_MS));
    return { date, minutes: minutesByDate.get(date) ?? 0 };
  });

  const hourTimestamps = xpRows.map((r) => r.created_at as string).filter(Boolean);

  // ── words to review ──────────────────────────────────────────────────────
  // Only the due queue. No box distribution, no stage labels, no intervals:
  // the learner wants this card to manage what needs reviewing, and a
  // collection-health meter is a number they cannot act on.
  const due = vocabRows.filter((r) => r.next_review_at != null && r.next_review_at <= nowIso);
  const dueCount = due.length;

  const dueWords: DueWord[] = due
    // hardest first, then whatever came due earliest
    .sort(
      (a, b) =>
        (b.incorrect_count ?? 0) - (a.incorrect_count ?? 0) ||
        (a.next_review_at ?? "").localeCompare(b.next_review_at ?? "")
    )
    .slice(0, DUE_LIST_MAX)
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

  // nothing due: the soonest word still to come back, if there is one
  const nextReturnAt = vocabRows
    .map((r) => r.next_review_at)
    .filter((v): v is string => v != null && v > nowIso)
    .sort()[0];
  const nextReturn = dueCount === 0 && nextReturnAt ? format.relativeTime(new Date(nextReturnAt), now) : null;

  const hasVocab = vocabRows.length > 0;
  const hasAnything = hasVocab || scores.length > 0 || totalMinutes > 0;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center kr text-[15px] mr-[9px]">
                나
              </span>
              {tn("myProgress")}
            </h1>
          </div>

          {/* grid-cols-1 pins the track to minmax(0,1fr); a bare auto track
              grows to the widest card's max-content and overflows on mobile */}
          <div className="max-w-[820px] grid grid-cols-1 gap-3.5">
            {/* Identity (avatar, name, XP, chips) moved to the dashboard's
                TreeCard 2026-09-01 — this page is analysis only. */}

            {/* 1. the conclusion, then the headline numbers behind it */}
            {hasAnything && (
              <HeadlineKpis
                headline={headline}
                streakDays={streakDays}
                totalMinutes={totalMinutes}
                wordCount={vocabRows.length}
                activeDays={activeDays}
              />
            )}

            {/* 2. accuracy per skill — the point of the page */}
            {scores.length > 0 && <SkillAccuracy scores={scores} pending={pending} />}

            {/* 3. when you study */}
            {totalMinutes > 0 && <StudyDays days={chartDays} streakDays={streakDays} />}

            {/* 4. your best hours — client-side, the reader's own timezone */}
            {hourTimestamps.length >= MIN_HOUR_EVENTS && <BestHours timestamps={hourTimestamps} />}

            {/* 5. the due queue — the whole of what this card is for */}
            {hasVocab && <WordsToReview words={dueWords} dueCount={dueCount} nextReturn={nextReturn} />}

            {/* nothing studied yet: one line instead of a stack of empty cards */}
            {!hasAnything && (
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
              hasEmail={!!user.email}
            />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

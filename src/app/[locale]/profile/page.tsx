import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LevelMap from "@/components/dashboard/LevelMap";
import { computeEligibility } from "@/lib/promotion-server";
import { testForGrade } from "@/lib/promotion-test";
import { Link } from "@/i18n/navigation";
import { type SkillScore, type SkillPending } from "@/components/profile/SkillAccuracy";
import WordsToReview from "@/components/profile/WordsToReview";
import WeekChart, { type WeekDay } from "@/components/profile/WeekChart";
import SkillBars, { type SkillBar } from "@/components/profile/SkillBars";
import SkillRadar from "@/components/profile/SkillRadar";
import { computeSkillProgress, PRACTICE_SKILLS } from "@/components/profile/skill-progress";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { dailyReviewCap } from "@/lib/srs";
import { iso } from "@/lib/study-garden";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// Learn (2026-09-07, the "학습" tab of the My Room restructure): the
// analysis page. "Heading to A2", three numbers, this week's minutes, one
// bar per skill with the weakest called out and a row that sends you there,
// then the level map (the only promotion nudge) and the review queue.
// Identity lives on the dashboard TreeCard; settings moved to /myroom.
//
// Every query is unwrapped error-tolerantly: a stats page must degrade to a
// smaller page, never to a 500.

type VocabRow = {
  word_key: string;
  correct_count: number | null;
  incorrect_count: number | null;
  next_review_at: string | null;
};

export default async function ProfilePage() {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");
  const tl = await getTranslations("profile.learn");
  const tDash = await getTranslations("dashboard");
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
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
    // Migration 0035/0056 columns, tolerant of a not-yet-applied migration.
    supabase
      .from("profiles")
      .select("reminder_push, reminder_email, streak_freezes, coins, review_capacity_bonus, is_admin")
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
  ]);

  const extras = extrasRes.error ? null : extrasRes.data;
  const vocabRows = (vocabRes.error ? [] : (vocabRes.data as VocabRow[] | null) ?? []) as VocabRow[];
  const readingRows = readingRes.error ? [] : readingRes.data ?? [];
  const speakingRows = speakingRes.error ? [] : speakingRes.data ?? [];
  const grammarRows = grammarRes.error ? [] : grammarRes.data ?? [];
  const activityRows = activityRes.error ? [] : activityRes.data ?? [];

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

  // "Your path" — moved here from the Garden 2026-09-03 so a learner who's
  // eligible but not testing yet isn't nagged by it every dashboard visit.
  const promo = testForGrade(level);
  const elig = await computeEligibility(supabase, user.id, level);
  const promoChecks = [
    {
      label: tDash("levelMap.checkWordsHeld"),
      ok: elig.wordsMastered >= elig.wordsRequired,
      value: `${elig.wordsMastered}/${elig.wordsRequired}`,
    },
    {
      label: tDash("levelMap.checkReading"),
      ok: elig.readingDone >= elig.readingRequired,
      value: `${elig.readingDone}/${elig.readingRequired}`,
    },
  ];
  const overallPct = Math.round(
    Object.values(skillProgress).reduce((sum, p) => sum + p.percent, 0) / Object.keys(skillProgress).length
  );

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
  const weakest = ranked.length >= 2 ? ranked[ranked.length - 1] : null;
  // Overall accuracy: the mean of the per-skill scores — each skill on its own
  // basis, so averaging the bases together would mix answers with scores.
  const overallAccuracy = scores.length ? avg(scores.map((s) => s.percent)) : null;
  // Grammar folds into Writing under the restructure, so its "fill it in"
  // sends the learner to /writing rather than a page on its way out.
  const SKILL_HREF: Record<string, string> = Object.fromEntries(PRACTICE_SKILLS.map((s) => [s.key, s.href]));
  SKILL_HREF.grammar = "/writing";
  const skillBars: SkillBar[] = ranked.map((s) => ({
    key: s.key,
    label: tn(s.key),
    percent: s.percent,
    weakest: s.key === weakest?.key,
  }));

  // ── study time ───────────────────────────────────────────────────────────
  const totalMinutes = activityRows.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const minutesByDate = new Map(activityRows.map((r) => [r.activity_date, r.minutes ?? 0]));
  // Monday..today (locale-independent Monday start — the week mockup shows
  // 월…오늘). A Monday visit is a single bar.
  const todayIso = iso(now);
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const weekDays: WeekDay[] = Array.from({ length: dow + 1 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (dow - i));
    const key = iso(d);
    return { iso: key, label: format.dateTime(d, { weekday: "short" }), minutes: minutesByDate.get(key) ?? 0, today: key === todayIso };
  });
  const weekTotal = weekDays.reduce((a, d) => a + d.minutes, 0);
  const avgPerDay = Math.round(weekTotal / weekDays.length);
  const wordsLearned = vocabRows.filter((r) => (r.correct_count ?? 0) + (r.incorrect_count ?? 0) > 0).length;
  const nextLevel = LEVEL_ORDER[LEVEL_ORDER.indexOf(level) + 1] ?? null;

  // ── words to review ──────────────────────────────────────────────────────
  // Only the due queue. No box distribution, no stage labels, no intervals:
  // the learner wants this card to manage what needs reviewing, and a
  // collection-health meter is a number they cannot act on.
  // The real backlog is never shown — only how many are actually reachable
  // today (this account's daily cap), so this card can't say a bigger number
  // than /review itself will ever hand out. See [[review daily cap]].
  // A word_bank bookmark (see plantWord/saveToBank) plants next_review_at
  // but no attempt — this card must agree with /review's own queue, which
  // never surfaces an unattempted word.
  const due = vocabRows.filter(
    (r) => r.next_review_at != null && r.next_review_at <= nowIso && (r.correct_count ?? 0) + (r.incorrect_count ?? 0) > 0
  );
  const reviewCap = dailyReviewCap(extras?.review_capacity_bonus ?? 0);
  const dueCount = Math.min(due.length, reviewCap);

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
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">

          <h1 className="font-bold text-[clamp(22px,5vw,26px)] tracking-[-0.02em] mb-[18px]">
            {nextLevel ? tl("heading", { level: nextLevel }) : tl("atTop")}
          </h1>

          {/* grid-cols-1 pins the track to minmax(0,1fr); a bare auto track
              grows to the widest card's max-content and overflows on mobile */}
          <div className="max-w-[560px] grid grid-cols-1 gap-3">
            {hasAnything && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: String(streakDays), l: tl("statStreak") },
                  { v: overallAccuracy === null ? "–" : `${overallAccuracy}%`, l: tl("statAccuracy") },
                  { v: String(wordsLearned), l: tl("statWords") },
                ].map((s) => (
                  <div key={s.l} className="border border-line rounded-[14px] bg-cream px-2 py-3 text-center">
                    <b className="block font-extrabold text-[clamp(18px,4.5vw,22px)] tabular-nums leading-tight">{s.v}</b>
                    <span className="block text-[11.5px] text-muted mt-0.5">{s.l}</span>
                  </div>
                ))}
              </div>
            )}

            {hasAnything && <WeekChart days={weekDays} avgPerDay={avgPerDay} />}

            {skillBars.length > 0 && <SkillRadar rows={skillBars} />}
            {skillBars.length > 0 && <SkillBars rows={skillBars} weakestLabel={weakest ? tn(weakest.key) : null} />}

            {weakest && (
              <Link
                href={SKILL_HREF[weakest.key] ?? "/dashboard"}
                className="flex items-center gap-3 border border-line bg-cream rounded-[14px] px-4 py-2.5 transition-all hover:-translate-y-0.5 hover:border-success group"
              >
                <span className="flex-none text-[18px]" aria-hidden="true">
                  {PRACTICE_SKILLS.find((s) => s.key === weakest.key)?.kr ?? "·"}
                </span>
                <b className="flex-1 min-w-0 truncate text-[14px] font-bold">{tl("behind", { skill: tn(weakest.key) })}</b>
                <span className="flex-none text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
                  {tl("fillIn")}
                </span>
              </Link>
            )}

            {/* nothing studied yet: one line instead of a stack of empty cards */}
            {!hasAnything && (
              <div className="border border-dashed border-dash rounded-[14px] bg-cream px-[22px] py-5 text-[13px] text-muted">
                {t("noStatsYet")}
              </div>
            )}

            {/* curriculum map: A1 → C2 stepper + level-up checks — the one
                promotion nudge the app keeps */}
            {promo && (
              <LevelMap current={level} checks={promoChecks} eligible={elig.eligible} overallPct={overallPct} />
            )}

            {hasVocab && (
              <WordsToReview
                dueCount={dueCount}
                nextReturn={nextReturn}
                capacityBonus={extras?.review_capacity_bonus ?? 0}
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LevelMap from "@/components/dashboard/LevelMap";
import { computeEligibility } from "@/lib/promotion-server";
import { testForGrade } from "@/lib/promotion-test";
import { Link } from "@/i18n/navigation";
import WordsToReview from "@/components/profile/WordsToReview";
import WeekChart, { type WeekDay } from "@/components/profile/WeekChart";
import SkillBars, { type SkillBar } from "@/components/profile/SkillBars";
import SkillRadar from "@/components/profile/SkillRadar";
import MonthlyGrass from "@/components/profile/MonthlyGrass";
import KnownWords, { type WordBand } from "@/components/profile/KnownWords";
import TreeLedger, { type LedgerRow } from "@/components/profile/TreeLedger";
import PeriodTabs, { asPeriod, periodDays } from "@/components/profile/PeriodTabs";
import {
  computeSkillProgress,
  PRACTICE_SKILLS,
  type SkillScore,
  type SkillPending,
} from "@/components/profile/skill-progress";
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
  box: number | null;
  created_at: string | null;
};

type XpRow = { points: number | null; skill: string | null; created_at: string };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
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

  // The window every card reads. It lives in the URL (?p=90), so the page
  // stays a server component and a shared link keeps its period.
  const period = asPeriod((await searchParams).p);
  const windowDays = periodDays(period);
  const windowStart = windowDays == null ? null : new Date(now.getTime() - windowDays * 864e5);
  const windowStartIso = windowStart?.toISOString() ?? null;

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
    growthRes,
    xpRes,
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
      .select("word_key, correct_count, incorrect_count, next_review_at, box, created_at")
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
    // best_streak: computed server-side (0019_growth_stats.sql) from the
    // same daily_activity rows fetched above — tolerant of an unapplied
    // migration, same as every other query on this page.
    supabase.rpc("get_my_growth_stats").maybeSingle(),
    // What grew the tree: XP with its source. `skill` is null on ~8% of
    // rows (older award_xp calls), which the ledger folds into "other"
    // rather than dropping — the total has to keep adding up.
    (() => {
      const q = supabase.from("xp_events").select("points, skill, created_at").eq("user_id", user.id);
      return windowStartIso ? q.gte("created_at", windowStartIso) : q;
    })(),
  ]);

  const extras = extrasRes.error ? null : extrasRes.data;
  let vocabRows = (vocabRes.error ? [] : (vocabRes.data as VocabRow[] | null) ?? []) as VocabRow[];
  if (vocabRes.error) {
    const retry = await supabase
      .from("vocabulary_progress")
      .select("word_key, correct_count, incorrect_count, next_review_at")
      .eq("user_id", user.id);
    vocabRows = retry.error ? [] : ((retry.data ?? []) as VocabRow[]).map((r) => ({ ...r, box: null, created_at: null }));
  }
  const xpRows = (xpRes.error ? [] : (xpRes.data as XpRow[] | null) ?? []) as XpRow[];
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
  // Only worth a line when it's actually a different number — "best 18"
  // next to a current streak of 18 tells the learner nothing new.
  const bestStreak = growthRes.error ? null : ((growthRes.data as { best_streak: number } | null)?.best_streak ?? null);
  const showBestStreak = bestStreak != null && bestStreak > streakDays;

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
  // Overall accuracy is deliberately not shown any more (2026-09-09): a bare
  // "81%" says nothing without a direction, and the skill bars below carry
  // the same numbers where they can be compared.
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

  // ── words you know ──────────────────────────────────────────────────────
  // "Known" means answered at least once — the same rule the old stat tile
  // used, now the headline. The four bands are the SRS boxes: 1 just met,
  // 2 still shaky, 3 solid, 4-5 second nature (lib/srs.ts intervals).
  const studied = vocabRows.filter((r) => (r.correct_count ?? 0) + (r.incorrect_count ?? 0) > 0);
  const inBox = (lo: number, hi: number) => studied.filter((r) => (r.box ?? 1) >= lo && (r.box ?? 1) <= hi).length;
  const bands: WordBand[] = [
    { label: tl("knownBox1"), count: inBox(1, 1), fill: "var(--tint-green)" },
    { label: tl("knownBox2"), count: inBox(2, 2), fill: "var(--c-success-line)" },
    { label: tl("knownBox3"), count: inBox(3, 3), fill: "var(--c-success)" },
    { label: tl("knownBox4"), count: inBox(4, 5), fill: "var(--c-success-deep)" },
  ];

  // The curve is reconstructed from when each word was first opened
  // (created_at) — the only per-word history the table keeps. It is
  // therefore "words started", counted cumulatively; box changes have no
  // log, so no line here pretends to know when a word became solid.
  const firstSeen = studied
    .map((r) => r.created_at)
    .filter((v): v is string => v != null)
    .sort();
  const curveStart = windowStart ?? (firstSeen[0] ? new Date(firstSeen[0]) : now);
  const before = firstSeen.filter((d) => new Date(d) < curveStart).length;
  const knownDelta = firstSeen.length - before;
  const STEPS = 12;
  const stepMs = Math.max(1, (now.getTime() - curveStart.getTime()) / STEPS);
  const series =
    firstSeen.length === 0
      ? []
      : Array.from({ length: STEPS + 1 }, (_, i) => {
          const at = curveStart.getTime() + stepMs * i;
          return firstSeen.filter((d) => new Date(d).getTime() <= at).length;
        });

  // ── what grew the tree ──────────────────────────────────────────────────
  const bySkill = new Map<string, number>();
  for (const r of xpRows) {
    const key = r.skill ?? "other";
    bySkill.set(key, (bySkill.get(key) ?? 0) + (r.points ?? 0));
  }
  const skillLabel = (key: string) => {
    if (key === "other") return tl("ledgerOther");
    if (key === "quest") return tl("ledgerQuest");
    // nav has a name for every practice skill; anything else prints its key
    // rather than a missing-message crash.
    try {
      return tn(key as Parameters<typeof tn>[0]);
    } catch {
      return key;
    }
  };
  const LEDGER_ROWS = 6;
  const ledgerAll = [...bySkill.entries()]
    .filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1]);
  const ledgerHead = ledgerAll.slice(0, LEDGER_ROWS);
  const ledgerTail = ledgerAll.slice(LEDGER_ROWS);
  const tailPoints = ledgerTail.reduce((a, [, p]) => a + p, 0);
  const ledgerRows: LedgerRow[] = [
    ...ledgerHead.map(([key, points]) => ({ key, label: skillLabel(key), points })),
    ...(tailPoints > 0 ? [{ key: "rest", label: tl("ledgerOther"), points: tailPoints }] : []),
  ];
  const ledgerTotal = ledgerAll.reduce((a, [, p]) => a + p, 0);

  // ── how close the next door is ──────────────────────────────────────────
  // Words still needed, divided by the pace actually observed in this
  // window. Arithmetic, not a promise — so it only shows when there is a
  // real pace to divide by.
  // The pace comes from words STARTED in the window, which is the only
  // per-word history the table keeps — a word entering the box ladder has no
  // log. It stands in for the mastering pace, so the line only appears once
  // some words are actually mastered, and it is dropped past PACE_MAX_DAYS:
  // "about 635 days" is arithmetic, but it tells a beginner nothing except
  // to give up.
  const PACE_MAX_DAYS = 90;
  const wordsLeft = Math.max(0, elig.wordsRequired - elig.wordsMastered);
  const paceRaw =
    windowDays != null && knownDelta > 0 && wordsLeft > 0 && elig.wordsMastered > 0
      ? Math.max(1, Math.ceil((wordsLeft / knownDelta) * windowDays))
      : null;
  const paceDays = paceRaw != null && paceRaw <= PACE_MAX_DAYS ? paceRaw : null;

  // ── study calendar (this year) ──────────────────────────────────────────
  const yearPrefix = `${now.getFullYear()}-`;
  const yearRows = activityRows.filter((r) => r.activity_date.startsWith(yearPrefix) && (r.minutes ?? 0) > 0);
  const yearMinutes = yearRows.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const yearDays = yearRows.length;

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

          <div className="max-w-[560px] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 mb-[18px]">
            <h1 className="font-bold text-[clamp(22px,5vw,26px)] tracking-[-0.02em]">
              {nextLevel ? tl("heading", { level: nextLevel }) : tl("atTop")}
            </h1>
            {hasAnything && <PeriodTabs current={period} />}
          </div>

          {/* grid-cols-1 pins the track to minmax(0,1fr); a bare auto track
              grows to the widest card's max-content and overflows on mobile */}
          <div className="max-w-[560px] grid grid-cols-1 gap-3">
            {/* 1 · what the learner actually knows — the page's headline */}
            {hasVocab && (
              <KnownWords
                total={wordsLearned}
                delta={knownDelta}
                bands={bands}
                series={series}
                startLabel={format.dateTime(curveStart, { month: "short", day: "numeric" })}
                endLabel={tl("today")}
              />
            )}

            {/* 2 · the door being opened right now, and what is left of it */}
            {promo && (
              <LevelMap
                current={level}
                checks={promoChecks}
                eligible={elig.eligible}
                overallPct={overallPct}
                paceDays={paceDays}
              />
            )}

            {/* 3 · the tree's ledger: which skills paid for this period's growth */}
            {hasAnything && <TreeLedger rows={ledgerRows} total={ledgerTotal} />}

            {/* habit is a different question from growth, so it sits apart */}
            {hasAnything && (
              <WeekChart
                days={weekDays}
                avgPerDay={avgPerDay}
                streakDays={streakDays}
                bestStreak={showBestStreak ? bestStreak : null}
              />
            )}

            {weakest && (
              <Link
                href={SKILL_HREF[weakest.key] ?? "/dashboard"}
                className="flex items-center gap-3 border border-line bg-cream rounded-[14px] px-4 py-2.5 transition-all hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99] hover:border-success group"
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

            {skillBars.length > 0 && (
              <details className="border border-line rounded-[14px] bg-cream px-4 py-3 [&_svg]:mt-2">
                <summary className="text-[14px] font-semibold cursor-pointer marker:text-faint">
                  {tl("skillBalance")}
                </summary>
                <div className="grid gap-3 mt-3">
                  <SkillRadar rows={skillBars} />
                  <SkillBars rows={skillBars} weakestLabel={weakest ? tn(weakest.key) : null} />
                </div>
              </details>
            )}

            {hasAnything && (
              <MonthlyGrass
                minutesByDate={minutesByDate}
                headline={[
                  { label: tl("yearDays"), value: String(yearDays) },
                  { label: tl("yearMinutes"), value: String(yearMinutes) },
                ]}
              />
            )}

            {/* nothing studied yet: one line instead of a stack of empty cards */}
            {!hasAnything && (
              <div className="border border-dashed border-dash rounded-[14px] bg-cream px-[22px] py-5 text-[13px] text-muted">
                {t("noStatsYet")}
              </div>
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

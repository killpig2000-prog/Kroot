import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Widgets from "@/components/dashboard/Widgets";
import WordOfDayCard from "@/components/dashboard/WordOfDayCard";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import Greeting from "@/components/dashboard/Greeting";
import TodaysQuestCard from "@/components/dashboard/TodaysQuestCard";
import { FirstVisitPlan, LockedWidgets, type FirstVisitStep } from "@/components/dashboard/FirstVisitPlan";
import InstallBanner from "@/components/pwa/InstallBanner";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import TutorialFinishBanner from "@/components/onboarding/TutorialFinishBanner";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { GRAMMAR_LESSONS } from "@/lib/grammar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import MonthlyGrass from "@/components/profile/MonthlyGrass";
import { ELIGIBILITY } from "@/lib/promotion-test";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getPassagesForLevel } from "@/lib/reading";
import { getPromptsForLevel } from "@/lib/writing";
import { chapterClearStats } from "@/lib/pronunciation";
import { CHAPTER_SIZE } from "@/lib/vocabulary";
import { dailyReviewCap } from "@/lib/srs";
import { getWordsForTopic } from "@/lib/vocabulary-words";
import { firstVisitState, NEW_ACCOUNT_DAYS, SHOW_ALL_COOKIE } from "@/lib/first-visit";
import { countCompletedSessions } from "@/lib/first-visit-server";
import { slangOfTheDay } from "@/lib/slang";
import type { CefrLevel } from "@/lib/tree";

const MONTH_GOAL = 20;

// One quest per day, rotating through the four practice skills. `description`
// is what gets stored on the daily_quests row (a locale-free fallback);
// TodaysQuestCard renders the localized copy from skill_key.
const QUEST_ROTATION = [
  { skill_key: "writing", title: "Today's quest", description: "Writing · one chapter, a few questions · ~8 min" },
  { skill_key: "vocabulary", title: "Today's quest", description: "Review · your due words · ~5 min" },
  { skill_key: "listening", title: "Today's quest", description: "Listening · one dialogue at your level · ~5 min" },
  { skill_key: "reading", title: "Today's quest", description: "Reading · one short passage · ~4 min" },
  { skill_key: "pronunciation", title: "Today's quest", description: "Pronunciation · clear one chapter · ~4 min" },
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return iso(new Date());
}

/** Longest run of consecutive study days across the whole history. */
function bestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const isoDay of sorted) {
    const d = new Date(isoDay);
    run = prev && d.getTime() - prev.getTime() === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/* Monday-start week of `now`, as 7 ISO dates */
function weekDates(now: Date) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

type Snapshot = {
  profile: {
    display_name: string | null;
    current_level: string | null;
    xp: number | null;
    streak_days: number | null;
    last_active_date: string | null;
    avatar_url: string | null;
    created_at: string | null;
  } | null;
  extras: { streak_freezes: number | null; reminder_push: boolean | null; reminder_email: boolean | null } | null;
  streak: number;
  costumes: { costume_id: string; equipped: boolean }[];
  quest: { id: string; skill_key: string; title: string; description: string; completed_at: string | null } | null;
  listening: string[];
  reading: string[];
  writing: string[];
  speaking: { prompt_key: string; best_score: number | null }[];
  due_count: number;
  activity: { activity_date: string; minutes: number | null }[];
  level_tests: number;
  grammar: string[];
  vocab_keys: string[];
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const [t, locale] = await Promise.all([getTranslations("dashboard"), getLocale()]);
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const today = todayISO();

  // Date windows computed up front so downstream math runs in one pass.
  const now = new Date();
  const week = weekDates(now);
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1));

  // Every read this page needs (profile, quest, five progress tables, due
  // count, activity, level-test count) plus touch_streak, in one round trip.
  // Was 14 separate REST calls — on the free Nano instance, that per-request
  // overhead (not query cost) was what capped concurrent dashboard loads.
  // See supabase/migrations/0041_dashboard_snapshot.sql (SECURITY INVOKER —
  // every read still goes through the caller's RLS).
  const { data: snapshotRaw, error: snapshotError } = await supabase.rpc("dashboard_snapshot", { p_today: today });
  if (snapshotError) console.error("dashboard_snapshot failed:", snapshotError.message);
  const snapshot = (snapshotError ? null : (snapshotRaw as Snapshot | null)) ?? {
    profile: null,
    extras: null,
    streak: 0,
    costumes: [],
    quest: null,
    listening: [],
    reading: [],
    writing: [],
    speaking: [],
    due_count: 0,
    activity: [],
    level_tests: 1, // don't bounce a signed-in learner to /onboarding on a query error
    grammar: [],
    vocab_keys: [],
  };
  const profile = snapshot.profile;
  const extras = snapshot.extras;
  const listeningRows = snapshot.listening.map((dialogue_id) => ({ dialogue_id }));
  const readingRows = snapshot.reading.map((passage_key) => ({ passage_key }));
  const writingRows = snapshot.writing.map((prompt_key) => ({ prompt_key }));
  const speakingRows = snapshot.speaking;
  const activity = snapshot.activity;
  const grammarRows = snapshot.grammar.map((lesson_key) => ({ lesson_key }));
  const vocabRows = snapshot.vocab_keys.map((word_key) => ({ word_key }));

  // Confirmed-email signups land here without ever picking a starting level
  // (the confirmation link used to skip onboarding). Send them back; a query
  // error must not lock anyone out of the dashboard.
  if (snapshot.level_tests === 0) redirect("/onboarding");

  const streakDays = snapshot.streak || profile?.streak_days || 0;
  const equippedIds = snapshot.costumes.filter((r) => r.equipped).map((r) => r.costume_id);

  let quest = snapshot.quest;
  const questOfTheDay = QUEST_ROTATION[Math.floor(Date.parse(today) / 86_400_000) % QUEST_ROTATION.length];
  if (!quest) {
    const { data: created } = await supabase
      .from("daily_quests")
      .insert({ user_id: user.id, quest_date: today, ...questOfTheDay })
      .select("id, skill_key, title, description, completed_at")
      .single();
    quest = created ?? null;
  }

  // Real per-skill progress: completed items at the user's difficulty tier.
  const cefr = (profile?.current_level ?? "A1") as CefrLevel;
  // A1 placements tour Hangul + Vocabulary; anyone who placed higher already
  // reads Hangul, so their walkthrough goes Writing + Reading instead.
  const guidedTrack = cefr === "A1" ? "basics" : "practice";

  // First-visit dashboard: accounts under a week old with fewer than three
  // finished sessions see one plan card instead of the full Garden. Only they
  // pay for the analytics count; everyone else skips it.
  const cookieStore = await cookies();
  const showAll = cookieStore.get(SHOW_ALL_COOKIE)?.value === "1";
  const accountAgeDays = profile?.created_at ? (now.getTime() - Date.parse(profile.created_at)) / 86_400_000 : Infinity;
  const maybeNew = !showAll && accountAgeDays < NEW_ACCOUNT_DAYS;

  // "Your path" (promotion eligibility + LevelMap) moved to My progress
  // (/profile) 2026-09-03 — the Garden is a "what do I do today" page, and a
  // once-eligible learner had no way to stop it nagging them here every visit.
  const todayStartIso = `${today}T00:00:00.000Z`;
  const [analyticsSessions, coinsRes, { count: reviewedTodayCount }] = await Promise.all([
    maybeNew ? countCompletedSessions(user.id) : Promise.resolve(null),
    // coins isn't in the snapshot RPC's profile row; a parallel read here
    // beats a function migration for one integer (see 0041's rationale).
    // review_capacity_bonus and is_admin ride along for the same reason —
    // is_admin drives the guided-tour repeat-testing bypass below.
    supabase.from("profiles").select("coins, review_capacity_bonus, is_admin").eq("id", user.id).maybeSingle(),
    // Same daily cap accounting as /review and BottomNav's badge.
    supabase
      .from("vocabulary_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("last_reviewed_at", todayStartIso),
  ]);
  const coins = coinsRes.error ? 0 : coinsRes.data?.coins ?? 0;
  const reviewCapacityBonus = coinsRes.error ? 0 : coinsRes.data?.review_capacity_bonus ?? 0;
  const isAdmin = coinsRes.error ? false : coinsRes.data?.is_admin ?? false;
  // Errors (e.g. migration 0022 not applied yet) just hide the review card.
  // User feedback: an uncapped backlog badge (once past a hundred+ words)
  // read as a scary, un-clearable number rather than something to act on.
  // Capped at this user's daily review cap (10, +10 per set tier, see
  // lib/srs.ts) — matches /review and BottomNav's badge exactly. Zeroes out
  // only once today's total review count reaches the cap, not "cap minus
  // whatever was already done" (a session always fills to the full cap).
  const reviewCap = dailyReviewCap(reviewCapacityBonus);
  const reviewDoneForToday = (reviewedTodayCount ?? 0) >= reviewCap;
  const dueCount = reviewDoneForToday ? 0 : Math.min(snapshot.due_count, reviewCap);

  const tally = (doneKeys: Set<string>, levelKeys: string[], cap?: number) => {
    const done = levelKeys.filter((k) => doneKeys.has(k)).length;
    // Cap the denominator at a reasonable near-term goal instead of the
    // whole level's library — same idea as promotion ELIGIBILITY's
    // targetMasteredWords: the content library has grown much faster than
    // any learner's pace, so "done of everything" reads as permanently
    // near-empty. A smaller, reachable target lets the bar actually fill.
    const total = cap ? Math.min(levelKeys.length, cap) : levelKeys.length;
    return { done: Math.min(done, total), total, percent: total ? Math.round((Math.min(done, total) / total) * 100) : 0 };
  };
  const skillProgress: Record<string, { done: number; total: number; percent: number }> = {
    grammar: tally(
      new Set((grammarRows ?? []).map((r) => r.lesson_key)),
      GRAMMAR_LESSONS.filter((l) => l.level === cefr).map((l) => l.key)
    ),
    vocabulary: tally(
      new Set((vocabRows ?? []).map((r) => r.word_key)),
      getWordsForTopic("daily-life", cefr).map((w) => w.key),
      ELIGIBILITY.targetMasteredWords
    ),
    listening: tally(
      new Set((listeningRows ?? []).map((r) => r.dialogue_id)),
      DIALOGUES.filter((d) => d.level === cefr).map((d) => d.id),
      20
    ),
    reading: tally(
      new Set((readingRows ?? []).map((r) => r.passage_key)),
      getPassagesForLevel(cefr).map((p) => p.key),
      20
    ),
    writing: tally(
      new Set((writingRows ?? []).map((r) => r.prompt_key)),
      getPromptsForLevel(cefr).map((p) => p.key),
      20
    ),
    pronunciation: (() => {
      // A chapter counts as done once every word in it has been attempted
      // at least once — matches the unlock gate on /speaking, which no
      // longer requires an 80+ score to move on.
      const attemptedIds = new Set((speakingRows ?? []).map((r) => r.prompt_key));
      const { done, total } = chapterClearStats(attemptedIds);
      return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
    })(),
  };

  // Word of the day from the real vocabulary deck, rotating daily.
  const allWords = getWordsForTopic("daily-life");
  const wotdRaw = allWords.length
    ? allWords[Math.floor(Date.parse(today) / 86_400_000) % allWords.length]
    : null;
  const wotd = wotdRaw
    ? {
        word: wotdRaw.korean,
        roman: wotdRaw.romanization,
        mean: wotdRaw.meaning_en,
        exKr: wotdRaw.example_kr,
        exEn: wotdRaw.example_en,
      }
    : null;

  const slang = slangOfTheDay();

  // Study-garden numbers (lived on My growth before the merge): the year
  // grass plus lifetime pills, with the old week/month widgets folded in.
  const minutesByDate = new Map((activity ?? []).map((a) => [a.activity_date, a.minutes ?? 0]));
  const weekTotal = week.reduce((sum, d) => sum + (minutesByDate.get(iso(d)) ?? 0), 0);
  const totalMinutes = (activity ?? []).reduce((sum, a) => sum + (a.minutes ?? 0), 0);
  const activeDates = (activity ?? []).filter((a) => (a.minutes ?? 0) > 0).map((a) => a.activity_date);
  const longestStreak = Math.max(bestStreak(activeDates), streakDays);
  const monthDone = (activity ?? []).filter((a) => a.activity_date >= monthStart && (a.minutes ?? 0) > 0).length;
  const monthShort = now.toLocaleDateString(locale, { month: "short" });

  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);

  // "Continue" target: the last unit the learner opened (resume_points), or
  // today's quest when nothing is in progress. A finished unit clears itself.

  // Finished sessions: the activity_completed events, backed up by the
  // progress tables in case a beacon never landed (or the service key is
  // missing locally). Vocab progress is per word, so ten rows ≈ one unit.
  const progressSessions =
    (listeningRows?.length ?? 0) +
    (readingRows?.length ?? 0) +
    (writingRows?.length ?? 0) +
    (grammarRows?.length ?? 0) +
    skillProgress.pronunciation.done +
    Math.floor((vocabRows?.length ?? 0) / CHAPTER_SIZE);
  const firstVisit = firstVisitState({
    createdAt: profile?.created_at,
    sessions: Math.max(analyticsSessions ?? 0, progressSessions),
    streakDays,
    showAll,
    now,
  });

  if (firstVisit.active) {
    // Learners who placed above A1 in onboarding already read Hangul (the
    // alphabet page keeps no progress of its own), so their first step is
    // the vocab unit at their level.
    const vocabUnit1 = `/vocabulary/daily-life/session?chapter=0&level=${cefr}`;
    const steps: FirstVisitStep[] =
      cefr === "A1"
        ? [
            { label: t("firstVisit.steps.hangul"), detail: t("firstVisit.steps.hangulDetail"), time: t("firstVisit.steps.minutes", { n: 2 }), href: "/hangul" },
            { label: t("firstVisit.steps.vocab"), detail: t("firstVisit.steps.vocabDetail"), time: t("firstVisit.steps.minutes", { n: 3 }), href: vocabUnit1 },
            { label: t("firstVisit.steps.waterSeedling"), time: t("firstVisit.steps.seconds", { n: 10 }) },
          ]
        : [
            { label: t("firstVisit.steps.vocab"), detail: t("firstVisit.steps.vocabDetailLevel", { level: cefr }), time: t("firstVisit.steps.minutes", { n: 3 }), href: vocabUnit1 },
            { label: t("firstVisit.steps.listening"), detail: t("firstVisit.steps.listeningDetail"), time: t("firstVisit.steps.minutes", { n: 2 }), href: "/listening" },
            { label: t("firstVisit.steps.waterSeedling"), time: t("firstVisit.steps.seconds", { n: 10 }) },
          ];

    return (
      <div className="min-h-screen bg-warm text-charcoal">
        <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
          <div data-tour="sidebar">
            <Sidebar
              displayName={displayName}
              email={user.email ?? ""}
              streakDays={streakDays}
              avatarUrl={profile?.avatar_url}
              streakFreezes={extras?.streak_freezes ?? 0}
            />
          </div>

          <main className="min-w-0 max-w-[820px] px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
            {/* First lesson right after the tour, for every level — Hangul's
                page itself hands off to Writing once the learner is ready,
                see the tutorial banner on each of those pages. */}
            <OnboardingTour startsGuidedTour guidedTrack={guidedTrack} isAdmin={isAdmin} />
            <GuidedStep step="hangul-nav" />
            <GuidedStep step="writing-nav" />
            <TutorialFinishBanner />
            <h1 className="font-semibold text-[clamp(20px,2.4vw,24px)] tracking-[-0.02em] mb-0.5">
              {t("welcome", { name: displayName })}
            </h1>
            <p className="text-muted text-sm mb-6">{t("day", { n: firstVisit.day })}</p>

            <div data-tour="tree">
              <TreeCard
                level={level}
                progressPct={pct}
                xpInto={into}
                xpNeeded={needed}
                costumeIds={equippedIds}
                species={cefr}
                userId={user.id}
                displayName={displayName}
                avatarUrl={profile?.avatar_url ?? null}
                coins={coins}
                streakDays={streakDays}
                streakFreezes={extras?.streak_freezes ?? 0}
                linkToShop
              />
            </div>

            <FirstVisitPlan steps={steps} />

            {/* unlocked so far, in unlock order. The quest/garden tour steps
                still need a target even before these unlock (day 1), so the
                wrapper stays put and OnboardingTour itself skips a step
                whose target isn't in the DOM yet rather than getting stuck. */}
            {firstVisit.unlocked.quest && (
              <div data-tour="quest">
                <TodaysQuestCard quest={quest} />
              </div>
            )}

            {firstVisit.unlocked.wotd && wotd && <WordOfDayCard wotd={wotd} />}

            {firstVisit.unlocked.heatmap && (
              <div className="mb-[30px]" data-tour="garden">
                <MonthlyGrass
                  minutesByDate={minutesByDate}
                  headline={[
                    { label: t("garden.thisWeek"), value: `${weekTotal}m` },
                    { label: t("garden.bestStreak"), value: `${longestStreak}d` },
                  ]}
                />
              </div>
            )}

            <LockedWidgets unlocked={firstVisit.unlocked} />
          </main>
        </div>

        <BottomNav />
        <FeedbackWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] xl:grid-cols-[clamp(216px,17%,280px)_minmax(0,1fr)_clamp(260px,22%,340px)] w-full min-h-screen">
        <div data-tour="sidebar">
          <Sidebar
            displayName={displayName}
            email={user.email ?? ""}
            streakDays={streakDays}
            avatarUrl={profile?.avatar_url}
            streakFreezes={extras?.streak_freezes ?? 0}
          />
        </div>

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
          <OnboardingTour startsGuidedTour guidedTrack={guidedTrack} isAdmin={isAdmin} />
          <GuidedStep step="hangul-nav" />
          <GuidedStep step="writing-nav" />
          <TutorialFinishBanner />
          <Greeting name={displayName} />

          {/* The snapshot RPC failed, so everything below is the empty
              fallback. Say so: an empty garden otherwise reads as "all my
              progress is gone" rather than "we couldn't load it". */}
          {snapshotError && (
            <div
              role="status"
              className="mb-5 rounded-[10px] border border-amber-line bg-[var(--tint-amber)] px-4 py-3 text-sm text-charcoal"
            >
              {t("loadError")}
            </div>
          )}

          <div data-tour="tree">
            <TreeCard
              level={level}
              progressPct={pct}
              xpInto={into}
              xpNeeded={needed}
              costumeIds={equippedIds}
              species={cefr}
              userId={user.id}
              displayName={displayName}
              avatarUrl={profile?.avatar_url ?? null}
              coins={coins}
              streakDays={streakDays}
              streakFreezes={extras?.streak_freezes ?? 0}
              linkToShop
            />
          </div>

          {/* today's quest — the one always-visible recommendation. Resuming
              a specific in-progress session was removed (product decision:
              one clear "what to do today" beats a resume shortcut). Paired
              side-by-side with the review card on mobile so they don't eat
              two full-width rows; sm+ keeps the original stacked cards. */}
          {quest && dueCount > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4 sm:hidden">
              <TodaysQuestCard quest={quest} compact />
              <Link
                href="/review"
                className="group flex flex-col items-center text-center gap-1.5 rounded-[16px] border border-sky-line bg-[var(--tint-sky)] px-3 py-3.5 h-full transition-all hover:-translate-y-0.5"
              >
                <span className="flex-none w-9 h-9 rounded-[10px] bg-cream border border-sky-line flex items-center justify-center text-[17px]">
                  💧
                </span>
                <b className="block text-[15px] font-bold text-sky-deep leading-tight group-hover:translate-x-0.5 transition-transform">
                  {t("review.short")}
                </b>
              </Link>
            </div>
          )}
          <div data-tour="quest" className={quest && dueCount > 0 ? "hidden sm:block" : undefined}>
            <TodaysQuestCard quest={quest} />
          </div>

          <InstallBanner streakDays={streakDays} />

          {/* spaced-repetition review */}
          {dueCount > 0 && (
            <Link
              href="/review"
              className={`flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2 border border-sky-line bg-[var(--tint-sky)] rounded-[14px] px-5 py-4 mb-4 transition-all hover:-translate-y-0.5 group ${
                quest ? "hidden sm:flex" : ""
              }`}
            >
              <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-sky-line flex items-center justify-center text-[22px] transition-transform group-hover:scale-110">
                💧
              </span>
              <span className="flex-1 min-w-0">
                <b className="block font-bold text-[18px] text-sky-deep truncate">{t("review.title")}</b>
              </span>
              <span className="w-full sm:w-auto pl-[54px] sm:pl-0 text-[13px] font-semibold text-sky-deep transition-transform group-hover:translate-x-0.5">
                {t("review.now")}
              </span>
            </Link>
          )}

          {/* The daily quest used to be a third card here ("Start today" on the
              Continue card, this slip, and the rail widget all pointed at the
              same skill). It now lives inside the Continue card. */}

          {/* today's slang + word of the day — both live on the rail at xl+.
              Below that they're inlined into the main column; on mobile
              specifically they're paired side-by-side (like the quest/review
              pair above) instead of stacking as two more full-width rows. */}
          {wotd && (
            <div className="grid grid-cols-2 gap-3 mb-[30px] sm:hidden">
              <Link
                href="/slang"
                className="group flex flex-col items-center text-center gap-1.5 rounded-[16px] border border-[var(--tint-pink-line)] bg-[var(--tint-pink)] px-3 py-3.5 h-full transition-all hover:-translate-y-0.5"
              >
                <span className="flex-none w-9 h-9 rounded-[10px] bg-cream border border-[var(--tint-pink-line)] flex items-center justify-center text-[17px]">
                  💬
                </span>
                <b className="block text-[15px] font-bold text-[#AF3166] leading-tight">{t("slang.title")}</b>
              </Link>
              <Link
                href="/vocabulary"
                className="group flex flex-col items-center text-center gap-1.5 rounded-[16px] border border-line bg-cream px-3 py-3.5 h-full transition-all hover:-translate-y-0.5"
              >
                <span className="flex-none w-9 h-9 rounded-[10px] bg-warm border border-line flex items-center justify-center text-[15px] font-semibold text-success-deep uppercase">
                  W
                </span>
                <b className="block text-[15px] font-bold text-charcoal leading-tight">{t("wotd.title")}</b>
              </Link>
            </div>
          )}

          <Link
            href="/slang"
            className={`xl:hidden flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2 border border-[var(--tint-pink-line)] bg-[var(--tint-pink)] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group ${
              wotd ? "hidden sm:flex" : ""
            }`}
          >
            <span className="flex-none w-10 h-10 rounded-[10px] bg-cream border border-[var(--tint-pink-line)] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
              💬
            </span>
            <span className="flex-1 min-w-0">
              <b className="block font-semibold text-sm text-[#AF3166]">
                {t("slang.title")} · <span className="kr">{slang.kr}</span>{" "}
                <span className="font-medium text-[#C13E78] whitespace-nowrap">({slang.romanization})</span>
              </b>
              <span className="text-[13px] text-[#97687D]">{slang.meaning}</span>
            </span>
            <span className="w-full sm:w-auto pl-[54px] sm:pl-0 text-[13px] font-semibold text-[#C13E78] transition-transform group-hover:translate-x-0.5">
              {t("slang.hear")}
            </span>
          </Link>

          {/* word of the day — rail card on xl+, inline here below that so
              phones and tablets get the same daily word a desktop does. */}
          {wotd && <WordOfDayCard wotd={wotd} className="hidden sm:block xl:hidden" />}

          {/* new to Korean? — only for true beginners */}
          {cefr === "A1" && (
          <Link
            href="/hangul"
            className="flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2 border border-success-line bg-success-bg rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
          >
            <span className="flex-none w-10 h-10 rounded-[10px] bg-cream border border-success-line flex items-center justify-center kr text-lg text-success transition-transform group-hover:scale-110">
              ㄱ
            </span>
            <span className="flex-1 min-w-0">
              <b className="block font-semibold text-sm text-success-deep">{t("hangul.title")}</b>
              <span className="text-[13px] text-success-deep">
                {t("hangul.sub")}
              </span>
            </span>
            <span className="w-full sm:w-auto pl-[54px] sm:pl-0 text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
              {t("hangul.cta")}
            </span>
          </Link>
          )}

          {/* Learning progress moved to My account (/profile) 2026-08-30 — the
              Garden answers "what do I do today", the account page "how am I
              doing". skillProgress below stays: it feeds progressSessions. */}

          {/* study garden — the year grass, moved in from My growth; its
              pills absorb the old This week / month challenge widgets */}
          <div data-tour="garden">
            <MonthlyGrass
              minutesByDate={minutesByDate}
              headline={[
                { label: t("garden.thisWeek"), value: `${weekTotal}m` },
                { label: t("garden.total"), value: totalMinutes >= 90 ? `${Math.round(totalMinutes / 6) / 10}h` : `${totalMinutes}m` },
                { label: t("garden.bestStreak"), value: `${longestStreak}d` },
                { label: t("garden.monthGoal", { month: monthShort }), value: `${monthDone}/${MONTH_GOAL}` },
              ]}
            />
          </div>
        </main>

        <Widgets
          wotd={wotd}
          slang={{ kr: slang.kr, romanization: slang.romanization, meaning: slang.meaning }}
        />
      </div>

      <BottomNav />
      <FeedbackWidget />
    </div>
  );
}

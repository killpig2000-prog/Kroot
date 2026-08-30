import { cookies } from "next/headers";
import { Link, redirect } from "@/i18n/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import SkillBar from "@/components/dashboard/SkillBar";
import Widgets from "@/components/dashboard/Widgets";
import WordOfDayCard from "@/components/dashboard/WordOfDayCard";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import Greeting from "@/components/dashboard/Greeting";
import ContinueCard from "@/components/dashboard/ContinueCard";
import LevelMap from "@/components/dashboard/LevelMap";
import { FirstVisitPlan, LockedWidgets, type FirstVisitStep } from "@/components/dashboard/FirstVisitPlan";
import InstallBanner from "@/components/pwa/InstallBanner";
import { GRAMMAR_LESSONS } from "@/lib/grammar";
import type { ResumeRow } from "@/lib/resume";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import MonthlyGrass from "@/components/profile/MonthlyGrass";
import { computeEligibility } from "@/lib/promotion-server";
import { ELIGIBILITY, testForGrade } from "@/lib/promotion-test";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getPassagesForLevel } from "@/lib/reading";
import { getPromptsForLevel } from "@/lib/writing";
import { chapterClearStats, NAILED_THRESHOLD } from "@/lib/pronunciation";
import { CHAPTER_SIZE, getWordsForTopic } from "@/lib/vocabulary";
import { firstVisitState, NEW_ACCOUNT_DAYS, SHOW_ALL_COOKIE } from "@/lib/first-visit";
import { countCompletedSessions } from "@/lib/first-visit-server";
import { slangOfTheDay } from "@/lib/slang";
import type { CefrLevel } from "@/lib/tree";

// The old Basics/Practice/Relax card list duplicated the sidebar; only the
// four practice skills keep an in-page presence, as compact progress rows.
const PRACTICE_SKILLS = [
  { key: "grammar", href: "/grammar", kr: "문", en: "Grammar", bg: "#EEF2FF", color: "#423AC5" },
  { key: "vocabulary", href: "/vocabulary", kr: "단", en: "Vocabulary", bg: "#F5F3FF", color: "#6B33CC" },
  { key: "listening", href: "/listening", kr: "듣", en: "Listening", bg: "#F0FDF4", color: "#3E7C59" },
  { key: "reading", href: "/reading", kr: "읽", en: "Reading", bg: "#EFF6FF", color: "#3363CC" },
  { key: "writing", href: "/writing", kr: "쓰", en: "Writing", bg: "#FFFBEB", color: "#C47A25" },
  { key: "pronunciation", href: "/speaking", kr: "발", en: "Pronunciation", bg: "#F0FDFA", color: "#228980" },
];

const MONTH_GOAL = 20;

// One quest per day, rotating through the four practice skills.
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const today = todayISO();

  // Date windows computed up front so every query can run in one parallel
  // batch — from Korea to us-east-1 each round trip is ~300ms, so sequential
  // awaits were the whole reason this page felt slow.
  const now = new Date();
  const week = weekDates(now);
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1));

  const [
    { data: profile },
    { data: streakValue, error: streakError },
    { data: costumeRows },
    questRes,
    { data: listeningRows },
    { data: readingRows },
    { data: writingRows },
    { data: speakingRows },
    dueRes,
    { data: activity },
    levelTestRes,
    resumeRes,
    { data: grammarRows },
    { data: vocabRows },
    // Columns from migration 0035 — queried separately so a not-yet-applied
    // migration degrades to defaults instead of nulling the whole profile.
    extrasRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, xp, streak_days, last_active_date, avatar_url, created_at")
      .eq("id", user.id)
      .single(),
    // touch_streak bumps (or resets) the streak server-side and returns its new value.
    supabase.rpc("touch_streak"),
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
    supabase
      .from("daily_quests")
      .select("id, skill_key, title, description, completed_at")
      .eq("user_id", user.id)
      .eq("quest_date", today)
      .maybeSingle(),
    supabase.from("listening_progress").select("dialogue_id").eq("user_id", user.id).not("completed_at", "is", null),
    supabase.from("reading_progress").select("passage_key").eq("user_id", user.id),
    supabase.from("writing_progress").select("prompt_key").eq("user_id", user.id),
    supabase.from("speaking_progress").select("prompt_key, best_score").eq("user_id", user.id),
    supabase
      .from("vocabulary_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString()),
    // Full history: the year grass + lifetime totals need every study day.
    supabase
      .from("daily_activity")
      .select("activity_date, minutes")
      .eq("user_id", user.id),
    supabase
      .from("level_test_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("resume_points").select("skill, href, label, detail, progress, updated_at").eq("user_id", user.id).maybeSingle(),
    supabase.from("grammar_progress").select("lesson_key").eq("user_id", user.id),
    supabase.from("vocabulary_progress").select("word_key").eq("user_id", user.id),
    supabase.from("profiles").select("streak_freezes, reminder_push, reminder_email").eq("id", user.id).maybeSingle(),
  ]);
  const extras = extrasRes.error ? null : extrasRes.data;

  // Confirmed-email signups land here without ever picking a starting level
  // (the confirmation link used to skip onboarding). Send them back; a query
  // error must not lock anyone out of the dashboard.
  if (!levelTestRes.error && (levelTestRes.count ?? 0) === 0) redirect("/onboarding");

  const streakDays = streakError ? profile?.streak_days ?? 0 : (streakValue as number) ?? 0;
  const equippedIds = (costumeRows ?? []).filter((r) => r.equipped).map((r) => r.costume_id);

  let quest = questRes.data;
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

  // First-visit dashboard: accounts under a week old with fewer than three
  // finished sessions see one plan card instead of the full Garden. Only they
  // pay for the analytics count; everyone else skips it.
  const cookieStore = await cookies();
  const showAll = cookieStore.get(SHOW_ALL_COOKIE)?.value === "1";
  const accountAgeDays = profile?.created_at ? (now.getTime() - Date.parse(profile.created_at)) / 86_400_000 : Infinity;
  const maybeNew = !showAll && accountAgeDays < NEW_ACCOUNT_DAYS;

  // Promotion eligibility runs after the main batch (it needs the grade);
  // internally it fans out its own queries in parallel.
  const [elig, analyticsSessions] = await Promise.all([
    computeEligibility(supabase, user.id, cefr),
    maybeNew ? countCompletedSessions(user.id) : Promise.resolve(null),
  ]);
  const promo = testForGrade(cefr);
  const promoChecks = [
    { label: "Words held", ok: elig.wordsMastered >= elig.wordsRequired, value: `${elig.wordsMastered}/${elig.wordsRequired}` },
    { label: "Reading", ok: elig.readingDone >= elig.readingRequired, value: `${elig.readingDone}/${elig.readingRequired}` },
  ];
  // Errors (e.g. migration 0022 not applied yet) just hide the review card.
  const dueCount = dueRes.error ? 0 : dueRes.count ?? 0;

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
      const nailedIds = new Set(
        (speakingRows ?? []).filter((r) => (r.best_score ?? 0) >= NAILED_THRESHOLD).map((r) => r.prompt_key)
      );
      const { done, total } = chapterClearStats(nailedIds);
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
  const monthShort = now.toLocaleDateString("en-US", { month: "short" });

  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);

  // "Continue" target: the last unit the learner opened (resume_points), or
  // today's quest when nothing is in progress. A finished unit clears itself.
  const resume: ResumeRow | null = resumeRes.error ? null : ((resumeRes.data as ResumeRow | null) ?? null);
  const questHref: Record<string, string> = {
    writing: "/writing",
    vocabulary: dueCount > 0 ? "/review" : "/vocabulary",
    listening: "/listening",
    reading: "/reading",
    pronunciation: "/speaking",
  };
  const questSkill = quest?.skill_key ?? questOfTheDay.skill_key;
  const questParts = (quest?.description ?? questOfTheDay.description).split(" · ");
  const continueFallback = {
    href: questHref[questSkill] ?? "/listening",
    label: questParts[0],
    detail: `Today's quest · ${questParts.slice(1).join(" · ")}`,
    icon: "🎯",
  };
  const overallPct = Math.round(
    Object.values(skillProgress).reduce((sum, p) => sum + p.percent, 0) / Object.keys(skillProgress).length
  );
  const remindersOff = !extras?.reminder_push && !extras?.reminder_email;


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
            { label: "Hangul", detail: "Consonants", time: "2 min", href: "/hangul" },
            { label: "Vocab", detail: "Unit 1 (10 words)", time: "3 min", href: vocabUnit1 },
            { label: "Review your seedling 💧", time: "10 s" },
          ]
        : [
            { label: "Vocab", detail: `Unit 1 (10 words) · ${cefr}`, time: "3 min", href: vocabUnit1 },
            { label: "Listening", detail: "one short dialogue", time: "2 min", href: "/listening" },
            { label: "Review your seedling 💧", time: "10 s" },
          ];

    return (
      <div className="min-h-screen bg-warm text-charcoal">
        <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
          <Sidebar
            displayName={displayName}
            email={user.email ?? ""}
            streakDays={streakDays}
            avatarUrl={profile?.avatar_url}
            streakFreezes={extras?.streak_freezes ?? 0}
          />

          <main className="min-w-0 max-w-[820px] px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
            <h1 className="font-semibold text-[clamp(20px,2.4vw,24px)] tracking-[-0.02em] mb-0.5">
              Welcome, {displayName}
            </h1>
            <p className="text-muted text-sm mb-6">Day {firstVisit.day}</p>

            <TreeCard
              level={level}
              progressPct={pct}
              xpInto={into}
              xpNeeded={needed}
              costumeIds={equippedIds}
              species={cefr}
            />

            <FirstVisitPlan steps={steps} />

            {/* unlocked so far, in unlock order */}
            {firstVisit.unlocked.quest && (
              <ContinueCard resume={resume} fallback={continueFallback} />
            )}

            {firstVisit.unlocked.wotd && wotd && <WordOfDayCard wotd={wotd} />}

            {firstVisit.unlocked.levelMap && promo && (
              <LevelMap current={cefr} checks={promoChecks} eligible={elig.eligible} overallPct={overallPct} />
            )}

            {firstVisit.unlocked.heatmap && (
              <div className="mb-[30px]">
                <MonthlyGrass
                  minutesByDate={minutesByDate}
                  headline={[
                    { label: "this week", value: `${weekTotal}m` },
                    { label: "best streak", value: `${longestStreak}d` },
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
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
          streakFreezes={extras?.streak_freezes ?? 0}
        />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
          <Greeting name={displayName} />

          <TreeCard
            level={level}
            progressPct={pct}
            xpInto={into}
            xpNeeded={needed}
            costumeIds={equippedIds}
            species={cefr}
          />

          {/* the one button: pick up where you left off. No resume in
              progress ⇒ this would just re-show today's quest, which already
              has its own widget in the sidebar, so it's skipped entirely and
              the due-review banner below becomes the top recommendation. */}
          {resume && <ContinueCard resume={resume} fallback={continueFallback} />}

          <InstallBanner streakDays={streakDays} />

          {/* spaced-repetition review */}
          {dueCount > 0 && (
            <Link
              href="/review"
              className="flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2 border border-sky-line bg-[var(--tint-sky)] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-cream border border-sky-line flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                💧
              </span>
              <span className="flex-1 min-w-0">
                <b className="block font-semibold text-sm text-sky-deep">
                  {dueCount} {dueCount === 1 ? "word is" : "words are"} due for review
                </b>
              </span>
              <span className="w-full sm:w-auto pl-[54px] sm:pl-0 text-[13px] font-semibold text-sky-deep transition-transform group-hover:translate-x-0.5">
                Review now →
              </span>
            </Link>
          )}

          {/* The daily quest used to be a third card here ("Start today" on the
              Continue card, this slip, and the rail widget all pointed at the
              same skill). It now lives inside the Continue card. */}

          {/* today's slang — a daily reason to peek at Street Talk (rail on xl+).
              Below sm the CTA drops under the text so it never splits in two. */}
          <Link
            href="/slang"
            className="xl:hidden flex flex-wrap sm:flex-nowrap items-center gap-x-3.5 gap-y-2 border border-[var(--tint-pink-line)] bg-[var(--tint-pink)] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
          >
            <span className="flex-none w-10 h-10 rounded-[10px] bg-cream border border-[var(--tint-pink-line)] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
              💬
            </span>
            <span className="flex-1 min-w-0">
              <b className="block font-semibold text-sm text-[#AF3166]">
                Today&apos;s slang · <span className="kr">{slang.kr}</span>{" "}
                <span className="font-medium text-[#C13E78] whitespace-nowrap">({slang.romanization})</span>
              </b>
              <span className="text-[13px] text-[#97687D]">{slang.meaning}</span>
            </span>
            <span className="w-full sm:w-auto pl-[54px] sm:pl-0 text-[13px] font-semibold text-[#C13E78] transition-transform group-hover:translate-x-0.5">
              Hear it in context →
            </span>
          </Link>

          {/* word of the day — rail card on xl+, inline here below that so
              phones and tablets get the same daily word a desktop does. */}
          {wotd && <WordOfDayCard wotd={wotd} className="xl:hidden" />}

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
              <b className="block font-semibold text-sm text-success-deep">Completely new to Korean?</b>
              <span className="text-[13px] text-success-deep">
                Learn the alphabet first — 40 letters, one hour, free forever.
              </span>
            </span>
            <span className="w-full sm:w-auto pl-[54px] sm:pl-0 text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
              Start here →
            </span>
          </Link>
          )}

          {/* curriculum map: A1 → C2 stepper + level-up checks */}
          {promo && (
            <LevelMap current={cefr} checks={promoChecks} eligible={elig.eligible} overallPct={overallPct} />
          )}

          {/* streak at risk & no reminders yet → one-line nudge to /profile */}
          {remindersOff && streakDays >= 3 && (
            <Link
              href="/profile#reminders"
              className="flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-1.5 border border-dashed border-dash rounded-[12px] bg-cream px-4 py-3 mb-[14px] text-[13px] text-muted hover:border-success transition-colors"
            >
              <span>⏰</span>
              <span className="flex-1 min-w-0">
                <b className="text-charcoal font-semibold">Protect your {streakDays}-day streak</b> — get one gentle reminder on days you haven&apos;t studied.
              </span>
              <span className="w-full sm:w-auto pl-[28px] sm:pl-0 font-semibold text-success">Turn on →</span>
            </Link>
          )}

          {/* learning progress — replaces the old category card list (the
              sidebar already covers navigation); SkillBars live on here */}
          <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5 mb-[14px]">
            <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
              <b className="font-semibold text-[15px]">📈 Learning progress</b>
              <small className="text-[12.5px] text-faint font-medium">{cefr} difficulty</small>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {PRACTICE_SKILLS.map((c) => {
                const done = quest?.skill_key === c.key && !!quest?.completed_at;
                const prog = skillProgress[c.key];
                return (
                  <Link key={c.key} href={c.href} className="flex items-center gap-3 group">
                    <span
                      className="w-[30px] h-[30px] rounded-lg flex-none flex items-center justify-center kr text-[13px] transition-transform group-hover:scale-110"
                      style={{ background: c.bg, color: c.color }}
                    >
                      {c.kr}
                    </span>
                    <span className="flex-1 min-w-0">
                      <b className="font-semibold text-[13px] flex items-center gap-2">
                        {c.en}
                        {done && (
                          <span className="text-[10.5px] font-semibold text-success bg-success-bg border border-success-line rounded-md px-1.5 py-px">
                            +10 XP
                          </span>
                        )}
                      </b>
                      <SkillBar
                        percent={prog.percent}
                        note={`${prog.done}/${prog.total}${c.key === "pronunciation" ? "" : ` · ${cefr}`}`}
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* study garden — the year grass, moved in from My growth; its
              pills absorb the old This week / month challenge widgets */}
          <MonthlyGrass
            minutesByDate={minutesByDate}
            headline={[
              { label: "this week", value: `${weekTotal}m` },
              { label: "total", value: totalMinutes >= 90 ? `${Math.round(totalMinutes / 6) / 10}h` : `${totalMinutes}m` },
              { label: "best streak", value: `${longestStreak}d` },
              { label: `${monthShort} goal`, value: `${monthDone}/${MONTH_GOAL}` },
            ]}
          />
        </main>

        <Widgets
          wotd={wotd}
          quest={quest}
          slang={{ kr: slang.kr, romanization: slang.romanization, meaning: slang.meaning }}
        />
      </div>

      <BottomNav />
      <FeedbackWidget />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Widgets from "@/components/dashboard/Widgets";
import FeedbackWidget, { FeedbackButton } from "@/components/dashboard/FeedbackWidget";
import TodaysQuestCard from "@/components/dashboard/TodaysQuestCard";
import InstallBanner from "@/components/pwa/InstallBanner";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import TutorialFinishBanner from "@/components/onboarding/TutorialFinishBanner";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { GRAMMAR_LESSONS } from "@/lib/grammar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import { iso } from "@/lib/study-garden";
import { ELIGIBILITY } from "@/lib/promotion-test";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getPassagesForLevel, getChaptersForLevel as getReadingChapters } from "@/lib/reading";
import { getPromptsForLevel, getChaptersForLevel as getWritingChapters } from "@/lib/writing";
import { hashString } from "@/lib/writing-builder";
import { chapterClearStats } from "@/lib/pronunciation";
import { dailyReviewCap } from "@/lib/srs";
import { getWordsForTopic } from "@/lib/vocabulary-words";
import { slangOfTheDay } from "@/lib/slang";
import type { CefrLevel } from "@/lib/tree";

// One quest per day, alternating Reading and Writing only — the two skills
// with a real chapter pool per level to pull a specific one from (vocabulary
// review, a listening dialogue, and a pronunciation chapter don't have that
// same "whole level's pool, one random item" shape). `description` is what
// gets stored on the daily_quests row (a locale-free fallback); TodaysQuestCard
// renders the localized copy from skill_key.
const QUEST_ROTATION = [
  { skill_key: "writing", title: "Today's quest", description: "Writing · one chapter, a few questions · ~8 min" },
  { skill_key: "reading", title: "Today's quest", description: "Reading · one short passage · ~4 min" },
];

function todayISO() {
  return iso(new Date());
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
  const t = await getTranslations("dashboard");
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const today = todayISO();

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
  // snapshot.activity is still returned by the RPC; My progress reads its own copy now
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

  // Today's quest deep-links straight into one specific chapter — a random
  // pull from the learner's whole level pool, not "go pick your own" — so
  // finishing the quest is exactly one tap plus the activity itself. Seeded
  // by date + user + level + skill: stable for this learner all day (a
  // reload doesn't reshuffle it), but different learners at the same level
  // get different chapters, not one shared pick for everyone. Reading's
  // chapters are already one passage each; writing's are the normal
  // 3-question chapter — deliberately NOT a single prompt, since the
  // per-chapter coin/XP reward is keyed by (level, chapterIndex) and a
  // random index reused outside the learner's real progression would risk
  // double-paying or skipping pay entirely if that scheme ever changed to
  // key by prompt instead.
  const questChapters = quest?.skill_key === "reading" ? getReadingChapters(cefr) : getWritingChapters(cefr);
  const questChapterIdx = questChapters.length
    ? hashString(`${today}:${user.id}:${cefr}:${quest?.skill_key}`) % questChapters.length
    : 0;
  const questHref = quest && questChapters.length ? `/${quest.skill_key}/session?level=${cefr}&chapter=${questChapterIdx}` : undefined;

  // "Your path" (promotion eligibility + LevelMap) moved to My progress
  // (/profile) 2026-09-03 — the Garden is a "what do I do today" page, and a
  // once-eligible learner had no way to stop it nagging them here every visit.
  const todayStartIso = `${today}T00:00:00.000Z`;
  const [coinsRes, { count: reviewedTodayCount }] = await Promise.all([
    // coins isn't in the snapshot RPC's profile row; a parallel read here
    // beats a function migration for one integer (see 0041's rationale).
    // review_capacity_bonus and is_admin ride along for the same reason —
    // is_admin drives the guided-tour repeat-testing bypass below.
    supabase
      .from("profiles")
      .select("coins, review_capacity_bonus, is_admin, onboarding_tour_seen")
      .eq("id", user.id)
      .maybeSingle(),
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
  // Server fact, not just a browser one — see OnboardingTour's own comment
  // for why a localStorage-only flag wasn't enough (private browsing, a
  // second device, cleared site data all used to bring the tour back).
  const tourSeen = coinsRes.error ? false : coinsRes.data?.onboarding_tour_seen ?? false;
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

  // The word of the day is gone from the dashboard (2026-09-07) and the year
  // grass moved to My progress — the phone home is one screen: the garden,
  // today's quest, the review when words are due, and one slang line.
  const slang = slangOfTheDay();

  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);

  // "Continue" target: the last unit the learner opened (resume_points), or
  // today's quest when nothing is in progress. A finished unit clears itself.

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

        {/* phone bottom padding = BottomNav (64px) + a little; the page is
            meant to fit one screen there, so no more slack than that */}
        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[76px] md:pb-[60px]">
          <OnboardingTour startsGuidedTour guidedTrack={guidedTrack} isAdmin={isAdmin} userId={user.id} serverSeen={tourSeen} />
          <GuidedStep step="hangul-nav" />
          <GuidedStep step="writing-nav" />
          <TutorialFinishBanner />
          {/* the greeting moved into the tree's speech bubble (TreeCard) */}

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

          {/* today's quest — the one big button. Resuming a specific
              in-progress session was removed (product decision: one clear
              "what to do today" beats a resume shortcut). */}
          <div data-tour="quest">
            <TodaysQuestCard quest={quest} href={questHref} />
          </div>

          <InstallBanner streakDays={streakDays} />

          {/* spaced-repetition review — one slim row, only when words are
              due, so a new learner's home has nothing to scroll past */}
          {dueCount > 0 && (
            <Link
              href="/review"
              className="flex items-center gap-3 border border-line bg-cream rounded-[14px] px-4 py-2.5 mb-3 transition-all hover:-translate-y-0.5 hover:border-success group"
            >
              <span className="flex-none text-[18px] transition-transform group-hover:scale-110">💧</span>
              <b className="flex-1 min-w-0 truncate text-[14px] font-bold text-charcoal">{t("review.due", { count: dueCount })}</b>
              <span className="flex-none text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
                {t("review.short")}
              </span>
            </Link>
          )}

          {/* today's slang — one line here below xl, a rail note at xl+ */}
          <Link
            href="/slang"
            className="xl:hidden flex items-center gap-3 border border-line bg-cream rounded-[14px] px-4 py-2.5 mb-3 transition-all hover:-translate-y-0.5 hover:border-success group"
          >
            <span className="flex-none text-[18px] transition-transform group-hover:scale-110">💬</span>
            <span className="flex-1 min-w-0 truncate text-[14px]">
              {/* the Korean word is the only coloured thing on this row — one
                  rose accent on a cream card, same weight as the green Go */}
              <b className="font-bold text-[var(--tint-pink-ink)]">
                <span className="kr">{slang.kr}</span>{" "}
                <span className="font-medium text-muted">({slang.romanization})</span>
              </b>
              <span className="text-[13px] text-muted"> · {slang.meaning}</span>
            </span>
            <span className="flex-none text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
              {t("slang.short")}
            </span>
          </Link>

          {/* new to Korean? — A1 alone isn't "just starting": a long-time A1
              learner (or the admin account, parked at A1 on purpose) placed
              there too, and hangul practice itself earns no XP either way —
              so the real signal is "hasn't earned any XP yet", not the CEFR
              tier by itself. */}
          {cefr === "A1" && (profile?.xp ?? 0) === 0 && (
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
              doing". */}

          {/* The year grass (Study garden) moved to My progress 2026-09-07 —
              the phone home is one screen now. Its footer used to park the
              phone-only feedback button; that button sits here instead. */}
          <div className="flex justify-end pt-1 md:hidden">
            <FeedbackButton />
          </div>
        </main>

        <Widgets slang={{ kr: slang.kr, romanization: slang.romanization, meaning: slang.meaning }} />
      </div>

      <BottomNav />
      <FeedbackWidget />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import TreeBand from "@/components/dashboard/TreeBand";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Widgets from "@/components/dashboard/Widgets";
import FeedbackWidget, { FeedbackButton } from "@/components/dashboard/FeedbackWidget";
import TodaysQuestCard from "@/components/dashboard/TodaysQuestCard";
import { MODULES } from "@/components/dashboard/navItems";
import ModuleIcon from "@/components/dashboard/ModuleIcon";
import InstallBanner from "@/components/pwa/InstallBanner";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import TutorialFinishBanner from "@/components/onboarding/TutorialFinishBanner";
import GuidedStep from "@/components/onboarding/GuidedStep";
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
  const tn = await getTranslations("nav");
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
  // A1 placements tour Vocabulary (the card now carries Hangul); anyone who
  // placed higher gets the Writing walkthrough instead.
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
  // The card is the page's one big button, so it never disappears: if the
  // daily row couldn't be created (RPC/insert failure) it points at the
  // vocabulary review instead of leaving a hole (user: "없으면 밋밋하려나").
  const questForCard = quest ?? { skill_key: "vocabulary", description: "Review · your due words · ~5 min", completed_at: null };

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
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,17%,280px)_minmax(0,1fr)_clamp(260px,22%,340px)] w-full min-h-screen content-start xl:content-stretch">
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
        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[76px] xl:pb-[60px]">
          <OnboardingTour startsGuidedTour guidedTrack={guidedTrack} isAdmin={isAdmin} userId={user.id} serverSeen={tourSeen} />
          <GuidedStep step="hangul-nav-vocab" />
          <GuidedStep step="writing-nav" />
          <TutorialFinishBanner />

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

          {/* Phone and tablet (below xl): the tree is one line here — the
              full garden moved to My room (2026-09-07 restructure); tap the
              band to get there. */}
          <div className="xl:hidden">
            <TreeBand
              level={level}
              progressPct={pct}
              costumeIds={equippedIds}
              species={cefr}
              streakDays={streakDays}
              coins={coins}
            />
          </div>

          {/* Desktop (xl+): the full garden hero is back on the Garden page
              itself instead of tucked one tap away in My room — 2026-09-08,
              user call: a real desktop screen has the room for the tree,
              greeting bubble and growth stages the sidebar's module list
              already frees up. Same component My room's hero uses; not
              wired to the shop tap-through since Shop already has its own
              sidebar row up here. */}
          <div className="hidden xl:block mb-3">
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
            />
          </div>

          {/* today's quest — the one big button. Resuming a specific
              in-progress session was removed (product decision: one clear
              "what to do today" beats a resume shortcut). */}
          <div data-tour="quest">
            <TodaysQuestCard quest={questForCard} href={quest ? questHref : "/vocabulary"} />
          </div>

          {/* the six doors. Two columns × three rows on phones (portrait —
              user call 2026-09-07), three across from sm up. Vocabulary
              carries Hangul (trace-to-write on the card), Writing carries
              Grammar (particle blanks); the rest are the same four rooms. */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-[9px] mb-3">
            {MODULES.map((m) => {
              const key = m.href === "/speaking" ? "pronunciation" : m.href.slice(1);
              const p = skillProgress[key];
              return (
                <Link
                  key={m.href}
                  href={m.href}
                  data-tour={m.tourId}
                  className="group relative overflow-hidden flex flex-col items-center justify-center gap-[7px] min-h-[86px] rounded-[20px] xl:rounded-[17px] border border-line bg-cream px-[6px] py-[13px] text-center transition-all hover:-translate-y-0.5 hover:border-success"
                >
                  {/* drawn icons below xl, the sidebar's emoji at xl+ */}
                  <span className="xl:hidden text-success-deep transition-transform group-hover:scale-110">
                    <ModuleIcon href={m.href} />
                  </span>
                  <span className="hidden xl:block text-[25px] leading-none" aria-hidden="true">
                    {m.icon}
                  </span>
                  <span className="text-[14.5px] font-bold text-charcoal leading-tight">{tn(m.label.toLowerCase())}</span>
                  {/* the per-module progress the page already computes — it was
                      being calculated and thrown away. A hairline, not a
                      number: the tile stays a door, not a report. */}
                  {p && p.done > 0 && (
                    <span
                      className="xl:hidden block h-[3px] w-[34px] rounded-full bg-line overflow-hidden"
                      aria-hidden="true"
                    >
                      <i
                        className="not-italic block h-full rounded-full bg-success"
                        style={{ width: `${Math.max(8, p.percent)}%` }}
                      />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <InstallBanner streakDays={streakDays} />

          {/* spaced-repetition review — one slim row, only when words are
              due, so a new learner's home has nothing to scroll past */}
          {dueCount > 0 && (
            <Link
              href="/review"
              className="group flex items-center gap-3 border-0 border-t border-line bg-transparent px-[4px] py-[13px] mb-0 transition-all xl:mb-3 xl:gap-[13px] xl:border xl:rounded-[19px] xl:bg-cream xl:px-[16px] xl:hover:-translate-y-0.5 xl:hover:border-success"
            >
              <span className="flex-none text-[20px] transition-transform group-hover:scale-110">💧</span>
              <b className="flex-1 min-w-0 truncate text-[15px] xl:text-[16px] font-bold text-charcoal">{t("review.due", { count: dueCount })}</b>
              <span className="flex-none text-[15px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
                {t("review.short")}
              </span>
            </Link>
          )}

          {/* today's slang — one line here below xl, a rail note at xl+.
              Moved back out of /vocabulary 2026-09-08 (user call): the
              Garden is where the day's one-bite Korean belongs. Garden
              tokens, not the old pink literals the palette pass retired. */}
          <Link
            href="/slang"
            className="xl:hidden group flex items-center gap-3 border-0 border-t border-line px-[4px] py-[13px] mb-0 transition-all"
          >
            <span className="flex-none text-[18px] transition-transform group-hover:scale-110">💬</span>
            <span className="flex-1 min-w-0 truncate text-[14px]">
              <b className="font-bold text-charcoal">
                <span className="kr">{slang.kr}</span>{" "}
                <span className="font-medium text-muted">({slang.romanization})</span>
              </b>
              <span className="text-[13px] text-muted"> · {slang.meaning}</span>
            </span>
            <span className="flex-none text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
              {t("slang.short")}
            </span>
          </Link>

          {/* Learning progress moved to My account (/profile) 2026-08-30 — the
              Garden answers "what do I do today", the account page "how am I
              doing". */}

          {/* The year grass (Study garden) moved to My progress 2026-09-07 —
              the phone home is one screen now. Its footer used to park the
              phone-only feedback button; that button sits here instead. */}
          <div className="flex justify-end pt-1 xl:hidden">
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

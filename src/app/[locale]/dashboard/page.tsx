import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Widgets from "@/components/dashboard/Widgets";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import TodaysQuestCard from "@/components/dashboard/TodaysQuestCard";
import GardenHeader from "@/components/dashboard/GardenHeader";
import GardenCard from "@/components/dashboard/GardenCard";
import TodaysQuestButton from "@/components/dashboard/TodaysQuestButton";
import { MODULES } from "@/components/dashboard/navItems";
import ModuleIcon from "@/components/dashboard/ModuleIcon";
import Glyph from "@/components/dashboard/Glyph";
import InstallBanner from "@/components/pwa/InstallBanner";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import TutorialFinishBanner from "@/components/onboarding/TutorialFinishBanner";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import { iso } from "@/lib/study-garden";
import { getChaptersForLevel as getReadingChapters } from "@/lib/reading";
import { getChaptersForLevel as getWritingChapters } from "@/lib/writing";
import { hashString } from "@/lib/writing-builder";
import { dailyReviewCap } from "@/lib/srs";
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
  // snapshot.listening/reading/writing/speaking/vocab_keys/activity are still
  // returned by the RPC; nothing on this page reads them any more (the door
  // gauges that did are gone — see the doors below). My progress has its own.

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

  // No per-door progress any more (2026-09-10, user call). The number this
  // page used to compute for each door was six different things: Hangul was
  // "of 40 jamo" and Pronunciation "of 23 chapters" — both finite, so a
  // learner filled them for good within days and the doors sat at 100%
  // forever — while Vocabulary, Writing, Reading and Listening were "of a
  // 20-item slice of the *current* level's pool", which reset to zero on
  // every promotion. Neither is progress, and six empty cards each morning
  // is six nudges on a page that promised none. The tree and My progress
  // answer "how far have I come"; a door is a door.

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
            coins={coins}
          />
        </div>

        {/* phone bottom padding = BottomNav (64px) + a little; the page is
            meant to fit one screen there, so no more slack than that */}
        <main className="min-w-0 px-[20px] xl:px-[clamp(18px,3vw,36px)] pt-[24px] pb-[76px] xl:pb-[60px]">
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
              className="mb-5 rounded-[12px] border border-amber-line bg-[var(--tint-amber)] px-4 py-3 text-sm text-charcoal"
            >
              {t("loadError")}
            </div>
          )}

          {/* Phone and tablet (below xl): the greeting and the two numbers,
              then the tree standing in an inset garden card — option 2a of
              the 2026-09-09 handoff. TreeBand's cream one-liner is gone; the
              card is still one tap to My room, where the full garden (avatar,
              growth stages, keepsakes) lives. */}
          <div className="xl:hidden">
            <GardenHeader displayName={displayName} />
            <GardenCard
              level={level}
              progressPct={pct}
              xpInto={into}
              xpNeeded={needed}
              costumeIds={equippedIds}
              species={cefr}
              celebrateKey={quest?.completed_at ? quest.id : null}
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
          {/* One wrapper carries the tour target so it measures whichever of
              the two is actually on screen. */}
          <div data-tour="quest">
            <div className="xl:hidden">
              <TodaysQuestButton quest={questForCard} href={quest ? questHref : "/vocabulary"} />
            </div>
            <div className="hidden xl:block">
              <TodaysQuestCard quest={questForCard} href={quest ? questHref : "/vocabulary"} />
            </div>
          </div>

          {/* the six doors, below xl: 3 × 2, one drawn icon and one word
              each. Line-tone buttons in Button.tsx's sense — the 2px edge
              they sit on and the 2px drop when pressed — because a door is
              pressed, and a bordered box that doesn't move under the thumb
              was the one thing on this page still missing the 2026-09-09
              press feel. 12px corners like the rest of the app (372 uses). */}
          <div className="grid grid-cols-3 gap-[10px] mb-3 xl:hidden">
            {MODULES.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                data-tour={m.tourId}
                className="group flex flex-col items-center gap-[8px] px-1.5 pt-[14px] pb-[12px] rounded-[12px] border border-line bg-cream text-center shadow-[0_2px_0_var(--c-line)] transition-[transform,box-shadow,border-color] duration-100 ease-out hover:border-success active:translate-y-[2px] active:shadow-[0_0_0_var(--c-line)]"
              >
                <span className="text-success-deep transition-transform group-hover:scale-110">
                  <ModuleIcon href={m.href} size={28} />
                </span>
                <span className="text-[13px] font-extrabold text-charcoal leading-[1.1]">{tn(m.label.toLowerCase())}</span>
              </Link>
            ))}
          </div>

          {/* Desktop (xl+) keeps the tile grid it has had since 839b57c. */}
          <div className="hidden xl:grid grid-cols-3 gap-[8px] mb-3">
            {MODULES.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  data-tour={m.tourId}
                  className="group relative overflow-hidden flex flex-col items-center justify-center gap-[8px] min-h-[86px] rounded-[20px] xl:rounded-[20px] border border-line bg-cream px-[8px] py-[12px] text-center transition-all hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99] hover:border-success"
                >
                  {/* the drawn icons everywhere now (2026-09-08 user call):
                      the emoji fallback the desktop grid kept for one pass is
                      gone, so a door looks the same on a phone and a laptop.
                      navItems' `icon` stays for anywhere else that reads it. */}
                  <span className="text-success-deep transition-transform group-hover:scale-110">
                    <ModuleIcon href={m.href} />
                  </span>
                  <span className="text-[14px] font-bold text-charcoal leading-tight">{tn(m.label.toLowerCase())}</span>
                  {/* the phone hairline that used to hang here was already
                      `xl:hidden`; the progress ring on the stones above is
                      where that number lives now. */}
                </Link>
            ))}
          </div>

          <InstallBanner streakDays={streakDays} />

          {/* spaced-repetition review — one slim row, only when words are
              due, so a new learner's home has nothing to scroll past */}
          {/* Below xl the review row and the slang line share one cream list
              card — two bare hairline rows under a column of cards read as a
              different page starting halfway down. A list, not a button, so
              no 2px edge; each row presses on its own. At xl the wrapper is
              display: contents and the review row is its own card as before. */}
          <div className="mb-3 rounded-[12px] border border-line bg-cream overflow-hidden divide-y divide-line xl:contents">
          {dueCount > 0 && (
            <Link
              href="/review"
              className="group flex items-center gap-3 px-[14px] py-[13px] transition-all active:bg-warm xl:mb-3 xl:gap-[12px] xl:border xl:border-line xl:rounded-[20px] xl:bg-cream xl:px-[16px] xl:hover:-translate-y-0.5 xl:active:translate-y-[1px] xl:active:scale-[.99] xl:hover:border-success"
            >
              <Glyph name="drop" className="w-[21px] h-[21px] text-success transition-transform group-hover:scale-110" />
              {/* "Review · 12 due" (2026-09-11, user: shorter). The long
                  sentence wrapped or clipped at 360px; the count now trails
                  the verb, so the part that matters is never the part cut. */}
              <b className="flex-1 min-w-0 truncate text-[15px] font-bold text-charcoal">
                {t("review.label")}
                <span className="font-medium text-muted"> · {t("review.dueShort", { count: dueCount })}</span>
              </b>
              <span className="flex-none text-[15px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          )}

          {/* today's slang — one line here below xl, a rail note at xl+.
              Moved back out of /vocabulary 2026-09-08 (user call): the
              Garden is where the day's one-bite Korean belongs. Garden
              tokens, not the old pink literals the palette pass retired. */}
          <Link
            href="/slang"
            className="xl:hidden group flex items-center gap-3 px-[14px] py-[13px] transition-all active:bg-warm"
          >
            <Glyph name="bubble" className="w-[19px] h-[19px] text-success transition-transform group-hover:scale-110" />
            <span className="flex-1 min-w-0 truncate text-[14px]">
              <b className="font-bold text-charcoal">
                <span className="kr">{slang.kr}</span>{" "}
                <span className="font-medium text-muted">({slang.romanization})</span>
              </b>
              <span className="text-[12.5px] text-muted"> · {slang.meaning}</span>
            </span>
            <span className="flex-none text-[12.5px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
              {t("slang.short")}
            </span>
          </Link>
          </div>

          {/* Learning progress moved to My account (/profile) 2026-08-30 — the
              Garden answers "what do I do today", the account page "how am I
              doing". */}

          {/* The page ends here on a phone. The This-week chart sat under the
              list for an afternoon (2026-09-10) and came out the same day —
              the Garden stays one screen; the week lives on My progress. The
              phone-only feedback pill that used to end the page is gone too;
              Settings still has a Send-feedback row. */}
        </main>

        <Widgets slang={{ kr: slang.kr, romanization: slang.romanization, meaning: slang.meaning }} />
      </div>

      <BottomNav />
      <FeedbackWidget />
    </div>
  );
}

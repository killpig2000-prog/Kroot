import Link from "next/link";
import { redirect } from "next/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import QuestButton from "@/components/dashboard/QuestButton";
import Sidebar from "@/components/dashboard/Sidebar";
import SkillBar from "@/components/dashboard/SkillBar";
import Widgets from "@/components/dashboard/Widgets";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import Greeting from "@/components/dashboard/Greeting";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import MonthlyGrass from "@/components/profile/MonthlyGrass";
import { computeEligibility } from "@/lib/promotion-server";
import { testForGrade } from "@/lib/promotion-test";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getPassagesForLevel } from "@/lib/reading";
import { getPromptsForLevel } from "@/lib/writing";
import { chapterClearStats, NAILED_THRESHOLD } from "@/lib/pronunciation";
import { getWordsForTopic } from "@/lib/vocabulary";
import { slangOfTheDay } from "@/lib/slang";
import { isPlus } from "@/lib/plus";
import type { CefrLevel } from "@/lib/tree";

// The old Basics/Practice/Relax card list duplicated the sidebar; only the
// four practice skills keep an in-page presence, as compact progress rows.
const PRACTICE_SKILLS = [
  { key: "listening", href: "/listening", kr: "듣", en: "Listening", bg: "#F0FDF4", color: "#16A34A" },
  { key: "reading", href: "/reading", kr: "읽", en: "Reading", bg: "#EFF6FF", color: "#2563EB" },
  { key: "writing", href: "/writing", kr: "쓰", en: "Writing", bg: "#FFFBEB", color: "#D97706" },
  { key: "pronunciation", href: "/speaking", kr: "발", en: "Pronunciation", bg: "#F0FDFA", color: "#0D9488" },
];

const MONTH_GOAL = 20;

// One quest per day, rotating through the four practice skills.
const QUEST_ROTATION = [
  { skill_key: "writing", title: "Today's quest", description: "Writing · 5 everyday sentences · ~5 min" },
  { skill_key: "vocabulary", title: "Today's quest", description: "Watering · review your due words · ~5 min" },
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
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, xp, streak_days, last_active_date, avatar_url, plus_until")
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
  ]);

  // Confirmed-email signups land here without ever picking a starting level
  // (the confirmation link used to skip onboarding). Send them back; a query
  // error must not lock anyone out of the dashboard.
  if (!levelTestRes.error && (levelTestRes.count ?? 0) === 0) redirect("/onboarding");

  const streakDays = streakError ? profile?.streak_days ?? 0 : (streakValue as number) ?? 0;
  const ownedIds = (costumeRows ?? []).map((r) => r.costume_id);
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

  // Promotion eligibility runs after the main batch (it needs the grade);
  // internally it fans out its own queries in parallel.
  const elig = await computeEligibility(supabase, user.id, cefr);
  const promo = testForGrade(cefr);
  const accuracyPct = Math.round(elig.accuracy * 100);
  const accuracyLabel = elig.hasAccuracyData ? `${accuracyPct}%` : "—";
  const promoChecks = [
    { label: "Words", ok: elig.wordsReviewed >= elig.wordsRequired, value: `${elig.wordsReviewed}/${elig.wordsRequired}` },
    { label: "Accuracy", ok: elig.hasAccuracyData && accuracyPct >= Math.round(elig.accuracyRequired * 100), value: accuracyLabel },
    { label: "Reading", ok: elig.readingDone >= elig.readingRequired, value: `${elig.readingDone}/${elig.readingRequired}` },
  ];
  // Errors (e.g. migration 0022 not applied yet) just hide the watering card.
  const dueCount = dueRes.error ? 0 : dueRes.count ?? 0;

  const tally = (doneKeys: Set<string>, levelKeys: string[]) => {
    const done = levelKeys.filter((k) => doneKeys.has(k)).length;
    const total = levelKeys.length;
    return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
  };
  const skillProgress: Record<string, { done: number; total: number; percent: number }> = {
    listening: tally(
      new Set((listeningRows ?? []).map((r) => r.dialogue_id)),
      DIALOGUES.filter((d) => d.level === cefr).map((d) => d.id)
    ),
    reading: tally(
      new Set((readingRows ?? []).map((r) => r.passage_key)),
      getPassagesForLevel(cefr).map((p) => p.key)
    ),
    writing: tally(
      new Set((writingRows ?? []).map((r) => r.prompt_key)),
      getPromptsForLevel(cefr).map((p) => p.key)
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

  const plusActive = isPlus(profile?.plus_until);
  const day = now.getDay();
  const weekendBoost = plusActive && (day === 0 || day === 6);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#221F1B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] xl:grid-cols-[clamp(200px,17%,280px)_minmax(0,1fr)_clamp(260px,22%,340px)] w-full min-h-screen">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
          plus={plusActive}
        />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
          <Greeting name={displayName} />
          <p className="text-muted text-sm mb-6">
            One lesson today keeps your tree growing.
            {weekendBoost && (
              <span className="ml-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#B45309] bg-[#FFFBEB] border border-amber-line rounded-full px-2.5 py-[3px] align-middle">
                ⚡ Weekend boost — 1.5x XP all weekend
              </span>
            )}
          </p>

          <TreeCard
            level={level}
            progressPct={pct}
            xpInto={into}
            xpNeeded={needed}
            costumeIds={equippedIds}
            species={cefr}
            userId={user.id}
            ownedIds={ownedIds}
          />

          {/* watering (spaced-repetition review) */}
          {dueCount > 0 && (
            <Link
              href="/review"
              className="flex items-center gap-3.5 border border-sky-line bg-[#EFF6FF] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-sky-line flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                💧
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#1D4ED8]">
                  {dueCount} {dueCount === 1 ? "word is" : "words are"} getting thirsty
                </b>
                <span className="text-[13px] text-[#3B82F6]">
                  Water them before they wilt — a quick review keeps them rooted.
                </span>
              </span>
              <span className="text-[13px] font-semibold text-sky-deep transition-transform group-hover:translate-x-0.5">
                Water now →
              </span>
            </Link>
          )}

          {/* quest — a checklist slip pinned under the course note.
              On xl+ it moves to the right rail so the garden stays above the fold. */}
          <div className="xl:hidden border border-dashed border-[#CFC8B8] rounded-[12px] bg-white px-5 py-4 flex items-center gap-3.5 mb-[30px] flex-wrap">
            <span className="flex-none w-10 h-10 rounded-[10px] bg-[#FEF9C3] border border-[#ECD98A] flex items-center justify-center text-lg">
              ✏️
            </span>
            <div className="flex-1 min-w-[170px]">
              <b className="block font-semibold text-sm">{quest?.title ?? questOfTheDay.title}</b>
              <span className="text-[13px] text-muted">{quest?.description ?? questOfTheDay.description}</span>
            </div>
            {quest && <QuestButton skillKey={quest.skill_key} completed={!!quest.completed_at} />}
          </div>

          {/* today's slang — a daily reason to peek at Street Talk (rail on xl+) */}
          <Link
            href="/slang"
            className="xl:hidden flex items-center gap-3.5 border border-[#FBCFE8] bg-[#FDF2F8] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
          >
            <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#FBCFE8] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
              💬
            </span>
            <span className="flex-1 min-w-[170px]">
              <b className="block font-semibold text-sm text-[#BE185D]">
                Today&apos;s slang · <span className="kr">{slang.kr}</span>{" "}
                <span className="font-medium text-[#DB2777]">({slang.romanization})</span>
              </b>
              <span className="text-[13px] text-[#9D5C79]">
                {slang.meaning} — hear it in context →
              </span>
            </span>
            <span className="text-[13px] font-semibold text-[#DB2777] transition-transform group-hover:translate-x-0.5">
              Flip it →
            </span>
          </Link>

          {/* new to Korean? — only for true beginners */}
          {cefr === "A1" && (
          <Link
            href="/hangul"
            className="flex items-center gap-3.5 border border-success-line bg-success-bg rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
          >
            <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-success-line flex items-center justify-center kr text-lg text-success transition-transform group-hover:scale-110">
              ㄱ
            </span>
            <span className="flex-1 min-w-[170px]">
              <b className="block font-semibold text-sm text-success-deep">Completely new to Korean?</b>
              <span className="text-[13px] text-[#4D7C5F]">
                Learn the alphabet first — 40 letters, one hour, free forever.
              </span>
            </span>
            <span className="text-[13px] font-semibold text-success transition-transform group-hover:translate-x-0.5">
              Start here →
            </span>
          </Link>
          )}

          {/* learning progress — replaces the old category card list (the
              sidebar already covers navigation); SkillBars live on here */}
          <div className="border border-line rounded-[14px] bg-white px-[22px] py-5 mb-[14px]">
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
                        note={
                          prog.done > 0
                            ? `${prog.done}/${prog.total}${c.key === "pronunciation" ? "" : ` · ${cefr}`}`
                            : "needs water 💧"
                        }
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* promotion status — moved in from My growth */}
          {promo && (
            <Link
              href="/level-test"
              className={`rounded-[14px] px-[22px] py-4 mb-[14px] flex items-center gap-4 flex-wrap border-[1.5px] transition-colors ${
                elig.eligible
                  ? "border-success bg-success-bg hover:bg-[#DCFCE7]"
                  : "border-line bg-white hover:border-success"
              }`}
            >
              <span className="text-[24px] flex-none">🎯</span>
              <span className="flex-1 min-w-[200px]">
                <b className="block text-[14.5px]">
                  {elig.eligible
                    ? `You're ready — take the ${promo.from} → ${promo.to} level-up test!`
                    : `On the way to ${promo.to}`}
                </b>
                <span className="flex gap-2.5 mt-1 flex-wrap">
                  {promoChecks.map((c) => (
                    <small
                      key={c.label}
                      className={`text-[12px] font-semibold ${c.ok ? "text-success" : "text-faint"}`}
                    >
                      {c.ok ? "✓" : "○"} {c.label} {c.value}
                    </small>
                  ))}
                </span>
              </span>
              <span className="flex-none text-[13px] font-bold text-success">
                {elig.eligible ? "Start →" : "Details →"}
              </span>
            </Link>
          )}

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

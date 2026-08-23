import Link from "next/link";
import { redirect } from "next/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import QuestButton from "@/components/dashboard/QuestButton";
import Sidebar from "@/components/dashboard/Sidebar";
import SkillBar from "@/components/dashboard/SkillBar";
import Widgets from "@/components/dashboard/Widgets";
import Greeting from "@/components/dashboard/Greeting";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import { COURSE_DAYS, nextCourseDay } from "@/lib/course";
import CourseCard from "@/components/dashboard/CourseCard";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getPassagesForLevel } from "@/lib/reading";
import { getPromptsForLevel } from "@/lib/writing";
import { promptsFor } from "@/lib/speaking";
import { getWordsForTopic } from "@/lib/vocabulary";
import { slangOfTheDay } from "@/lib/slang";
import { timeAgo } from "@/lib/community";
import { isPlus } from "@/lib/plus";
import type { CefrLevel } from "@/lib/tree";

type Category = { key: string; kr: string; en: string; sub: string; bg: string; color: string };

const GROUPS: { title: string; sub: string; items: Category[] }[] = [
  {
    title: "Basics",
    sub: "Start from zero — letters, sounds, and rules",
    items: [
      { key: "hangul", kr: "ㄱ", en: "Hangul", sub: "The Korean alphabet, with audio", bg: "#F0FDF4", color: "#16A34A" },
      { key: "grammar", kr: "문", en: "Grammar", sub: "Bite-size rules with examples", bg: "#EEF2FF", color: "#4F46E5" },
      { key: "pronunciation", kr: "발", en: "Pronunciation", sub: "Record and get checked", bg: "#F0FDFA", color: "#0D9488" },
      { key: "vocabulary", kr: "단", en: "Vocabulary", sub: "Flip cards by topic", bg: "#F5F3FF", color: "#7C3AED" },
    ],
  },
  {
    title: "Practice",
    sub: "Daily training for the four big skills",
    items: [
      { key: "listening", kr: "듣", en: "Listening", sub: "Level-matched audio, A1–C2", bg: "#F0FDF4", color: "#16A34A" },
      { key: "speaking", kr: "말", en: "Speaking", sub: "Say it, get AI feedback", bg: "#FFF1F2", color: "#E11D48" },
      { key: "writing", kr: "쓰", en: "Writing", sub: "Type sentences, instant fixes", bg: "#FFFBEB", color: "#D97706" },
      { key: "reading", kr: "읽", en: "Reading", sub: "Korean articles with word hints", bg: "#EFF6FF", color: "#2563EB" },
    ],
  },
  {
    title: "Relax",
    sub: "Wind down without stopping",
    items: [
      { key: "slang", kr: "슬", en: "Slang", sub: "What Koreans actually say", bg: "#FDF2F8", color: "#DB2777" },
      { key: "community", kr: "🏕️", en: "Community", sub: "Learners worldwide, one board", bg: "#F8FAFC", color: "#334155" },
    ],
  },
];

const MONTH_GOAL = 20;

// One quest per day, rotating through the four practice skills.
const QUEST_ROTATION = [
  { skill_key: "writing", title: "Today's quest", description: "Writing · 5 everyday sentences · ~5 min" },
  { skill_key: "vocabulary", title: "Today's quest", description: "Watering · review your due words · ~5 min" },
  { skill_key: "listening", title: "Today's quest", description: "Listening · one dialogue at your level · ~5 min" },
  { skill_key: "reading", title: "Today's quest", description: "Reading · one short passage · ~4 min" },
  { skill_key: "speaking", title: "Today's quest", description: "Speaking · 3 prompts out loud · ~5 min" },
];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayISO() {
  return iso(new Date());
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

  // right-panel widget data window, computed up front so every query can run
  // in one parallel batch — from Korea to us-east-1 each round trip is
  // ~300ms, so sequential awaits were the whole reason this page felt slow.
  const now = new Date();
  const week = weekDates(now);
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const rangeStart = week[0] < new Date(monthStart) ? iso(week[0]) : monthStart;

  const [
    { data: profile },
    { data: streakValue, error: streakError },
    { data: equippedRows },
    questRes,
    { data: listeningRows },
    { data: readingRows },
    { data: writingRows },
    { data: speakingRows },
    { data: recentPosts },
    dueRes,
    { data: activity },
    { data: courseRows },
    levelTestRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, xp, streak_days, last_active_date, avatar_url, path_hidden, plus_until")
      .eq("id", user.id)
      .single(),
    // touch_streak bumps (or resets) the streak server-side and returns its new value.
    supabase.rpc("touch_streak"),
    supabase.from("user_costumes").select("costume_id").eq("user_id", user.id).eq("equipped", true),
    supabase
      .from("daily_quests")
      .select("id, skill_key, title, description, completed_at")
      .eq("user_id", user.id)
      .eq("quest_date", today)
      .maybeSingle(),
    supabase.from("listening_progress").select("dialogue_id").eq("user_id", user.id).not("completed_at", "is", null),
    supabase.from("reading_progress").select("passage_key").eq("user_id", user.id),
    supabase.from("writing_progress").select("prompt_key").eq("user_id", user.id),
    supabase.from("speaking_progress").select("prompt_key").eq("user_id", user.id),
    supabase
      .from("community_posts")
      .select("author_name, author_emoji, author_plus, content, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("vocabulary_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review_at", new Date().toISOString()),
    supabase
      .from("daily_activity")
      .select("activity_date, minutes")
      .eq("user_id", user.id)
      .gte("activity_date", rangeStart),
    supabase.from("path_progress").select("step_key").eq("user_id", user.id),
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
  const equippedIds = (equippedRows ?? []).map((r) => r.costume_id);

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
    speaking: tally(
      new Set((speakingRows ?? []).map((r) => r.prompt_key)),
      promptsFor(cefr).map((p) => p.id)
    ),
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

  const feed = (recentPosts ?? []).map((p) => ({
    av: p.author_emoji ?? "🌱",
    text: p.content.split("\n")[0],
    meta: `${p.author_name}${p.author_plus ? " 🌟" : ""} · ${timeAgo(p.created_at)}`,
  }));

  const byDate = new Map((activity ?? []).map((a) => [a.activity_date, a.minutes ?? 0]));
  const weekMinutes = week.map((d) => byDate.get(iso(d)) ?? 0);
  const monthDone = (activity ?? []).filter((a) => a.activity_date >= monthStart && (a.minutes ?? 0) > 0).length;

  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysLeft = monthEnd.getDate() - now.getDate();
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel = `${fmt(week[0])}–${week[6].getDate()}`;
  const monthLabel = now.toLocaleDateString("en-US", { month: "long" });

  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);

  const plusActive = isPlus(profile?.plus_until);
  const day = now.getDay();
  const weekendBoost = plusActive && (day === 0 || day === 6);

  // 16-day course card: shown until dismissed or the course is finished.
  const showCourse = !profile?.path_hidden;
  let courseNext: ReturnType<typeof nextCourseDay> = null;
  let courseDoneDays: number[] = [];
  if (showCourse) {
    const doneKeys = new Set((courseRows ?? []).map((r) => r.step_key));
    courseNext = nextCourseDay(doneKeys);
    courseDoneDays = COURSE_DAYS.filter((d) => doneKeys.has(d.key)).map((d) => d.day);
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#221F1B]">
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
          <p className="text-[#6B6560] text-sm mb-6">
            One lesson today keeps your tree growing.
            {weekendBoost && (
              <span className="ml-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2.5 py-[3px] align-middle">
                ⚡ Weekend boost — 1.5x XP all weekend
              </span>
            )}
          </p>

          <TreeCard level={level} progressPct={pct} xpInto={into} xpNeeded={needed} costumeIds={equippedIds} species={cefr} />

          {/* watering (spaced-repetition review) */}
          {dueCount > 0 && (
            <Link
              href="/review"
              className="flex items-center gap-3.5 border border-[#BFDBFE] bg-[#EFF6FF] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#BFDBFE] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
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
              <span className="text-[13px] font-semibold text-[#2563EB] transition-transform group-hover:translate-x-0.5">
                Water now →
              </span>
            </Link>
          )}

          {courseNext && (
            <CourseCard
              userId={user.id}
              nextDay={courseNext.day}
              nextTitle={courseNext.title}
              nextTitleKr={courseNext.titleKr}
              nextMinutes={courseNext.minutes}
              doneDays={courseDoneDays}
            />
          )}

          {/* quest — a checklist slip pinned under the course note */}
          <div className="border border-dashed border-[#CFC8B8] rounded-[12px] bg-white px-5 py-4 flex items-center gap-3.5 mb-[30px] flex-wrap">
            <span className="flex-none w-10 h-10 rounded-[10px] bg-[#FEF9C3] border border-[#ECD98A] flex items-center justify-center text-lg">
              ✏️
            </span>
            <div className="flex-1 min-w-[170px]">
              <b className="block font-semibold text-sm">{quest?.title ?? questOfTheDay.title}</b>
              <span className="text-[13px] text-[#6B6560]">{quest?.description ?? questOfTheDay.description}</span>
            </div>
            {quest && <QuestButton skillKey={quest.skill_key} completed={!!quest.completed_at} />}
          </div>

          {/* today's slang — a daily reason to peek at Street Talk */}
          <Link
            href="/slang"
            className="flex items-center gap-3.5 border border-[#FBCFE8] bg-[#FDF2F8] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
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

          {/* new to Korean? */}
          <Link
            href="/hangul"
            className="flex items-center gap-3.5 border border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-5 py-4 mb-[30px] transition-all hover:-translate-y-0.5 group"
          >
            <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#BBF7D0] flex items-center justify-center kr text-lg text-[#16A34A] transition-transform group-hover:scale-110">
              ㄱ
            </span>
            <span className="flex-1 min-w-[170px]">
              <b className="block font-semibold text-sm text-[#15803D]">Completely new to Korean?</b>
              <span className="text-[13px] text-[#4D7C5F]">
                Learn the alphabet first — 40 letters, one hour, free forever.
              </span>
            </span>
            <span className="text-[13px] font-semibold text-[#16A34A] transition-transform group-hover:translate-x-0.5">
              Start here →
            </span>
          </Link>

          {/* grouped skill list */}
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-[30px]">
              <div className="flex items-baseline justify-between mb-3.5">
                <span className="font-extrabold text-[15px] tracking-[-0.01em]">{group.title}</span>
                <span className="text-[12.5px] text-[#A19A8C] font-medium">{group.sub}</span>
              </div>
              <div className="border border-[#E3DDD0] rounded-[14px] overflow-hidden shadow-[0_10px_24px_-18px_rgba(60,50,30,.3)]">
                {group.items.map((c) => {
                  const done = quest?.skill_key === c.key && !!quest?.completed_at;
                  const prog = skillProgress[c.key];
                  return (
                    <Link
                      key={c.en}
                      href={`/${c.key}`}
                      className="w-full flex items-center gap-3.5 text-left bg-white border-b border-dashed border-[#E3DDD0] last:border-b-0 px-[18px] py-[13px] transition-colors hover:bg-[#FAF7EF] group"
                    >
                      <span
                        className="w-9 h-9 rounded-[9px] flex-none flex items-center justify-center kr text-base transition-transform group-hover:scale-110"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {c.kr}
                      </span>
                      <span className="flex-1 min-w-0">
                        <b className="block font-semibold text-sm">{c.en}</b>
                        {group.title === "Practice" && prog ? (
                          <SkillBar
                            percent={prog.percent}
                            note={prog.done > 0 ? `${prog.done}/${prog.total} · ${cefr}` : "needs water 💧"}
                          />
                        ) : (
                          <small className="text-[12.5px] text-[#6B6560]">{c.sub}</small>
                        )}
                      </span>
                      <span className="flex items-center gap-2 text-[12.5px] text-[#A19A8C]">
                        {done && (
                          <span className="text-[11.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-md px-2 py-0.5">
                            +10 XP
                          </span>
                        )}
                        <span className="transition-transform group-hover:translate-x-0.5">→</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </main>

        <Widgets
          weekMinutes={weekMinutes}
          weekLabel={weekLabel}
          monthDone={monthDone}
          monthGoal={MONTH_GOAL}
          monthLabel={monthLabel}
          daysLeft={daysLeft}
          wotd={wotd}
          feed={feed}
        />
      </div>

      <BottomNav />
    </div>
  );
}

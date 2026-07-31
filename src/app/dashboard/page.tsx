import Link from "next/link";
import { redirect } from "next/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import BottomNav from "@/components/dashboard/BottomNav";
import QuestButton from "@/components/dashboard/QuestButton";
import Sidebar from "@/components/dashboard/Sidebar";
import SkillBar from "@/components/dashboard/SkillBar";
import Widgets from "@/components/dashboard/Widgets";
import { createClient } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import { COURSE_DAYS, nextCourseDay } from "@/lib/course";
import CourseCard from "@/components/dashboard/CourseCard";

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
      { key: "community", kr: "🏕️", en: "Community", sub: "Learners worldwide, auto-translated", bg: "#F8FAFC", color: "#334155" },
    ],
  },
];

const MONTH_GOAL = 20;

const DEFAULT_QUEST = {
  skill_key: "writing",
  title: "Today's quest",
  description: "Writing · 5 everyday sentences · ~5 min",
};

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, xp, streak_days, last_active_date, avatar_url, path_hidden")
    .eq("id", user.id)
    .single();

  const today = todayISO();
  // touch_streak bumps (or resets) the streak server-side and returns its new value.
  const { data: streakValue, error: streakError } = await supabase.rpc("touch_streak");
  const streakDays = streakError ? profile?.streak_days ?? 0 : (streakValue as number) ?? 0;

  const { data: equippedRows } = await supabase
    .from("user_costumes")
    .select("costume_id")
    .eq("user_id", user.id)
    .eq("equipped", true);
  const equippedIds = (equippedRows ?? []).map((r) => r.costume_id);

  let { data: quest } = await supabase
    .from("daily_quests")
    .select("id, skill_key, title, description, completed_at")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .maybeSingle();

  if (!quest) {
    const { data: created } = await supabase
      .from("daily_quests")
      .insert({ user_id: user.id, quest_date: today, ...DEFAULT_QUEST })
      .select("id, skill_key, title, description, completed_at")
      .single();
    quest = created ?? null;
  }

  // right-panel widget data: this week's watering + this month's lesson days
  const now = new Date();
  const week = weekDates(now);
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const rangeStart = week[0] < new Date(monthStart) ? iso(week[0]) : monthStart;

  const { data: activity } = await supabase
    .from("daily_activity")
    .select("activity_date, minutes")
    .eq("user_id", user.id)
    .gte("activity_date", rangeStart);

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

  // 16-day course card: shown until dismissed or the course is finished.
  const showCourse = !profile?.path_hidden;
  let courseNext: ReturnType<typeof nextCourseDay> = null;
  let courseDoneDays: number[] = [];
  if (showCourse) {
    const { data: courseRows } = await supabase
      .from("path_progress")
      .select("step_key")
      .eq("user_id", user.id);
    const doneKeys = new Set((courseRows ?? []).map((r) => r.step_key));
    courseNext = nextCourseDay(doneKeys);
    courseDoneDays = COURSE_DAYS.filter((d) => doneKeys.has(d.key)).map((d) => d.day);
  }

  return (
    <div className="min-h-screen bg-white text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] xl:grid-cols-[clamp(200px,17%,280px)_minmax(0,1fr)_clamp(260px,22%,340px)] w-full min-h-screen">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[26px] pb-[100px] md:pb-[60px]">
          <h1 className="font-semibold text-[clamp(20px,2.4vw,24px)] tracking-[-0.02em] mb-0.5">
            Good morning, {displayName}
          </h1>
          <p className="text-[#71717A] text-sm mb-6">One lesson today keeps your tree growing.</p>

          <TreeCard level={level} progressPct={pct} xpInto={into} xpNeeded={needed} costumeIds={equippedIds} />

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

          {/* quest */}
          <div className="border border-[#E7E5E4] rounded-[14px] bg-[#FAFAF9] px-5 py-4 flex items-center gap-3.5 mb-[30px] flex-wrap">
            <span className="flex-none w-10 h-10 rounded-[10px] bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-lg">
              ✏️
            </span>
            <div className="flex-1 min-w-[170px]">
              <b className="block font-semibold text-sm">{quest?.title ?? DEFAULT_QUEST.title}</b>
              <span className="text-[13px] text-[#71717A]">{quest?.description ?? DEFAULT_QUEST.description}</span>
            </div>
            {quest && <QuestButton questId={quest.id} completed={!!quest.completed_at} />}
          </div>

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
                <span className="font-semibold text-[15px] tracking-[-0.01em]">{group.title}</span>
                <span className="text-[12.5px] text-[#A1A1AA] font-medium">{group.sub}</span>
              </div>
              <div className="border border-[#E7E5E4] rounded-[14px] overflow-hidden">
                {group.items.map((c) => {
                  const done = quest?.skill_key === c.key && !!quest?.completed_at;
                  const percent = done ? 100 : 0;
                  return (
                    <Link
                      key={c.en}
                      href={`/${c.key}`}
                      className="w-full flex items-center gap-3.5 text-left bg-white border-b border-[#E7E5E4] last:border-b-0 px-[18px] py-[13px] transition-colors hover:bg-[#FAFAF9] group"
                    >
                      <span
                        className="w-9 h-9 rounded-[9px] flex-none flex items-center justify-center kr text-base transition-transform group-hover:scale-110"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {c.kr}
                      </span>
                      <span className="flex-1 min-w-0">
                        <b className="block font-semibold text-sm">{c.en}</b>
                        {group.title === "Practice" ? (
                          <SkillBar percent={percent} note={done ? "done ✓" : "needs water 💧"} />
                        ) : (
                          <small className="text-[12.5px] text-[#71717A]">{c.sub}</small>
                        )}
                      </span>
                      <span className="flex items-center gap-2 text-[12.5px] text-[#A1A1AA]">
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
        />
      </div>

      <BottomNav />
    </div>
  );
}

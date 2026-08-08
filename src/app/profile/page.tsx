import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WeeklyChart, { type DayMinutes } from "@/components/profile/WeeklyChart";
import AvatarUploader from "@/components/profile/AvatarUploader";
import ManageSubscriptionButton from "@/components/plus/ManageSubscriptionButton";
import NameEditor from "@/components/profile/NameEditor";
import Wardrobe from "@/components/profile/Wardrobe";
import RankCard from "@/components/profile/RankCard";
import MonthlyGrass from "@/components/profile/MonthlyGrass";
import LeagueBoard from "@/components/league/LeagueBoard";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_PATH, SPECIES, type CefrLevel } from "@/lib/tree";
import { levelProgress, treeStageForLevel, MAX_LEVEL } from "@/lib/level";
import { COURSE_TOTAL_DAYS } from "@/lib/course";
import { computeEligibility } from "@/lib/promotion-server";
import { isPlus } from "@/lib/plus";
import { testForGrade } from "@/lib/promotion-test";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const out: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

/** Longest run of consecutive study days across the whole history. */
function bestStreak(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of sorted) {
    const d = new Date(iso);
    run = prev && d.getTime() - prev.getTime() === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, native_language, current_level, streak_days, created_at, avatar_url, coins, xp, path_hidden, plus_until")
    .eq("id", user.id)
    .single();

  const level = (profile?.current_level ?? "A1") as CefrLevel;

  // Aggregates come from one RPC (migration 0017); until it's applied we
  // fall back to per-table queries.
  const [{ data: costumeRows }, { data: allActivity }, statsRes, elig] = await Promise.all([
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
    supabase.from("daily_activity").select("activity_date, minutes").eq("user_id", user.id),
    supabase.rpc("get_my_growth_stats"),
    computeEligibility(supabase, user.id, level),
  ]);

  type GrowthStats = {
    course_done: number;
    listening_done: number;
    writing_done: number;
    speaking_done: number;
    total_minutes: number;
    best_streak: number;
  };
  let stats = (Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data) as GrowthStats | null;
  if (statsRes.error || !stats) {
    const [courseQ, listeningQ, writingQ, speakingQ] = await Promise.all([
      supabase.from("path_progress").select("step_key").eq("user_id", user.id).like("step_key", "course-day-%"),
      supabase.from("listening_progress").select("dialogue_id").eq("user_id", user.id).not("completed_at", "is", null),
      supabase.from("writing_progress").select("prompt_key").eq("user_id", user.id),
      supabase.from("speaking_progress").select("prompt_key").eq("user_id", user.id),
    ]);
    stats = {
      course_done: (courseQ.data ?? []).length,
      listening_done: (listeningQ.data ?? []).length,
      writing_done: (writingQ.data ?? []).length,
      speaking_done: (speakingQ.data ?? []).length,
      total_minutes: (allActivity ?? []).reduce((sum, a) => sum + (a.minutes ?? 0), 0),
      // Recomputed below from the full daily_activity history.
      best_streak: 0,
    };
  }

  const ownedIds = (costumeRows ?? []).map((r) => r.costume_id);
  const equippedIds = (costumeRows ?? []).filter((r) => r.equipped).map((r) => r.costume_id);

  // ---- weekly chart + lifetime stats, all from daily_activity ----
  const days = lastNDays(7);
  const minutesByDate = new Map((allActivity ?? []).map((a) => [a.activity_date, a.minutes ?? 0]));
  const chartDays: DayMinutes[] = days.map((d) => {
    const date = isoDate(d);
    return {
      date,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      minutes: minutesByDate.get(date) ?? 0,
    };
  });
  const weekTotal = chartDays.reduce((sum, d) => sum + d.minutes, 0);
  const totalMinutes = stats.total_minutes;
  const activeDates = (allActivity ?? []).filter((a) => (a.minutes ?? 0) > 0).map((a) => a.activity_date);
  const longestStreak = Math.max(stats.best_streak, bestStreak(activeDates), profile?.streak_days ?? 0);

  const courseDone = stats.course_done;
  const listeningDone = stats.listening_done;
  const writingDone = stats.writing_done;
  const speakingDone = stats.speaking_done;

  const xp = profile?.xp ?? 0;
  const { level: playerLevel, into, needed, pct } = levelProgress(xp);
  const treeStage = LEVEL_PATH[treeStageForLevel(playerLevel)];
  const atMaxLevel = playerLevel >= MAX_LEVEL;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";
  const daysGrowing = profile?.created_at
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(profile.created_at).getTime()) / 86_400_000))
    : 1;

  // Course gauge: A1 learners only; hidden if dismissed and never started;
  // completed shows a one-line badge instead of a bar.
  const courseFinished = courseDone >= COURSE_TOTAL_DAYS;
  const showCourseGauge =
    level === "A1" && !courseFinished && (courseDone > 0 || !profile?.path_hidden);

  const promo = testForGrade(level);
  const accuracyPct = Math.round(elig.accuracy * 100);
  const accuracyLabel = elig.hasAccuracyData ? `${accuracyPct}%` : "\u2014";
  const promoChecks = [
    { label: "Words", ok: elig.wordsReviewed >= elig.wordsRequired, value: `${elig.wordsReviewed}/${elig.wordsRequired}` },
    { label: "Accuracy", ok: elig.hasAccuracyData && accuracyPct >= Math.round(elig.accuracyRequired * 100), value: accuracyLabel },
    { label: "Reading", ok: elig.readingDone >= elig.readingRequired, value: `${elig.readingDone}/${elig.readingRequired}` },
  ];


  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] xl:grid-cols-[clamp(200px,17%,280px)_minmax(0,1fr)_clamp(320px,28%,440px)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          plus={isPlus(profile?.plus_until)}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">My growth</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] items-center justify-center kr text-[15px] mr-[9px]">
                나
              </span>
              My growth
            </h1>
          </div>

          <div className="max-w-[820px] grid gap-3.5">
            {/* identity card */}
            <div className="border border-[#E3DDD0] rounded-[14px] px-[22px] py-5 flex items-center gap-4 flex-wrap">
              <AvatarUploader userId={user.id} avatarUrl={profile?.avatar_url ?? null} />
              <div className="flex-1 min-w-[180px]">
                <b className="font-semibold text-base flex items-center gap-2">
                  <NameEditor userId={user.id} name={profile?.display_name ?? "Learner"} />
                  {isPlus(profile?.plus_until) && (
                    <span className="text-[10.5px] font-bold tracking-[.04em] text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] rounded-md px-1.5 py-0.5">
                      🌟 PLUS
                    </span>
                  )}
                </b>
                <span className="text-[13px] text-[#6B6560]">
                  {SPECIES[level].name} {SPECIES[level].emoji} · {treeStage.treeName} · Lv. {playerLevel} · {level} difficulty · growing since{" "}
                  {memberSince}
                </span>
                <div className="mt-2 max-w-[280px]">
                  <div className="h-[6px] rounded-full bg-[#F0FDF4] border border-[#BBF7D0] overflow-hidden">
                    <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${pct}%` }} />
                  </div>
                  <small className="block mt-1 text-[12px] text-[#6B6560]">
                    {atMaxLevel ? "Max level 🎉" : `${into}/${needed} XP to Lv. ${playerLevel + 1}`}
                  </small>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[12.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1">
                  🔥 {profile?.streak_days ?? 0} day streak
                </span>
                <span className="text-[12.5px] font-semibold text-[#6B6560] bg-[#FAF7EF] border border-[#E3DDD0] rounded-full px-3 py-1">
                  🌰 {profile?.coins ?? 0} coins
                </span>
              </div>
            </div>

            {isPlus(profile?.plus_until) ? (
              <Link
                href="/stats"
                className="border border-[#FDE68A] bg-[#FFFBEB] rounded-[14px] px-[22px] py-4 flex items-center gap-4 flex-wrap transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex-1 min-w-[220px]">
                  <b className="font-semibold text-[14.5px] block mb-0.5">📊 Insights</b>
                  <span className="text-[13px] text-[#6B6560]">
                    Your Plus stats page — accuracy by skill, weakest words, XP timeline.
                  </span>
                </div>
                <span className="text-[13px] font-bold text-[#D97706] transition-transform group-hover:translate-x-0.5">
                  Open →
                </span>
              </Link>
            ) : null}
            {isPlus(profile?.plus_until) ? (
              <div className="flex items-center justify-end gap-3 -mt-2">
                <span className="text-[12px] text-[#A19A8C]">
                  🌟 Kroot Plus active — cancel or switch plans anytime.
                </span>
                <ManageSubscriptionButton />
              </div>
            ) : (
              <div className="border border-[#FDE68A] bg-[#FFFBEB] rounded-[14px] px-[22px] py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <b className="font-semibold text-[14.5px] block mb-0.5">🌟 Kroot Plus</b>
                  <span className="text-[13px] text-[#6B6560]">
                    Streak shield, weekend XP boost, unlimited AI grading, insights & exclusive
                    outfits — every lesson stays free.
                  </span>
                </div>
                <Link
                  href="/pricing"
                  className="rounded-[9px] bg-[#16A34A] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#15803D] transition-colors"
                >
                  See plans →
                </Link>
              </div>
            )}

            <Wardrobe userId={user.id} level={level} ownedIds={ownedIds} equippedIds={equippedIds} />

            {/* ---- growth: course + skills ---- */}
            <div className="border border-[#E3DDD0] rounded-[14px] px-[22px] py-5">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <b className="font-semibold text-[15px]">📈 Learning progress</b>
                {(showCourseGauge || courseFinished) && (
                  <Link href="/course" className="text-[12.5px] font-semibold text-[#16A34A] hover:underline">
                    16-Day Course →
                  </Link>
                )}
              </div>

              {showCourseGauge && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex-none text-[12.5px] font-semibold text-[#6B6560] w-[92px]">
                    Course {courseDone}/{COURSE_TOTAL_DAYS}
                  </span>
                  <span className="flex-1 h-2.5 rounded-full bg-[#F5F5F4] overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-[#16A34A] transition-all"
                      style={{ width: `${Math.round((courseDone / COURSE_TOTAL_DAYS) * 100)}%` }}
                    />
                  </span>
                  <b className="flex-none text-[12.5px] tabular-nums">
                    {Math.round((courseDone / COURSE_TOTAL_DAYS) * 100)}%
                  </b>
                </div>
              )}
              {courseFinished && (
                <p className="text-[12.5px] font-semibold text-[#16A34A] mb-4">
                  ✓ 16-Day Course complete 🎉
                </p>
              )}

              <div className="flex gap-x-4 gap-y-1 flex-wrap text-[12.5px] text-[#6B6560]">
                <span>🃏 {elig.wordsReviewed}/{elig.wordsRequired} words · {accuracyLabel} accuracy</span>
                <span>🎧 {listeningDone} listened</span>
                <span>📰 {elig.readingDone} read</span>
                <span>✏️ {writingDone} written</span>
                <span>🎙️ {speakingDone} spoken</span>
              </div>
            </div>

            {/* ---- promotion status ---- */}
            {promo && (
              <Link
                href="/level-test"
                className={`rounded-[14px] px-[22px] py-4 flex items-center gap-4 flex-wrap border-[1.5px] transition-colors ${
                  elig.eligible
                    ? "border-[#16A34A] bg-[#F0FDF4] hover:bg-[#DCFCE7]"
                    : "border-[#E3DDD0] bg-white hover:border-[#16A34A]"
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
                        className={`text-[12px] font-semibold ${c.ok ? "text-[#16A34A]" : "text-[#A19A8C]"}`}
                      >
                        {c.ok ? "✓" : "○"} {c.label} {c.value}
                      </small>
                    ))}
                  </span>
                </span>
                <span className="flex-none text-[13px] font-bold text-[#16A34A]">
                  {elig.eligible ? "Start →" : "Details →"}
                </span>
              </Link>
            )}

            <span className="xl:hidden"><RankCard grade={level} /></span>

            <WeeklyChart days={chartDays} />

            <MonthlyGrass
              minutesByDate={minutesByDate}
              headline={[
                { label: "this week", value: `${weekTotal}m` },
                { label: "total", value: totalMinutes >= 90 ? `${Math.round(totalMinutes / 6) / 10}h` : `${totalMinutes}m` },
                { label: "best streak", value: `${longestStreak}d` },
                { label: "growing", value: `${daysGrowing}d` },
              ]}
            />
          </div>
        </main>

        {/* right rail: the full league view, embedded (xl and up) */}
        <aside className="hidden xl:block pt-6 pr-[clamp(18px,2vw,28px)] pb-[60px]">
          <div className="sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto pr-1">
            <h2 className="font-bold text-[15px] tracking-[-0.01em] mb-3">🏆 {level} League</h2>
            <LeagueBoard grade={level} />
          </div>
        </aside>
      </div>

      <BottomNav />
    </div>
  );
}

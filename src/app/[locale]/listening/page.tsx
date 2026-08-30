import LevelTabs from "@/components/ui/LevelTabs";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ContinueHero, { type HeroClip } from "@/components/listening/ContinueHero";
import ProgressRing from "@/components/listening/ProgressRing";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";
import { SITUATIONS } from "@/lib/listening";
import { dialoguesFor } from "@/lib/listening-dialogues";
import { estMinutes } from "@/lib/listening-resume";

export default async function ListeningPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const profile = await getDashboardProfile(supabase, user.id);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const sp = await searchParams;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;

  // Monday-based current week, UTC (daily_activity.activity_date is a DB date).
  const now = new Date();
  const todayIndex = (now.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - todayIndex));
  const mondayStr = monday.toISOString().slice(0, 10);

  const [{ data: progressRows }, { data: activityRows }] = await Promise.all([
    supabase
      .from("listening_progress")
      .select("dialogue_id")
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
    supabase
      .from("daily_activity")
      .select("activity_date, minutes")
      .eq("user_id", user.id)
      .gte("activity_date", mondayStr),
  ]);
  const completedIds = new Set((progressRows ?? []).map((r) => r.dialogue_id));

  const weekMinutes = [0, 0, 0, 0, 0, 0, 0];
  for (const row of activityRows ?? []) {
    const d = Math.round((Date.parse(`${row.activity_date}T00:00:00Z`) - monday.getTime()) / 86400000);
    if (d >= 0 && d < 7) weekMinutes[d] += row.minutes ?? 0;
  }

  const bySituation = SITUATIONS.map((s) => ({ s, dialogues: dialoguesFor(level, s.key) }));
  const heroClips: HeroClip[] = bySituation.flatMap(({ s, dialogues }) =>
    dialogues.map((d, i) => ({
      id: d.id,
      title: d.title as string,
      situationKey: s.key,
      situationLabel: s.label,
      situationIcon: s.icon,
      clipNo: i + 1,
      clipCount: dialogues.length,
      lineCount: d.lines.length,
    }))
  );
  const heardAtLevel = heroClips.filter((c) => completedIds.has(c.id)).length;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Listening</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-teal)] text-teal border border-[var(--tint-teal-line)] items-center justify-center kr text-[15px] mr-[9px]">
                듣
              </span>
              Listening
            </h1>
            <span className="text-[13px] text-muted">Pick a situation, listen, follow the script</span>
          </div>

          <LevelTabs
            className="mb-5"
            levels={LEVEL_ORDER}
            current={level}
            mine={myLevel}
            unlocked={(lv) => isDifficultyUnlocked(lv, myLevel)}
            href={(lv) => `/listening?level=${lv}`}
            accent="bg-teal border-teal text-white"
          />

          <ContinueHero
            level={level}
            clips={heroClips}
            completedIds={[...completedIds]}
            weekMinutes={weekMinutes}
            todayIndex={todayIndex}
            heardAtLevel={heardAtLevel}
          />

          {/* situation grid — two-up on phones so all eight fit in a couple
              of screens; the wider auto-fill grid from `sm` up. */}
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 sm:gap-3.5 max-w-[980px]">
            {bySituation.map(({ s, dialogues }) => {
              const count = dialogues.length;
              const done = dialogues.filter((d) => completedIds.has(d.id)).length;
              const finished = count > 0 && done === count;
              const inProgress = done > 0 && done < count;
              const next = inProgress ? (dialogues.find((d) => !completedIds.has(d.id)) ?? null) : null;
              const totalLines = dialogues.reduce((n, d) => n + d.lines.length, 0);
              // In-progress cards act as a "Continue" button: tap goes straight
              // to the next unheard clip. Not-started and finished cards open
              // the clip list.
              const href = next
                ? `/listening/${s.key}?level=${level}&clip=${next.id}`
                : `/listening/${s.key}?level=${level}`;
              return (
                <Link
                  key={s.key}
                  href={href}
                  className="flex flex-col border border-line rounded-[16px] bg-cream overflow-hidden text-left transition-all duration-150 hover:border-[var(--tint-teal-line)] hover:-translate-y-0.5 group"
                >
                  <div
                    className="relative h-[84px] sm:h-[96px] flex items-end p-2.5 sm:p-3 overflow-hidden"
                    style={{ background: s.tint }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -right-1.5 -top-2 text-[64px] sm:text-[72px] leading-none opacity-35 -rotate-[8deg] saturate-[.8] select-none"
                    >
                      {s.icon}
                    </span>
                    <span className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] grid place-items-center text-base sm:text-lg bg-cream border border-line shadow-sm transition-transform group-hover:scale-110">
                      {s.icon}
                    </span>
                    {done > 0 && (
                      <ProgressRing
                        value={done}
                        max={count}
                        size={40}
                        trackClassName="stroke-white/55"
                        className="absolute right-2.5 bottom-2.5 sm:right-3 sm:bottom-3"
                      >
                        <span className={`text-[10.5px] font-extrabold ${finished ? "text-success" : "text-charcoal"}`}>
                          {finished ? "✓" : done}
                        </span>
                      </ProgressRing>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5 px-3 py-3 sm:px-4 sm:pb-4">
                    <b className="flex items-baseline gap-2 font-extrabold text-[14px] sm:text-[15px] min-w-0">
                      <span className="truncate">{s.label}</span>
                      <small className="kr text-[12px] text-faint font-semibold flex-none">{s.krLabel}</small>
                    </b>
                    <p className="hidden sm:block text-[12.5px] text-muted leading-[1.45]">{s.sub}</p>
                    {next && (
                      <span className="flex items-center gap-1.5 min-w-0 bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-lg px-2 py-[5px] text-[11.5px]">
                        <span
                          aria-hidden="true"
                          className="shrink-0 w-4 h-4 rounded-full bg-teal text-white grid place-items-center text-[7px] leading-none pl-px"
                        >
                          ▶
                        </span>
                        <span className="min-w-0 truncate text-charcoal">
                          Next · <span className="font-semibold">{next.title as string}</span>
                        </span>
                      </span>
                    )}
                    <span className="mt-auto pt-2 flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-muted tabular-nums truncate">
                        {count === 0
                          ? "Coming soon"
                          : finished
                            ? `All ${count} done`
                            : done > 0
                              ? `${done} / ${count} heard`
                              : `${count} clips · ~${estMinutes(totalLines)} min`}
                      </span>
                      {count > 0 && (
                        <span className={`font-bold flex-none ${finished ? "text-success" : "text-teal"}`}>
                          {finished ? "Replay →" : done > 0 ? "Continue →" : "Start →"}
                        </span>
                      )}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

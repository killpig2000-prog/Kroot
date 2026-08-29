import Link from "next/link";
import LevelTabs from "@/components/ui/LevelTabs";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ChapterPathGroup from "@/components/chapters/ChapterPathGroup";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { chapterWrittenToday, getChapterStatuses, getChaptersForLevel, WRITING_GENRE_META } from "@/lib/writing";
import { isPlus } from "@/lib/plus";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

const STATUS_LABEL: Record<string, string> = {
  done: "Done",
  current: "Write",
  locked: "Locked",
};

const STATUS_BADGE: Record<string, string> = {
  done: "bg-success-bg text-success border-success-line",
  current: "bg-[#FFFBEB] text-amber border-amber-line",
  locked: "bg-warm text-faint border-line",
};

export default async function WritingMapPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, { data: progress }, sp] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, xp, plus_until")
      .eq("id", user.id)
      .single(),
    supabase.from("writing_progress").select("prompt_key, completed_at").eq("user_id", user.id),
    searchParams,
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;
  const chapters = getChaptersForLevel(level);

  const completedKeys = new Set((progress ?? []).map((p) => p.prompt_key));
  const statuses = getChapterStatuses(chapters, completedKeys);
  const doneCount = statuses.filter((s) => s === "done").length;

  // Free plan writes one chapter per UTC day — after today's page, the next
  // one waits for tomorrow (today's own page stays open for re-reading).
  const plus = isPlus(profile?.plus_until);
  const dailyDone = !plus && !!chapterWrittenToday(progress);

  // 160 flat page rows is an endless scroll — group into one collapsible set
  // per genre (a run of consecutive pages sharing a genre), with the set
  // containing the current page open. Inside, a divider every ten.
  const DIVIDER_EVERY = 10;
  const groups: { chapter: (typeof chapters)[number]; status: string; index: number }[][] = [];
  chapters.forEach((chapter, i) => {
    const entry = { chapter, status: statuses[i], index: i };
    const last = groups[groups.length - 1];
    if (last && last[0].chapter[0].genre === chapter[0].genre) last.push(entry);
    else groups.push([entry]);
  });
  const continueIndex = statuses.findIndex((s) => s === "current");
  const openGroupIndex =
    continueIndex >= 0 ? groups.findIndex((g) => g.some((e) => e.index === continueIndex)) : -1;
  const continuePrompt = continueIndex >= 0 ? chapters[continueIndex][0] : null;
  const continueWaitsTomorrow = dailyDone && continueIndex >= 0;

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
            <b className="text-charcoal font-semibold">Writing</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFFBEB] text-amber border border-amber-line items-center justify-center kr text-[15px] mr-[9px]">
                쓰
              </span>
              Writing
            </h1>
            <span className="text-[13px] text-muted">
              Level {level} · write a little, see one natural way to say it
            </span>
          </div>

          <LevelTabs
            className="mb-6"
            levels={LEVEL_ORDER}
            current={level}
            mine={myLevel}
            unlocked={(lv) => isDifficultyUnlocked(lv, myLevel)}
            href={(lv) => `/writing?level=${lv}`}
            accent="bg-amber border-amber text-white"
          />

          {/* progress */}
          <div className="max-w-[720px] mb-6">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-[12.5px] text-muted mb-2">
              <span>
                {doneCount} of {chapters.length} pages written
              </span>
              <span className="text-faint">4 genres · journal, replies, description, opinion</span>
            </div>
            <div className="h-1.5 rounded-full bg-line overflow-hidden">
              <div
                className="h-full rounded-full bg-amber transition-all"
                style={{ width: `${chapters.length ? (doneCount / chapters.length) * 100 : 0}%` }}
              />
            </div>
            {dailyDone && (
              <p className="text-[12.5px] text-muted mt-2.5">
                🌙 Today&apos;s page is written — the next one opens tomorrow.{" "}
                <Link href="/pricing" className="font-semibold text-amber hover:underline">
                  Turn pages freely with Plus →
                </Link>
              </p>
            )}
          </div>

          {/* continue card: one obvious next step above the page groups */}
          {continuePrompt && (
            <Link
              href={`/writing/session?chapter=${continueIndex}&level=${level}`}
              className={`flex items-center gap-3.5 border-[1.5px] rounded-[14px] px-5 py-4 mb-6 max-w-[720px] transition-all ${
                continueWaitsTomorrow
                  ? "border-line bg-warm opacity-70 pointer-events-none"
                  : "border-amber-line bg-[#FFFBEB] hover:-translate-y-0.5 group"
              }`}
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-amber-line flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                {continueWaitsTomorrow ? "🌙" : "✏️"}
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#B45309]">
                  {continueWaitsTomorrow ? "Tomorrow's page" : `Continue · Page ${continueIndex + 1}`}
                </b>
                <span className="text-[13px] text-[#92702B] truncate block">{continuePrompt.prompt_en}</span>
              </span>
              {!continueWaitsTomorrow && (
                <span className="text-[13px] font-semibold text-amber transition-transform group-hover:translate-x-0.5">
                  Write →
                </span>
              )}
            </Link>
          )}

          <div className="grid gap-3 max-w-[720px]">
            {groups.map((group, gi) => {
              const first = group[0].index + 1;
              const last = group[group.length - 1].index + 1;
              const groupDone = group.filter((g) => g.status === "done").length;
              const meta = WRITING_GENRE_META[group[0].chapter[0].genre];
              return (
                <details
                  key={gi}
                  open={gi === openGroupIndex}
                  className="border border-line rounded-[14px] bg-white overflow-hidden"
                >
                  <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-warm transition-colors">
                    <span className="flex-1 min-w-0">
                      <b className="font-bold text-[14.5px]">
                        {meta.icon} {meta.label}
                      </b>
                      <small className="block text-[11.5px] text-faint font-normal truncate">
                        {meta.blurb} · Pages {first}–{last}
                      </small>
                    </span>
                    <span className="flex-none flex items-center gap-2">
                      <span className="w-[74px] h-1.5 rounded-full bg-line overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-amber"
                          style={{ width: `${(groupDone / group.length) * 100}%` }}
                        />
                      </span>
                      <small className="text-[12px] text-muted font-semibold tabular-nums">
                        {groupDone}/{group.length}
                      </small>
                      <span className="text-faint text-[11px]">▾</span>
                    </span>
                  </summary>
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-dashed border-line">
                    <ChapterPathGroup
                      dividerEvery={DIVIDER_EVERY}
                      lineColorClassName="border-amber-line"
                      hoverClassName="hover:bg-[#FFFBEB]"
                      nodes={group.map(({ chapter, status, index: i }) => {
                        const prompt = chapter[0];
                        const waitTomorrow = dailyDone && status === "current";
                        const dim = status === "locked" || waitTomorrow;
                        return {
                          key: i,
                          href: dim ? undefined : `/writing/session?chapter=${i}&level=${level}`,
                          circleClassName:
                            status === "done"
                              ? "bg-success-bg text-success border-success-line"
                              : status === "current"
                              ? "bg-[#FFFBEB] text-amber border-amber-line"
                              : "bg-warm text-faint border-line",
                          ringClassName: status === "current" && !waitTomorrow ? "ring-4 ring-amber-line/60" : undefined,
                          circleContent: status === "done" ? "✓" : i + 1,
                          title: `Page ${i + 1}`,
                          subtitle: prompt.prompt_en,
                          badgeClassName: waitTomorrow ? STATUS_BADGE.locked : STATUS_BADGE[status],
                          badgeLabel: waitTomorrow ? "🌙 Tomorrow" : STATUS_LABEL[status],
                          dim,
                        };
                      })}
                    />
                  </div>
                </details>
              );
            })}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

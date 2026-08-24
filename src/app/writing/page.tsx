import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { chapterWrittenToday, getChapterStatuses, getChaptersForLevel } from "@/lib/writing";
import { isPlus } from "@/lib/plus";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

const STATUS_LABEL: Record<string, string> = {
  done: "Done",
  current: "Write",
  locked: "Locked",
};

const STATUS_BADGE: Record<string, string> = {
  done: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  current: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  locked: "bg-[#FAF7EF] text-[#A19A8C] border-[#E3DDD0]",
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

  // 160 flat page rows is an endless scroll — group into collapsible sets of
  // ten, with the set containing the current page open.
  const GROUP_SIZE = 10;
  const groups: { chapter: (typeof chapters)[number]; status: string; index: number }[][] = [];
  for (let g = 0; g < chapters.length; g += GROUP_SIZE) {
    groups.push(
      chapters.slice(g, g + GROUP_SIZE).map((chapter, gi) => ({
        chapter,
        status: statuses[g + gi],
        index: g + gi,
      }))
    );
  }
  const continueIndex = statuses.findIndex((s) => s === "current");
  const openGroupIndex = continueIndex >= 0 ? Math.floor(continueIndex / GROUP_SIZE) : -1;
  const continuePrompt = continueIndex >= 0 ? chapters[continueIndex][0] : null;
  const continueWaitsTomorrow = dailyDone && continueIndex >= 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Writing</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] items-center justify-center kr text-[15px] mr-[9px]">
                쓰
              </span>
              Writing
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              Level {level} · write a little, see one natural way to say it
            </span>
          </div>

          {/* level tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEVEL_ORDER.map((lv) =>
              isDifficultyUnlocked(lv, myLevel) ? (
                <Link
                  key={lv}
                  href={`/writing?level=${lv}`}
                  className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                    lv === level
                      ? "bg-[#D97706] border-[#D97706] text-white"
                      : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
                  }`}
                >
                  {lv}
                  {lv === myLevel && (
                    <span className="text-[10.5px] font-bold ml-1.5 opacity-85">· your level</span>
                  )}
                </Link>
              ) : (
                <div
                  key={lv}
                  className="rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold border bg-[#FAF7EF] border-[#E3DDD0] text-[#A19A8C] grayscale opacity-60 cursor-not-allowed select-none"
                >
                  🔒 {lv}
                  <span className="text-[10.5px] font-bold ml-1.5">
                    · promotion test
                  </span>
                </div>
              )
            )}
          </div>

          {/* progress */}
          <div className="max-w-[720px] mb-6">
            <div className="flex items-center justify-between text-[12.5px] text-[#6B6560] mb-2">
              <span>
                {doneCount} of {chapters.length} pages written
              </span>
              <span className="text-[#A19A8C]">Chapter · Daily life</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#E3DDD0] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#D97706] transition-all"
                style={{ width: `${chapters.length ? (doneCount / chapters.length) * 100 : 0}%` }}
              />
            </div>
            {dailyDone && (
              <p className="text-[12.5px] text-[#6B6560] mt-2.5">
                🌙 Today&apos;s page is written — the next one opens tomorrow.{" "}
                <Link href="/pricing" className="font-semibold text-[#D97706] hover:underline">
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
                  ? "border-[#E3DDD0] bg-[#FAF7EF] opacity-70 pointer-events-none"
                  : "border-[#FDE68A] bg-[#FFFBEB] hover:-translate-y-0.5 group"
              }`}
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#FDE68A] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                {continueWaitsTomorrow ? "🌙" : "✏️"}
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#B45309]">
                  {continueWaitsTomorrow ? "Tomorrow's page" : `Continue · Page ${continueIndex + 1}`}
                </b>
                <span className="text-[13px] text-[#92702B] truncate block">{continuePrompt.prompt_en}</span>
              </span>
              {!continueWaitsTomorrow && (
                <span className="text-[13px] font-semibold text-[#D97706] transition-transform group-hover:translate-x-0.5">
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
              return (
                <details
                  key={gi}
                  open={gi === openGroupIndex}
                  className="border border-[#E3DDD0] rounded-[14px] bg-white overflow-hidden"
                >
                  <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-[#FAF7EF] transition-colors">
                    <b className="flex-1 font-bold text-[14.5px]">
                      Pages {first}–{last}
                    </b>
                    <span className="flex-none flex items-center gap-2">
                      <span className="w-[74px] h-1.5 rounded-full bg-[#E3DDD0] overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-[#D97706]"
                          style={{ width: `${(groupDone / group.length) * 100}%` }}
                        />
                      </span>
                      <small className="text-[12px] text-[#6B6560] font-semibold tabular-nums">
                        {groupDone}/{group.length}
                      </small>
                      <span className="text-[#A19A8C] text-[11px]">▾</span>
                    </span>
                  </summary>
                  <div className="grid gap-2.5 px-3.5 pb-3.5 pt-1 border-t border-dashed border-[#E3DDD0]">
                    {group.map(({ chapter, status, index: i }) => {
                      const prompt = chapter[0];
                      const waitTomorrow = dailyDone && status === "current";
                      const content = (
                        <>
                          <span
                            className={`w-[34px] h-[34px] rounded-[10px] flex-none flex items-center justify-center text-[12.5px] font-bold border ${
                              status === "done"
                                ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                                : status === "current"
                                ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                                : "bg-[#FAF7EF] text-[#A19A8C] border-[#E3DDD0]"
                            }`}
                          >
                            {status === "done" ? "✓" : i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <b className="block font-semibold text-[13.5px]">Page {i + 1}</b>
                            <small className="block text-[12px] text-[#6B6560] leading-[1.5] truncate">
                              {prompt.prompt_en}
                            </small>
                          </div>
                          <span
                            className={`text-[11px] font-semibold rounded-full border px-2.5 py-[3px] flex-none ${
                              waitTomorrow ? STATUS_BADGE.locked : STATUS_BADGE[status]
                            }`}
                          >
                            {waitTomorrow ? "🌙 Tomorrow" : STATUS_LABEL[status]}
                          </span>
                        </>
                      );

                      return status === "locked" || waitTomorrow ? (
                        <div
                          key={i}
                          className="border border-[#E3DDD0] rounded-[10px] bg-[#FAF7EF] px-3 py-2.5 flex items-center gap-3 opacity-70"
                        >
                          {content}
                        </div>
                      ) : (
                        <Link
                          key={i}
                          href={`/writing/session?chapter=${i}&level=${level}`}
                          className="border border-[#F5F1E8] rounded-[10px] bg-white px-3 py-2.5 flex items-center gap-3 transition-all duration-150 hover:border-[#D97706] hover:bg-[#FFFBEB]"
                        >
                          {content}
                        </Link>
                      );
                    })}
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

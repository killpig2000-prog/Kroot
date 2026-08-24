import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChapterStatuses, getChaptersForLevel } from "@/lib/reading";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

const STATUS_STYLE: Record<string, { badge: string; seed: string; icon: string }> = {
  done: {
    badge: "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]",
    seed: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
    icon: "✅",
  },
  current: {
    badge: "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]",
    seed: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    icon: "📖",
  },
  locked: {
    badge: "text-[#A19A8C] bg-[#FAF7EF] border-[#E3DDD0]",
    seed: "bg-[#FAF7EF] text-[#A19A8C] border-[#E3DDD0]",
    icon: "🔒",
  },
};

export default async function ReadingMapPage({
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
      .select("display_name, current_level, streak_days, avatar_url, xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("reading_progress")
      .select("passage_key")
      .eq("user_id", user.id)
      .not("last_reviewed_at", "is", null),
    searchParams,
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;
  const chapters = getChaptersForLevel(level);

  const completedKeys = new Set((progress ?? []).map((p) => p.passage_key));
  const statuses = getChapterStatuses(chapters, completedKeys);
  const doneCount = statuses.filter((s) => s === "done").length;

  // 160 flat chapter rows is an endless scroll — group into collapsible sets
  // of ten, with the set containing the current chapter open.
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
  const continueChapter = continueIndex >= 0 ? chapters[continueIndex][0] : null;

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
            <b className="text-[#18181B] font-semibold">Reading</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] items-center justify-center kr text-[15px] mr-[9px]">
                읽
              </span>
              Story Grove
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              Level {level} · <b className="text-[#2563EB]">{doneCount}</b> of {chapters.length} chapters read
            </span>
          </div>

          <p className="text-[13px] text-[#6B6560] mb-6">
            Read the story, then answer the questions — finishing chapters keeps the next few open.
          </p>

          {/* level tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEVEL_ORDER.map((lv) =>
              isDifficultyUnlocked(lv, myLevel) ? (
                <Link
                  key={lv}
                  href={`/reading?level=${lv}`}
                  className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                    lv === level
                      ? "bg-[#2563EB] border-[#2563EB] text-white"
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

          {/* continue card: one obvious next step above the chapter groups */}
          {continueChapter && (
            <Link
              href={`/reading/session?chapter=${continueIndex}&level=${level}`}
              className="flex items-center gap-3.5 border-[1.5px] border-[#BFDBFE] bg-[#EFF6FF] rounded-[14px] px-5 py-4 mb-6 max-w-[720px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#BFDBFE] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                📖
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#1D4ED8]">
                  Continue · Chapter {continueIndex + 1}
                </b>
                <span className="kr text-[13px] text-[#3B82F6] truncate block">{continueChapter.title_kr}</span>
              </span>
              <span className="text-[13px] font-semibold text-[#2563EB] transition-transform group-hover:translate-x-0.5">
                Start →
              </span>
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
                      Chapters {first}–{last}
                    </b>
                    <span className="flex-none flex items-center gap-2">
                      <span className="w-[74px] h-1.5 rounded-full bg-[#E3DDD0] overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-[#2563EB]"
                          style={{ width: `${(groupDone / group.length) * 100}%` }}
                        />
                      </span>
                      <small className="text-[12px] text-[#6B6560] font-semibold tabular-nums">
                        {groupDone}/{group.length}
                      </small>
                      <span className="text-[#A19A8C] text-[11px]">▾</span>
                    </span>
                  </summary>
                  <div className="grid px-3.5 pb-3.5 pt-1 border-t border-dashed border-[#E3DDD0]">
                    {group.map(({ chapter, status, index: i }) => {
                      const passage = chapter[0];
                      const style = STATUS_STYLE[status];
                      const rowClass =
                        "w-full flex items-center gap-3 text-left bg-white rounded-[10px] px-3 py-2.5 mt-2.5 transition-colors group border border-[#F5F1E8]";
                      const content = (
                        <>
                          <span
                            className={`w-8 h-8 rounded-[9px] flex-none flex items-center justify-center text-[13px] border transition-transform group-hover:scale-110 ${style.seed}`}
                          >
                            {style.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <b className="block font-semibold text-[13.5px]">Chapter {i + 1}</b>
                            <small className="block kr text-[12px] text-[#6B6560] truncate">
                              {passage.title_kr}
                            </small>
                          </span>
                          <span
                            className={`text-[11px] font-semibold rounded-md px-2 py-0.5 border ${style.badge}`}
                          >
                            {status === "done" ? "Done" : status === "current" ? "Read" : "Locked"}
                          </span>
                        </>
                      );

                      return status === "locked" ? (
                        <div key={i} className={`${rowClass} opacity-60`}>
                          {content}
                        </div>
                      ) : (
                        <Link
                          key={i}
                          href={`/reading/session?chapter=${i}&level=${level}`}
                          className={`${rowClass} hover:bg-[#EFF6FF] hover:border-[#BFDBFE]`}
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

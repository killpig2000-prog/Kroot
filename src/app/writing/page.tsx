import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { getChapterStatuses, getChaptersForLevel } from "@/lib/writing";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { DIFFICULTY_UNLOCK_LEVEL, isDifficultyUnlocked, levelFromXp } from "@/lib/level";

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
  locked: "bg-[#FAFAF9] text-[#A1A1AA] border-[#E7E5E4]",
};

export default async function WritingMapPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url, xp")
    .eq("id", user.id)
    .single();

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const playerLevel = levelFromXp(profile?.xp ?? 0);
  const sp = await searchParams;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, playerLevel, myLevel) ? requested : myLevel;
  const chapters = getChaptersForLevel(level);

  const { data: progress } = await supabase
    .from("writing_progress")
    .select("prompt_key")
    .eq("user_id", user.id);

  const completedKeys = new Set((progress ?? []).map((p) => p.prompt_key));
  const statuses = getChapterStatuses(chapters, completedKeys);
  const doneCount = statuses.filter((s) => s === "done").length;

  return (
    <div className="min-h-screen bg-white text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A1A1AA] mb-[18px]">
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
            <span className="text-[13px] text-[#71717A]">
              Level {level} · write a little, see one natural way to say it
            </span>
          </div>

          {/* level tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEVEL_ORDER.map((lv) =>
              isDifficultyUnlocked(lv, playerLevel, myLevel) ? (
                <Link
                  key={lv}
                  href={`/writing?level=${lv}`}
                  className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                    lv === level
                      ? "bg-[#D97706] border-[#D97706] text-white"
                      : "bg-white border-[#E7E5E4] text-[#71717A] hover:border-[#A1A1AA]"
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
                  className="rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold border bg-[#FAFAF9] border-[#E7E5E4] text-[#A1A1AA] grayscale opacity-60 cursor-not-allowed select-none"
                >
                  🔒 {lv}
                  <span className="text-[10.5px] font-bold ml-1.5">
                    · Lv. {DIFFICULTY_UNLOCK_LEVEL[lv]}
                  </span>
                </div>
              )
            )}
          </div>

          {/* progress */}
          <div className="max-w-[720px] mb-6">
            <div className="flex items-center justify-between text-[12.5px] text-[#71717A] mb-2">
              <span>
                {doneCount} of {chapters.length} pages written
              </span>
              <span className="text-[#A1A1AA]">Chapter · Daily life</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#E7E5E4] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#D97706] transition-all"
                style={{ width: `${chapters.length ? (doneCount / chapters.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* chapter list */}
          <div className="grid gap-2.5 max-w-[720px]">
            {chapters.map((chapter, i) => {
              const prompt = chapter[0];
              const status = statuses[i];
              const content = (
                <>
                  <span
                    className={`w-[38px] h-[38px] rounded-[10px] flex-none flex items-center justify-center text-[13px] font-bold border ${
                      status === "done"
                        ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                        : status === "current"
                        ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                        : "bg-[#FAFAF9] text-[#A1A1AA] border-[#E7E5E4]"
                    }`}
                  >
                    {status === "done" ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block font-semibold text-[14.5px]">Page {i + 1}</b>
                    <small className="block text-[12.5px] text-[#71717A] leading-[1.5] truncate">
                      {prompt.prompt_en}
                    </small>
                  </div>
                  <span
                    className={`text-[11.5px] font-semibold rounded-full border px-2.5 py-[3px] flex-none ${STATUS_BADGE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                </>
              );

              return status === "locked" ? (
                <div
                  key={i}
                  className="border border-[#E7E5E4] rounded-[14px] bg-[#FAFAF9] px-[18px] py-3.5 flex items-center gap-3.5 opacity-70"
                >
                  {content}
                </div>
              ) : (
                <Link
                  key={i}
                  href={`/writing/session?chapter=${i}&level=${level}`}
                  className="border border-[#E7E5E4] rounded-[14px] bg-white px-[18px] py-3.5 flex items-center gap-3.5 transition-all duration-150 hover:border-[#D97706] hover:bg-[#FFFBEB] hover:-translate-y-0.5"
                >
                  {content}
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

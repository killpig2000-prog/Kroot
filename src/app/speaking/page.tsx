import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import SpeakingSession from "@/components/speaking/SpeakingSession";
import { createClient } from "@/lib/supabase/server";
import { promptsFor } from "@/lib/speaking";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

export default async function SpeakingPage({
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
  const sp = await searchParams;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;
  const count = promptsFor(level).length;

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
            <b className="text-[#18181B] font-semibold">Speaking</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] items-center justify-center kr text-[15px] mr-[9px]">
                말
              </span>
              Speaking
            </h1>
            <span className="text-[13px] text-[#71717A]">
              Read the English, say it in Korean — out loud
            </span>
          </div>

          {/* level tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEVEL_ORDER.map((lv) =>
              isDifficultyUnlocked(lv, myLevel) ? (
                <Link
                  key={lv}
                  href={`/speaking?level=${lv}`}
                  className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                    lv === level
                      ? "bg-[#E11D48] border-[#E11D48] text-white"
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
                    · promotion test
                  </span>
                </div>
              )
            )}
          </div>

          <p className="text-[12.5px] text-[#A1A1AA] mb-4 max-w-[680px]">
            {count > 0
              ? `${count} prompt${count > 1 ? "s" : ""} at ${level} · about 5 minutes`
              : `Nothing planted at ${level} yet`}
          </p>

          <SpeakingSession key={level} level={level} userId={user.id} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

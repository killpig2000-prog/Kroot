import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LeagueBoard from "@/components/league/LeagueBoard";
import { createClient } from "@/lib/supabase/server";

// Weekly XP league within the user's CEFR grade.
export default async function LeaguePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url, current_level")
    .eq("id", user.id)
    .single();

  const grade = profile?.current_level ?? "A1";

  return (
    <div className="min-h-screen bg-white text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[720px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A1A1AA] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">League</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFFBEB] border border-[#FDE68A] items-center justify-center text-[15px] mr-[9px]">
                🏆
              </span>
              {grade} League
            </h1>
            <span className="text-[13px] text-[#71717A]">
              Weekly XP ranking · resets Monday ·{" "}
              <Link href="/level-test" className="font-semibold text-[#16A34A] hover:underline">
                Level-up test →
              </Link>
            </span>
          </div>

          <LeagueBoard grade={grade} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

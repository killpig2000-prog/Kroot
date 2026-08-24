import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import SlangBoard from "@/components/slang/SlangBoard";
import SlangHero from "@/components/slang/SlangHero";
import SlangQuiz from "@/components/slang/SlangQuiz";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { SLANG, slangOfTheDay } from "@/lib/slang";

export default async function SlangPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const daily = slangOfTheDay();

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
            <b className="text-[#18181B] font-semibold">Slang</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FDF2F8] text-[#DB2777] border border-[#FBCFE8] items-center justify-center kr text-[15px] mr-[9px]">
                슬
              </span>
              Slang
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              The words textbooks skip — straight from K-dramas, K-pop, and group chats
            </span>
          </div>

          <SlangHero entry={daily} />
          <SlangQuiz />
          <SlangBoard entries={SLANG} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

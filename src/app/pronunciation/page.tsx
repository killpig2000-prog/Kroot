import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import PronunciationBoard from "@/components/pronunciation/PronunciationBoard";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { SOUND_GROUPS } from "@/lib/pronunciation";

export default async function PronunciationPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const wordCount = SOUND_GROUPS.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#18181B]">
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
            <b className="text-[#18181B] font-semibold">Pronunciation</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] items-center justify-center kr text-[15px] mr-[9px]">
                발
              </span>
              Pronunciation
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              {SOUND_GROUPS.length} sound groups · {wordCount} words to drill
            </span>
          </div>

          <p className="text-[12.5px] text-[#A19A8C] mb-5 max-w-[680px] leading-[1.6]">
            Open a group, read the tip, then hit 🔊 to hear it and 🎤 to say it back. Your first
            recording counts today&apos;s practice toward your tree — drill as long as you like.
          </p>

          <PronunciationBoard />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

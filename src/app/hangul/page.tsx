import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import HangulExplorer from "@/components/hangul/HangulExplorer";
import { createClient, getClaimsUser } from "@/lib/supabase/server";

export default async function HangulPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

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
            <b className="text-charcoal font-semibold">Hangul</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center kr text-[15px] mr-[9px]">
                ㄱ
              </span>
              Hangul
            </h1>
            <span className="text-[13px] text-muted">
              Tap any letter to hear it — 한글 takes about an hour to learn
            </span>
          </div>

          {/* intro */}
          <div className="max-w-[820px] bg-success-bg border border-success-line rounded-[14px] px-[18px] py-4 mb-6">
            <p className="text-[13.5px] text-charcoal leading-[1.65]">
              한글 was invented in 1443 to be learned quickly, and it works. There are{" "}
              <b>24 basic letters</b>, each one always makes the same sound, and they stack into neat
              syllable blocks. Start with the consonants, then the vowels, then build a few blocks
              yourself.
            </p>
          </div>

          <HangulExplorer />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

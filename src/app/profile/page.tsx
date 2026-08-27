import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import AvatarUploader from "@/components/profile/AvatarUploader";
import InsightsSection from "@/components/profile/InsightsSection";
import ManageSubscriptionButton from "@/components/plus/ManageSubscriptionButton";
import NameEditor from "@/components/profile/NameEditor";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_PATH, SPECIES, type CefrLevel } from "@/lib/tree";
import { levelProgress, treeStageForLevel, MAX_LEVEL } from "@/lib/level";
import { isPlus } from "@/lib/plus";

// Slimmed to an account page (2026-08): grass, costume, learning progress,
// and the promotion card all merged into the Garden (/dashboard); the league
// rail has its own page. What remains is identity, Plus, and insights.
export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, created_at, avatar_url, coins, xp, plus_until")
    .eq("id", user.id)
    .single();

  const level = (profile?.current_level ?? "A1") as CefrLevel;
  const plusActive = isPlus(profile?.plus_until);

  const xp = profile?.xp ?? 0;
  const { level: playerLevel, into, needed, pct } = levelProgress(xp);
  const treeStage = LEVEL_PATH[treeStageForLevel(playerLevel)];
  const atMaxLevel = playerLevel >= MAX_LEVEL;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          plus={plusActive}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">My account</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center kr text-[15px] mr-[9px]">
                나
              </span>
              My account
            </h1>
          </div>

          {/* grid-cols-1 pins the track to minmax(0,1fr); a bare auto track
              grows to the widest card's max-content and overflows on mobile */}
          <div className="max-w-[820px] grid grid-cols-1 gap-3.5">
            {/* identity card */}
            <div className="border border-line rounded-[14px] px-[22px] py-5 flex items-center gap-4 flex-wrap">
              <AvatarUploader userId={user.id} avatarUrl={profile?.avatar_url ?? null} />
              <div className="flex-1 min-w-[180px]">
                <b className="font-semibold text-base flex items-center gap-2">
                  <NameEditor userId={user.id} name={profile?.display_name ?? "Learner"} />
                  {plusActive && (
                    <span className="text-[10.5px] font-bold tracking-[.04em] text-[#92400E] bg-[#FFFBEB] border border-amber-line rounded-md px-1.5 py-0.5">
                      🌟 PLUS
                    </span>
                  )}
                </b>
                <span className="text-[13px] text-muted">
                  {SPECIES[level].name} {SPECIES[level].emoji} · {treeStage.treeName} · Lv. {playerLevel} · {level} difficulty · growing since{" "}
                  {memberSince}
                </span>
                <div className="mt-2 max-w-[280px]">
                  <div className="h-[6px] rounded-full bg-success-bg border border-success-line overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  <small className="block mt-1 text-[12px] text-muted">
                    {atMaxLevel ? "Reached the stars 🌟" : `${into}/${needed} XP to Lv. ${playerLevel + 1}`}
                  </small>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-[12.5px] font-semibold text-success bg-success-bg border border-success-line rounded-full px-3 py-1">
                  🔥 {profile?.streak_days ?? 0} day streak
                </span>
                <span className="text-[12.5px] font-semibold text-muted bg-warm border border-line rounded-full px-3 py-1">
                  🌰 {profile?.coins ?? 0} coins
                </span>
              </div>
            </div>

            {plusActive ? (
              <div className="flex items-center justify-end gap-3 -mt-2">
                <span className="text-[12px] text-faint">
                  🌟 Kroot Plus active — cancel or switch plans anytime.
                </span>
                <ManageSubscriptionButton />
              </div>
            ) : (
              <div className="border border-amber-line bg-[#FFFBEB] rounded-[14px] px-[22px] py-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <b className="font-semibold text-[14.5px] block mb-0.5">🌟 Kroot Plus</b>
                  <span className="text-[13px] text-muted">
                    Streak shield, weekend XP boost, unlimited AI grading, insights & exclusive
                    outfits — every lesson stays free.
                  </span>
                </div>
                <Link
                  href="/pricing"
                  className="rounded-[9px] bg-success px-4 py-2 text-[13px] font-bold text-white hover:bg-success-deep transition-colors"
                >
                  See plans →
                </Link>
              </div>
            )}

            <InsightsSection userId={user.id} plusActive={plusActive} />

            {/* where did everything go? a gentle pointer for regulars */}
            <p className="text-[12.5px] text-faint">
              Looking for your grass, costume, or progress? They now live in your{" "}
              <Link href="/dashboard" className="font-semibold text-success hover:underline">
                Garden →
              </Link>
            </p>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

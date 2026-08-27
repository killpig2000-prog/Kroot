import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ShopClient from "@/components/shop/ShopClient";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import type { CefrLevel } from "@/lib/tree";
import { levelFromXp, treeStageForLevel } from "@/lib/level";
import { isPlus } from "@/lib/plus";

export default async function ShopPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, { data: costumeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, coins, xp, current_level, streak_days, avatar_url, plus_until, is_admin")
      .eq("id", user.id)
      .single(),
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
  ]);
  const hasPlus = isPlus(profile?.plus_until);
  const owned = (costumeRows ?? []).map((r) => r.costume_id);
  const equipped = (costumeRows ?? []).filter((r) => r.equipped).map((r) => r.costume_id);

  const isAdmin = profile?.is_admin ?? false;
  const coins = profile?.coins ?? 0;
  const species = (profile?.current_level ?? "A1") as CefrLevel;
  const playerLevel = levelFromXp(profile?.xp ?? 0);
  const stage = treeStageForLevel(playerLevel);
  const today = new Date().toISOString().slice(0, 10);

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
            <b className="text-[#18181B] font-semibold">Shop</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap max-w-[1040px]">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] items-center justify-center kr text-[15px] mr-[9px]">
                정
              </span>
              Garden Shop
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1">
                🌰 {isAdmin ? "∞" : coins} coins
              </span>
              {hasPlus ? (
                <span className="text-[12.5px] font-semibold text-[#B7791F] bg-[#FFF8E6] border border-[#F3D98A] rounded-full px-3 py-1">
                  🌟 Plus
                </span>
              ) : (
                <Link
                  href="/pricing"
                  className="text-[12.5px] font-semibold text-[#B7791F] bg-[#FFF8E6] border border-[#F3D98A] rounded-full px-3 py-1 hover:border-[#B7791F] transition-colors"
                >
                  🌟 Plus wardrobe →
                </Link>
              )}
            </div>
          </div>

          <p className="text-[13px] text-[#6B6560] mb-5 max-w-[70ch]">
            Dress your tree and the garden around it. Tap a card to try it on your own tree, then buy and wear it right here.
          </p>

          <ShopClient
            userId={user.id}
            coins={coins}
            isAdmin={isAdmin}
            playerLevel={playerLevel}
            hasPlus={hasPlus}
            species={species}
            stage={stage}
            owned={owned}
            equipped={equipped}
            today={today}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

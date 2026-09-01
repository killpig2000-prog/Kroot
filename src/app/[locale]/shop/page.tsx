import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ShopClient from "@/components/shop/ShopClient";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import type { CefrLevel } from "@/lib/tree";
import { levelFromXp, treeStageForLevel } from "@/lib/level";

export default async function ShopPage() {
  const tn = await getTranslations("nav");
  const t = await getTranslations("shop");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, { data: costumeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, coins, xp, current_level, streak_days, avatar_url, is_admin")
      .eq("id", user.id)
      .single(),
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
  ]);
  const owned = (costumeRows ?? []).map((r) => r.costume_id);
  const equipped = (costumeRows ?? []).filter((r) => r.equipped).map((r) => r.costume_id);

  const isAdmin = profile?.is_admin ?? false;
  const coins = profile?.coins ?? 0;
  const species = (profile?.current_level ?? "A1") as CefrLevel;
  const playerLevel = levelFromXp(profile?.xp ?? 0);
  const stage = treeStageForLevel(playerLevel);
  const today = new Date().toISOString().slice(0, 10);
  // Today's quest row (created by the dashboard on first visit; absent = not done).
  const { data: quest } = await supabase
    .from("daily_quests")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("quest_date", today)
    .maybeSingle();
  const questDone = !!quest?.completed_at;

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
              {tn("garden")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{tn("shop")}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap max-w-[1040px]">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-success-bg text-success border border-success-line items-center justify-center kr text-[15px] mr-[9px]">
                정
              </span>
              {tn("gardenShop")}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] font-semibold text-success bg-success-bg border border-success-line rounded-full px-3 py-1">
                {t("coins", { coins: isAdmin ? "∞" : String(coins) })}
              </span>
            </div>
          </div>

          <ShopClient
            userId={user.id}
            coins={coins}
            isAdmin={isAdmin}
            playerLevel={playerLevel}
            species={species}
            stage={stage}
            owned={owned}
            equipped={equipped}
            today={today}
            questDone={questDone}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

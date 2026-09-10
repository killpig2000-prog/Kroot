import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import RankingBoard from "@/components/ranking/RankingBoard";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// The ranking: everyone, by total XP (2026-09-10; migration 0080's RPCs).
// This shell only paints the page chrome — the board is the client component.
export default async function RankingPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url, current_level")
    .eq("id", user.id)
    .single();

  const grade = profile?.current_level ?? "A1";
  const species = (LEVEL_ORDER as readonly string[]).includes(grade) ? (grade as CefrLevel) : "A1";

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">
          <RankingBoard species={species} />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

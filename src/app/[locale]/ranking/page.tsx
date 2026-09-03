import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import RankingBoard from "@/components/ranking/RankingBoard";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// Weekly "garden fair": everyone in the learner's tier (a "bed") ranked by XP
// earned this week. Reads go through the migration 0026 RPCs from the client
// component; this shell only paints the page chrome.
export default async function RankingPage() {
  const [tn, t] = await Promise.all([getTranslations("nav"), getTranslations("ranking")]);
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
            <b className="text-charcoal font-semibold">{t("title")}</b>
          </div>

          <RankingBoard species={species} />
        </main>
      </div>
      <BottomNav streakDays={profile?.streak_days ?? 0} />
    </div>
  );
}

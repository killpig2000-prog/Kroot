import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import RoleplayChat from "@/components/roleplay/RoleplayChat";
import RoleplayPicker from "@/components/roleplay/RoleplayPicker";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { SCENARIOS, scenarioByKey } from "@/lib/roleplay";
import type { CefrLevel } from "@/lib/tree";

export default async function RoleplayPage({
  searchParams,
}: {
  searchParams: Promise<{ situation?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url, current_level")
    .eq("id", user.id)
    .single();

  const level = (profile?.current_level ?? "A1") as CefrLevel;

  const sp = await searchParams;
  const scenario = sp.situation ? scenarioByKey(sp.situation) : undefined;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
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
            {scenario ? (
              <>
                <Link href="/roleplay" className="hover:text-charcoal transition-colors">
                  Roleplay
                </Link>
                <span>/</span>
                <b className="text-charcoal font-semibold">{scenario.title}</b>
              </>
            ) : (
              <b className="text-charcoal font-semibold">Roleplay</b>
            )}
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] items-center justify-center text-[15px] mr-[9px]">
                🗣️
              </span>
              Roleplay
            </h1>
            <span className="text-[13px] text-muted">
              {scenario
                ? `${scenario.icon} ${scenario.title} · ${level}`
                : `Talk your way through real situations · ${SCENARIOS.length} scenarios`}
            </span>
          </div>

          {scenario ? (
            <RoleplayChat key={scenario.key} scenarioKey={scenario.key} level={level} userId={user.id} />
          ) : (
            <RoleplayPicker level={level} />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

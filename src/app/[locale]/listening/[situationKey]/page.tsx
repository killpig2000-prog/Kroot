import { Link } from "@/i18n/navigation";
import LevelTabs from "@/components/ui/LevelTabs";
import { redirect } from "next/navigation";
import { Link, redirect, useRouter, usePathname, getPathname } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ListeningSession from "@/components/listening/ListeningSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { situationByKey } from "@/lib/listening";
import { dialoguesFor } from "@/lib/listening-dialogues";

export default async function SituationPage({
  params,
  searchParams,
}: {
  params: Promise<{ situationKey: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { situationKey } = await params;
  const sp = await searchParams;
  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const situation = situationByKey(situationKey);
  const dialogues = dialoguesFor(level, situationKey);

  let completedIds: string[] = [];
  if (dialogues.length > 0) {
    const { data: progressRows } = await supabase
      .from("listening_progress")
      .select("dialogue_id, completed_at")
      .eq("user_id", user.id)
      .in(
        "dialogue_id",
        dialogues.map((d) => d.id)
      );
    completedIds = (progressRows ?? []).filter((p) => p.completed_at).map((p) => p.dialogue_id);
  }

  const label = situation?.label ?? situationKey;

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
          <div className="flex gap-2 text-[13px] text-faint mb-[18px] flex-wrap">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <Link href={`/listening?level=${level}`} className="hover:text-charcoal transition-colors">
              Listening
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{label}</b>
          </div>

          {/* Head + level tabs live inside the session so they can collapse to
              one line while a clip is open — the player then starts at the
              top of the viewport instead of two screens down on a phone. */}
          {(() => {
            const header = (
              <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
                <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
                  <Link
                    href={`/listening?level=${level}`}
                    aria-label="Back to all situations"
                    className="inline-flex w-[30px] h-[30px] rounded-lg bg-white text-muted border border-line items-center justify-center text-[15px] mr-[9px] transition-colors hover:border-teal hover:text-teal"
                  >
                    ←
                  </Link>
                  <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDFA] text-teal border border-[#99F6E4] items-center justify-center text-[15px] mr-[9px]">
                    {situation?.icon ?? "🎧"}
                  </span>
                  {label}
                </h1>
                <span className="text-[13px] text-muted">
                  {dialogues.length > 0 && (
                    <>
                      <b className="text-teal">{completedIds.length}</b> of {dialogues.length} clips heard
                    </>
                  )}
                </span>
              </div>
            );
            const levelTabs = (
              <LevelTabs
                className="mb-6"
                levels={LEVEL_ORDER}
                current={level}
                mine={myLevel}
                unlocked={() => true}
                href={(lv) => `/listening/${situationKey}?level=${lv}`}
                accent="bg-teal border-teal text-white"
              />
            );
            if (dialogues.length === 0) {
              return (
                <>
                  {header}
                  {levelTabs}
                  <div className="max-w-[680px] border border-line rounded-[14px] p-8 text-center">
                    <p className="text-sm text-muted">
                      No dialogues for this level yet — try another level above.
                    </p>
                  </div>
                </>
              );
            }
            return (
              <ListeningSession
                key={level}
                dialogues={dialogues}
                level={level}
                situationLabel={label}
                situationIcon={situation?.icon ?? "🎧"}
                completedIds={completedIds}
                header={header}
                levelTabs={levelTabs}
              />
            );
          })()}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

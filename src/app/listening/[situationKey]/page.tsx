import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ListeningSession from "@/components/listening/ListeningSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { situationByKey } from "@/lib/listening";
import { dialoguesFor } from "@/lib/listening-dialogues";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

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
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px] flex-wrap">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <Link href={`/listening?level=${level}`} className="hover:text-[#18181B] transition-colors">
              Listening
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">{label}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] items-center justify-center text-[15px] mr-[9px]">
                {situation?.icon ?? "🎧"}
              </span>
              {label}
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              {dialogues.length > 0 && (
                <>
                  <b className="text-[#0D9488]">{completedIds.length}</b> of {dialogues.length} clips heard
                </>
              )}
            </span>
          </div>

          {/* level tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEVEL_ORDER.map((lv) => (
              <Link
                key={lv}
                href={`/listening/${situationKey}?level=${lv}`}
                className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                  lv === level
                    ? "bg-[#0D9488] border-[#0D9488] text-white"
                    : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
                }`}
              >
                {lv}
                {lv === myLevel && (
                  <span className="text-[10.5px] font-bold ml-1.5 opacity-85">· your level</span>
                )}
              </Link>
            ))}
          </div>

          {dialogues.length === 0 ? (
            <div className="max-w-[680px] border border-[#E3DDD0] rounded-[14px] p-8 text-center">
              <p className="text-sm text-[#6B6560]">
                No dialogues for this level yet — try another level above.
              </p>
            </div>
          ) : (
            <ListeningSession
              key={level}
              dialogues={dialogues}
              level={level}
              situationLabel={label}
              completedIds={completedIds}
            />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

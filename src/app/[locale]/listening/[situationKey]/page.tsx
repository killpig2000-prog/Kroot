import LevelTabs from "@/components/ui/LevelTabs";
import { Link, redirect } from "@/i18n/navigation";
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
  params: Promise<{ locale: string; situationKey: string }>;
  searchParams: Promise<{ level?: string; clip?: string }>;
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
  // `?clip=` opens the player straight away (Continue hero, dashboard resume).
  const initialOpenId = sp.clip && dialogues.some((d) => d.id === sp.clip) ? sp.clip : null;

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

  const meta = situation ?? {
    key: situationKey,
    label: situationKey,
    krLabel: "",
    icon: "🎧",
    sub: "",
    tint: "#EFE9DC",
  };

  const levelTabs = (
    <LevelTabs
      className="mb-5"
      levels={LEVEL_ORDER}
      current={level}
      mine={myLevel}
      unlocked={() => true}
      href={(lv) => `/listening/${situationKey}?level=${lv}`}
      accent="bg-teal border-teal text-white"
    />
  );

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
            <b className="text-charcoal font-semibold">{meta.label}</b>
          </div>

          {dialogues.length === 0 ? (
            <>
              {levelTabs}
              <div className="max-w-[720px] border border-line rounded-[14px] p-8 text-center bg-cream">
                <p className="text-sm text-muted">No clips for this level yet — try another level above.</p>
              </div>
            </>
          ) : (
            <ListeningSession
              key={level}
              dialogues={dialogues}
              level={level}
              situation={meta}
              completedIds={completedIds}
              initialOpenId={initialOpenId}
              userId={user.id}
              levelTabs={levelTabs}
            />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

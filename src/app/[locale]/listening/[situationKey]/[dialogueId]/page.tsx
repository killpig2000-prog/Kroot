import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import DialoguePlayer from "@/components/listening/DialoguePlayer";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { situationByKey } from "@/lib/listening";
import { dialogueById } from "@/lib/listening-dialogues";
import { fetchUnsplashImage } from "@/lib/unsplash";

export default async function DialoguePage({
  params,
}: {
  params: Promise<{ situationKey: string; dialogueId: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { situationKey, dialogueId } = await params;
  const dialogue = dialogueById(dialogueId);
  if (!dialogue || dialogue.situationKey !== situationKey) notFound();

  const situation = situationByKey(situationKey);
  const photoUrl = situation ? await fetchUnsplashImage(situation.photoQuery) : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: progress } = await supabase
    .from("listening_progress")
    .select("completed_at")
    .eq("user_id", user.id)
    .eq("dialogue_id", dialogueId)
    .maybeSingle();

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
            <Link href={`/listening?level=${dialogue.level}`} className="hover:text-charcoal transition-colors">
              Listening
            </Link>
            <span>/</span>
            <Link
              href={`/listening/${situationKey}?level=${dialogue.level}`}
              className="hover:text-charcoal transition-colors"
            >
              {situation?.label ?? situationKey}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{dialogue.title}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDFA] text-teal border border-[#99F6E4] items-center justify-center text-[15px] mr-[9px]">
                {situation?.icon ?? "🎧"}
              </span>
              {dialogue.title}
            </h1>
            <span className="text-[13px] text-muted">
              <span className="kr">{situation?.krLabel}</span> · Level {dialogue.level}
            </span>
          </div>

          <DialoguePlayer
            dialogueId={dialogue.id}
            lines={dialogue.lines}
            completed={!!progress?.completed_at}
            showTranslation={false}
            photoUrl={photoUrl}
            userId={user.id}
            title={dialogue.title}
            subtitle={`Listening · ${situation?.label ?? situationKey} · ${dialogue.level}`}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

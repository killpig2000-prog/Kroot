import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WritingSession, { WritingEmpty } from "@/components/writing/WritingSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChaptersForLevel } from "@/lib/writing";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";
import { levelProgress, treeStageForLevel } from "@/lib/level";

export default async function WritingChapterSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; level?: string }>;
}) {
  const sp = await searchParams;
  const chapterIndex = Number(sp.chapter ?? 0);

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, { data: costumeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, xp")
      .eq("id", user.id)
      .single(),
    supabase.from("user_costumes").select("costume_id").eq("user_id", user.id).eq("equipped", true),
  ]);

  const equippedIds = (costumeRows ?? []).map((r) => r.costume_id);
  const treeStage = treeStageForLevel(levelProgress(profile?.xp ?? 0).level);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForLevel(level);
  const prompts = chapters[chapterIndex];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

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
            <Link href={`/writing?level=${level}`} className="hover:text-charcoal transition-colors">
              Writing
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Chapter {chapterIndex + 1}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-amber)] text-amber border border-amber-line items-center justify-center kr text-[15px] mr-[9px]">
                쓰
              </span>
              Writing
            </h1>
            <span className="text-[13px] text-muted">
              Level {level} · chapter {chapterIndex + 1} of {chapters.length}
            </span>
          </div>

          {!prompts ? (
            <WritingEmpty />
          ) : (
            <WritingSession
              // Remount when the chapter changes so the previous chapter's
              // summary state doesn't survive the navigation.
              key={`${level}-${chapterIndex}`}
              prompts={prompts}
              userId={user.id}
              level={level}
              chapterIndex={chapterIndex}
              hasNextChapter={hasNextChapter}
              species={myLevel}
              costumeIds={equippedIds}
              treeStage={treeStage}
            />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

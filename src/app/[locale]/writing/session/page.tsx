import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WritingSession, { WritingEmpty } from "@/components/writing/WritingSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { chapterWrittenToday, getChaptersForLevel, utcDayStartISO } from "@/lib/writing";
import { isPlus } from "@/lib/plus";
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

  const [{ data: profile }, { data: todayRows }, { data: costumeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, plus_until, xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("writing_progress")
      .select("prompt_key, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", utcDayStartISO())
      .limit(1),
    supabase.from("user_costumes").select("costume_id").eq("user_id", user.id).eq("equipped", true),
  ]);

  const equippedIds = (costumeRows ?? []).map((r) => r.costume_id);
  const treeStage = treeStageForLevel(levelProgress(profile?.xp ?? 0).level);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForLevel(level);
  const prompt = chapters[chapterIndex]?.[0];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

  // Free plan writes one chapter per UTC day; today's own chapter stays open.
  const plus = isPlus(profile?.plus_until);
  const todayKey = chapterWrittenToday(todayRows);
  const dailyDone = !plus && !!todayKey && todayKey !== prompt?.key;

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
            <b className="text-charcoal font-semibold">Page {chapterIndex + 1}</b>
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
              Level {level} · page {chapterIndex + 1} of {chapters.length}
            </span>
          </div>

          {!prompt ? (
            <WritingEmpty />
          ) : dailyDone ? (
            <div className="border border-line rounded-[14px] bg-cream max-w-[900px] px-7 py-10 text-center">
              <p className="text-[40px] mb-2">🌙</p>
              <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">
                Today&apos;s page is already written
              </h2>
              <p className="text-sm text-muted mb-6 max-w-[420px] mx-auto leading-[1.7]">
                The free plan writes one page a day — this one opens tomorrow. Kroot
                Plus turns pages without limits.
              </p>
              <div className="flex justify-center gap-2.5 flex-wrap">
                <Link
                  href={`/writing?level=${level}`}
                  className="rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-charcoal bg-cream border border-line hover:bg-warm transition-colors"
                >
                  All pages
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-amber hover:bg-[#B45309] transition-colors"
                >
                  🌟 Go unlimited with Plus
                </Link>
              </div>
            </div>
          ) : (
            <WritingSession
              // Remount when the chapter changes so the previous chapter's
              // summary state doesn't survive the navigation.
              key={`${level}-${chapterIndex}`}
              prompt={prompt}
              userId={user.id}
              level={level}
              chapterIndex={chapterIndex}
              hasNextChapter={hasNextChapter}
              plus={plus}
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

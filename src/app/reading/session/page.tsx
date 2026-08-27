import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ReadingSession, { ReadingEmpty } from "@/components/reading/ReadingSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChaptersForLevel } from "@/lib/reading";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

export default async function ReadingChapterSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; level?: string }>;
}) {
  const sp = await searchParams;
  const chapterIndex = Number(sp.chapter ?? 0);

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForLevel(level);
  const passage = chapters[chapterIndex]?.[0];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

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
          <div className="flex gap-2 text-[13px] text-faint mb-[18px] flex-wrap">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <Link href={`/reading?level=${level}`} className="hover:text-charcoal transition-colors">
              Reading
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Chapter {chapterIndex + 1}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#EFF6FF] text-sky-deep border border-sky-line items-center justify-center kr text-[15px] mr-[9px]">
                읽
              </span>
              {passage?.title_en ?? "Story Grove"}
            </h1>
            <span className="text-[13px] text-muted">Level {level} · Chapter {chapterIndex + 1}</span>
          </div>

          {passage ? (
            <ReadingSession
              // Remount when the chapter changes — otherwise React reuses the
              // instance and the old chapter's summary state sticks around.
              key={`${level}-${chapterIndex}`}
              passage={passage}
              userId={user.id}
              chapterIndex={chapterIndex}
              hasNextChapter={hasNextChapter}
              level={level}
            />
          ) : (
            <ReadingEmpty />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

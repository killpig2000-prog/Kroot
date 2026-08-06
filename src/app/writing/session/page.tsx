import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WritingSession, { WritingEmpty } from "@/components/writing/WritingSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChaptersForLevel } from "@/lib/writing";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForLevel(level);
  const prompt = chapters[chapterIndex]?.[0];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

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
            <Link href={`/writing?level=${level}`} className="hover:text-[#18181B] transition-colors">
              Writing
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Page {chapterIndex + 1}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] items-center justify-center kr text-[15px] mr-[9px]">
                쓰
              </span>
              Writing
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              Level {level} · page {chapterIndex + 1} of {chapters.length}
            </span>
          </div>

          {prompt ? (
            <WritingSession
              prompt={prompt}
              userId={user.id}
              level={level}
              chapterIndex={chapterIndex}
              hasNextChapter={hasNextChapter}
            />
          ) : (
            <WritingEmpty />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

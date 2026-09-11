import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LessonBar from "@/components/ui/LessonBar";
import WritingSession, { WritingEmpty } from "@/components/writing/WritingSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChaptersForLevel, getSiblingPrompts } from "@/lib/writing";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

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

  const [t, locale, { data: profile }] = await Promise.all([
    getTranslations("writing"),
    getLocale(),
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForLevel(level);
  // A hand-edited ?chapter= used to render its own number back at the learner
  // — "Chapter 1000 of 12", with an empty body underneath. There is no such
  // chapter, so say so properly.
  if (!Number.isInteger(chapterIndex) || chapterIndex < 0 || chapterIndex >= chapters.length) notFound();
  const prompts = chapters[chapterIndex];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          lessonBar
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px] min-h-screen flex flex-col">
          <LessonBar
            href="/writing"
            title={t("crumb")}
            sub={t("session.chapterN", { n: chapterIndex + 1 })}
            backHref={`/writing?level=${level}`}
            locale={locale}
            level={{
              current: level,
              mine: myLevel,
              levels: LEVEL_ORDER,
              unlocked: LEVEL_ORDER.filter((lv) => isDifficultyUnlocked(lv, myLevel)),
              hrefTemplate: "/writing?level={lv}",
            }}
          />

          {/* centres under the lesson bar when it fits the screen; taller
              content grows this block and starts at the top (2026-09-11,
              same as the vocab word card) */}
          <div className="flex-1 flex flex-col justify-center">
          {!prompts ? (
            <WritingEmpty />
          ) : (
            <WritingSession
              // Remount when the chapter changes so the previous chapter's
              // summary state doesn't survive the navigation.
              key={`${level}-${chapterIndex}`}
              prompts={prompts}
              siblings={getSiblingPrompts(level, prompts)}
              userId={user.id}
              level={level}
              chapterIndex={chapterIndex}
              hasNextChapter={hasNextChapter}
            />
          )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

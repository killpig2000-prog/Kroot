import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LessonBar from "@/components/ui/LessonBar";
import ReadingSession, { ReadingEmpty } from "@/components/reading/ReadingSession";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChaptersForLevel } from "@/lib/reading";
import { buildGlossary, glossaryWords } from "@/lib/word-links";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

export default async function ReadingChapterSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; level?: string }>;
}) {
  const sp = await searchParams;
  const chapterIndex = Number(sp.chapter ?? 0);
  const t = await getTranslations("reading");

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
  // A hand-edited ?chapter= used to echo its own number back — "Chapter 0",
  // "Chapter 1000" — above an empty body. There is no such chapter.
  if (!Number.isInteger(chapterIndex) || chapterIndex < 0 || chapterIndex >= chapters.length) notFound();
  const passage = chapters[chapterIndex]?.[0];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

  // Deck words in this passage, resolved here so the reader can gloss a word
  // synchronously and the 4k-word dictionary never reaches the client bundle.
  // The link carries the way back to this exact chapter.
  const locale = await getLocale();
  const backHref = `/reading/session?chapter=${chapterIndex}&level=${level}`;
  const glossary = passage ? buildGlossary(passage.body_kr, locale, backHref) : {};
  const words = glossaryWords(glossary);

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
            href="/reading"
            title={t("crumb")}
            sub={t("session.chapterN", { n: chapterIndex + 1 })}
            backHref={`/reading?level=${level}`}
            locale={locale}
            level={{
              current: level,
              mine: myLevel,
              levels: LEVEL_ORDER,
              unlocked: LEVEL_ORDER.filter((lv) => isDifficultyUnlocked(lv, myLevel)),
              hrefTemplate: "/reading?level={lv}",
            }}
          />

          {/* centres under the lesson bar when it fits the screen; a long
              passage grows this block and starts at the top (2026-09-11) */}
          <div className="flex-1 flex flex-col justify-center">
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
              glossary={glossary}
              words={words}
            />
          ) : (
            <ReadingEmpty />
          )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

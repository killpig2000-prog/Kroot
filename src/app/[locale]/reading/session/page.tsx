import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ReadingSession, { ReadingEmpty } from "@/components/reading/ReadingSession";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { getChaptersForLevel } from "@/lib/reading";
import { getLocalizedTitle } from "@/lib/reading-i18n";
import { buildGlossary, glossaryWords } from "@/lib/word-links";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

export default async function ReadingChapterSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; level?: string }>;
}) {
  const sp = await searchParams;
  const chapterIndex = Number(sp.chapter ?? 0);
  const [t, tn] = await Promise.all([getTranslations("reading"), getTranslations("nav")]);

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
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start md:content-stretch">
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
              {tn("garden")}
            </Link>
            <span>/</span>
            <Link href={`/reading?level=${level}`} className="hover:text-charcoal transition-colors">
              {t("crumb")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{t("session.chapterN", { n: chapterIndex + 1 })}</b>
          </div>

          {/* head */}
          <div className="mb-6">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-sky)] text-sky-deep border border-sky-line items-center justify-center kr text-[15px] mr-[9px]">
                읽
              </span>
              {passage ? getLocalizedTitle(passage, locale) : tn("storyGrove")}
            </h1>
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
              glossary={glossary}
              words={words}
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

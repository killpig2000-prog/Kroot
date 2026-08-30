import { Link, redirect } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WritingSession, { WritingEmpty } from "@/components/writing/WritingSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import {
  CHAPTERS_PER_DAY,
  chaptersCompletedToday,
  getChaptersForLevel,
  getSiblingPrompts,
  promptKeysCompletedToday,
  utcDayStartISO,
} from "@/lib/writing";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

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

  const [t, tn, { data: profile }, { data: todayRows }] = await Promise.all([
    getTranslations("writing"),
    getTranslations("nav"),
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("writing_progress")
      .select("prompt_key, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", utcDayStartISO()),
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForLevel(level);
  const prompts = chapters[chapterIndex];
  const hasNextChapter = chapterIndex + 1 < chapters.length;

  // At most CHAPTERS_PER_DAY finished per UTC day — a chapter already
  // completed today stays open for re-reading, but a fresh one waits.
  const todayKeys = promptKeysCompletedToday(todayRows);
  const chapterDoneToday = !!prompts && prompts.every((p) => todayKeys.has(p.key));
  const capReached = chaptersCompletedToday(chapters, todayKeys) >= CHAPTERS_PER_DAY;
  const dailyCapped = !!prompts && capReached && !chapterDoneToday;

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
              {tn("garden")}
            </Link>
            <span>/</span>
            <Link href={`/writing?level=${level}`} className="hover:text-charcoal transition-colors">
              {t("crumb")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{t("session.chapterN", { n: chapterIndex + 1 })}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-amber)] text-amber border border-amber-line items-center justify-center kr text-[15px] mr-[9px]">
                쓰
              </span>
              {t("crumb")}
            </h1>
            <span className="text-[13px] text-muted">
              {t("session.levelChapterOf", { level, n: chapterIndex + 1, total: chapters.length })}
            </span>
          </div>

          {!prompts ? (
            <WritingEmpty />
          ) : dailyCapped ? (
            <div className="border border-line rounded-[14px] bg-cream max-w-[900px] px-7 py-10 text-center">
              <p className="text-[40px] mb-2">🌙</p>
              <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">{t("session.capTitle", { n: CHAPTERS_PER_DAY })}</h2>
              <p className="text-sm text-muted mb-6 max-w-[420px] mx-auto leading-[1.7]">
                {t("session.capBody", { n: CHAPTERS_PER_DAY })}
              </p>
              <Link
                href={`/writing?level=${level}`}
                className="rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-charcoal bg-cream border border-line hover:bg-warm transition-colors"
              >
                {t("session.allChapters")}
              </Link>
            </div>
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
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

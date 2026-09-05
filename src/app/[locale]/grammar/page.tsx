import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { GRAMMAR_LESSONS, GRAMMAR_CHAPTERS, lessonsByChapter, getLocalizedLesson } from "@/lib/grammar";
import { getUnpaidRewardKeys } from "@/lib/reward-status";
import { grammarLessonKey } from "@/lib/reward-keys";

export default async function GrammarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  const tn = await getTranslations("nav");
  const t = await getTranslations("grammarUi");
  const tu = await getTranslations("ui");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const unpaidKeys = await getUnpaidRewardKeys(supabase, user.id, "grammar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { locale } = await params;
  const sp = await searchParams;

  const { data: progress } = await supabase
    .from("grammar_progress")
    .select("lesson_key")
    .eq("user_id", user.id)
    .not("completed_at", "is", null);
  const completedKeys = new Set((progress ?? []).map((p) => p.lesson_key));

  const chapterDone = new Map(
    GRAMMAR_CHAPTERS.map((c) => {
      const keys = lessonsByChapter(c.number).map((l) => l.key);
      return [c.number, { done: keys.filter((k) => completedKeys.has(k)).length, total: keys.length }];
    })
  );
  const requested = Number(sp.chapter);
  const chapter = GRAMMAR_CHAPTERS.some((c) => c.number === requested) ? requested : 1;

  const shownLessons = (
    await Promise.all(lessonsByChapter(chapter).map((l) => getLocalizedLesson(l.key, locale)))
  ).filter((l): l is NonNullable<typeof l> => Boolean(l));

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

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-indigo)] text-[var(--tint-indigo-ink)] border border-[var(--tint-indigo-line)] items-center justify-center kr text-[15px] mr-[9px]">
                문
              </span>
              {tn("grammar")}
            </h1>
            <span className="text-[13px] text-muted">
              {t("lessonCount", { n: GRAMMAR_LESSONS.length })}
            </span>
          </div>

          {/* chapters, ordered by how essential the grammar is — not CEFR
              grade. Every lesson lives in exactly one chapter. */}
          <section className="max-w-[820px] mb-8">
            <nav aria-label={t("lessonCount", { n: GRAMMAR_LESSONS.length })} className="mb-4 -mx-1 px-1">
              <div className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(90deg,#000_calc(100%-32px),transparent)] sm:[mask-image:none]">
                {GRAMMAR_CHAPTERS.map((c) => {
                  const current = c.number === chapter;
                  const stat = chapterDone.get(c.number)!;
                  return (
                    <Link
                      key={c.number}
                      href={`/grammar?chapter=${c.number}`}
                      aria-current={current ? "true" : undefined}
                      className={`flex-none inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                        current
                          ? "bg-[#423AC5] border-[#423AC5] text-white"
                          : "bg-cream border-line text-charcoal hover:border-faint"
                      }`}
                    >
                      {stat.done === stat.total && !current && <span className="text-success text-[11px]">✓</span>}
                      {c.number}. {c.title}
                      <span className={`text-[10.5px] tabular-nums font-semibold ${current ? "text-white/80" : "text-faint"}`}>
                        {stat.done}/{stat.total}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint">
                <span className="kr normal-case">{GRAMMAR_CHAPTERS[chapter - 1].krTitle}</span>
              </span>
              <span className="h-px flex-1 bg-line" />
              <span className="text-[12px] text-faint">{t("lessonCount", { n: shownLessons.length })}</span>
            </div>

            <div className="border border-line rounded-[14px] overflow-hidden">
              {shownLessons.map((lesson, i) => {
                const done = completedKeys.has(lesson.key);
                const coinAvailable = unpaidKeys.has(grammarLessonKey(lesson.key));
                return (
                  <Link
                    key={lesson.key}
                    href={`/grammar/${lesson.key}`}
                    className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-cream transition-all duration-150 hover:bg-[var(--tint-indigo)] group ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <span
                      className={`flex-none w-8 h-8 rounded-[10px] border flex items-center justify-center text-[12.5px] font-bold transition-all group-hover:bg-[#423AC5] group-hover:border-[#423AC5] group-hover:text-white ${
                        done ? "bg-success-bg border-success-line text-success" : "bg-warm border-line text-muted"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block font-semibold text-[15px] leading-[1.35]">
                        {lesson.title}
                      </b>
                    </span>
                    {coinAvailable && (
                      <span className="flex-none inline-block text-[10.5px] font-semibold rounded-full border px-2 py-[2px] bg-[var(--tint-amber)] text-amber border-amber-line whitespace-nowrap">
                        {tu("coinAvailable")}
                      </span>
                    )}
                    <span className="flex-none text-[#D6D3CC] text-sm transition-all group-hover:text-[var(--tint-indigo-ink)] group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

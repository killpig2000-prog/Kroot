import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LessonBar from "@/components/ui/LessonBar";
import ExampleBox from "@/components/grammar/ExampleBox";
import GrammarQuizBlock from "@/components/grammar/GrammarQuiz";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { lessonIndex, nextLesson, getLocalizedLesson } from "@/lib/grammar";

export default async function GrammarLessonPage({
  params,
}: {
  params: Promise<{ locale: string; lessonKey: string }>;
}) {
  const t = await getTranslations("grammarUi");
  const tn = await getTranslations("nav");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { locale, lessonKey } = await params;
  const lesson = await getLocalizedLesson(lessonKey, locale);
  if (!lesson) notFound();

  const no = lessonIndex(lesson.key) + 1;
  const nextKey = nextLesson(lesson.key);
  const next = nextKey ? (await getLocalizedLesson(nextKey.key, locale)) ?? nextKey : null;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? ""}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          lessonBar
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">
          <LessonBar href="/grammar" title={tn("grammar")} sub={t("lessonNumber", { n: no })} backHref="/grammar" locale={locale} />

          {/* the lesson's own name is the page heading — the bar carries
              the module and the lesson number, which fit at 360px */}
          <h1 className="font-bold text-[22px] tracking-[-0.02em] leading-tight">{lesson.title}</h1>
          <p className="kr text-[13px] text-muted mt-1 mb-4">{lesson.krTitle}</p>

          {/* summary */}
          <div className="max-w-[720px] bg-[var(--tint-indigo)] border border-[var(--tint-indigo-line)] rounded-[14px] px-[18px] py-4 mb-7">
            <p className="text-[13.5px] text-charcoal leading-[1.65]">{lesson.summary}</p>
          </div>

          {/* sections */}
          <div className="max-w-[720px]">
            {lesson.sections.map((section, i) => (
              <section
                key={i}
                className="border border-line rounded-[14px] p-[clamp(18px,2.5vw,26px)] mb-3.5"
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="flex-none w-[22px] h-[22px] rounded-md bg-[var(--tint-indigo)] border border-[var(--tint-indigo-line)] text-[var(--tint-indigo-ink)] flex items-center justify-center text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <h2 className="font-bold text-[16.5px] tracking-[-0.01em]">{section.heading}</h2>
                </div>
                <p className="text-[14px] text-muted leading-[1.7] mb-4">
                  {section.explanation}
                </p>
                <ExampleBox examples={section.examples} userId={user.id} />
              </section>
            ))}

            {/* quiz */}
            <div className="flex items-center gap-2.5 mt-8 mb-3.5">
              <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint">
                {t("checkYourself")}
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <GrammarQuizBlock quiz={lesson.quiz} lessonKey={lesson.key} lessonTitle={lesson.title} level={lesson.level} userId={user.id} />

            {/* footer nav */}
            <div className="flex items-center justify-between gap-3 mt-6 flex-wrap">
              <Link
                href="/grammar"
                className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-charcoal bg-cream border border-line hover:bg-warm transition-colors"
              >
                {t("allLessons")}
              </Link>
              {next && (
                <Link
                  href={`/grammar/${next.key}`}
                  className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[var(--tint-indigo-ink)] hover:bg-[#4338CA] transition-colors"
                >
                  {t("nextLesson", { title: next.title })}
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

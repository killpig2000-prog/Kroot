import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { seoAlternates } from "@/lib/seo";
import { GRAMMAR_CHAPTERS, GRAMMAR_LESSONS, lessonsByChapter } from "@/lib/grammar";

// Public SEO grammar hub — every one of the 65 lessons is one hop from here
// (no auth wall, unlike the in-app /grammar), grouped into the same 8
// necessity-ordered chapters as the signed-in page.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `${GRAMMAR_LESSONS.length} Korean Grammar Points Explained with Examples | Kroot`,
    description:
      "A free Korean grammar guide covering 65 patterns — from word order and particles to honorifics and idioms — with real example sentences, ordered by how essential each one is.",
    alternates: seoAlternates(locale, "/korean-grammar"),
  };
}

export default async function GrammarGuideHub({ params }: Props) {
  const { locale } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "grammarGuide" });

  return (
    <div className="min-h-screen bg-[var(--sky)] text-[var(--ink)]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[var(--deep)] text-xl">
          Kroot
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full bg-[var(--leaf)] px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_var(--leaf-shadow)]"
        >
          {t("startLearningShort")}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-4xl font-bold">{t("hubTitle")}</h1>
        <p className="mt-3 text-[var(--soft)]">{t("hubIntro")}</p>

        {GRAMMAR_CHAPTERS.map((chapter) => {
          const lessons = lessonsByChapter(chapter.number);
          return (
            <section key={chapter.number} className="mt-8">
              <h2 className="text-lg font-bold">
                <span className="text-[var(--deep)]">{t("chapterN", { n: chapter.number })}</span>
                <span className="ml-2 font-medium text-[var(--soft)]">{chapter.title}</span>
                <span className="ml-2 text-xs font-medium text-[var(--soft)] tabular-nums">
                  {t("lessonCount", { count: lessons.length })}
                </span>
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {lessons.map((lesson) => (
                  <li key={lesson.key}>
                    <Link
                      href={`/korean-grammar/${lesson.key}`}
                      className="flex items-baseline gap-2 rounded-xl bg-[var(--cream)] px-3.5 py-2 shadow-[0_2px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                    >
                      <span className="font-bold flex-none">{lesson.title}</span>
                      <span className="min-w-0 truncate text-sm text-[var(--soft)] kr">{lesson.krTitle}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </div>
  );
}

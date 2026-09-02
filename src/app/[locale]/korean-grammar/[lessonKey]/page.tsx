import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { jsonLd as jsonLdScript, localeUrl, seoAlternates } from "@/lib/seo";
import { GRAMMAR_CHAPTERS, GRAMMAR_LESSONS, getLocalizedLesson, lessonByKey, lessonsByChapter } from "@/lib/grammar";

// Public SEO grammar lesson page — full explanation and examples, crawlable
// without login, funnelling visitors into onboarding for the interactive
// quiz (see /grammar/[lessonKey] for the signed-in version with the quiz).

type Props = { params: Promise<{ locale: string; lessonKey: string }> };

export function generateStaticParams() {
  return GRAMMAR_LESSONS.map(({ key }) => ({ lessonKey: key }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown key still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lessonKey } = await params;
  const lesson = lessonByKey(lessonKey);
  if (!lesson) return {};
  const title = `${lesson.title} (${lesson.krTitle}) — Korean Grammar | Kroot`;
  const description = lesson.summary;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-grammar/${lesson.key}`),
    openGraph: { title, description, url: localeUrl(locale, `/korean-grammar/${lesson.key}`), siteName: "Kroot" },
  };
}

export default async function GrammarGuideLessonPage({ params }: Props) {
  const { locale, lessonKey } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const lesson = await getLocalizedLesson(lessonKey, locale);
  if (!lesson) notFound();

  const t = await getTranslations({ locale, namespace: "grammarGuide" });
  const chapter = GRAMMAR_CHAPTERS.find((c) => c.number === lesson.chapter)!;
  const siblings = lessonsByChapter(lesson.chapter).filter((l) => l.key !== lesson.key);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: lesson.title,
    description: lesson.summary,
    inLanguage: "ko",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `Kroot Korean Grammar Guide — ${chapter.title}`,
      url: localeUrl(locale, "/korean-grammar"),
    },
  };

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[#3E7C59] text-xl">
          Kroot
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/korean-grammar" className="hover:text-success">
            {t("backToGuide")}
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-success px-4 py-2 font-semibold text-white shadow-[0_3px_0_var(--color-success-deep)]"
          >
            {t("startLearningShort")}
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-muted">
          <Link href="/korean-grammar" className="hover:underline">
            {t("backToGuide")}
          </Link>{" "}
          · {t("chapterN", { n: chapter.number })} · {chapter.title}
        </p>

        <article className="rounded-3xl bg-cream p-8 border border-line">
          <h1 className="text-4xl font-bold">{lesson.title}</h1>
          <p className="mt-1 text-lg text-muted kr">{lesson.krTitle}</p>
          <p className="mt-4 text-charcoal">{lesson.summary}</p>
        </article>

        {lesson.sections.map((section, i) => (
          <section key={i} className="mt-8">
            <h2 className="text-lg font-bold">{section.heading}</h2>
            <p className="mt-2 text-charcoal">{section.explanation}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {section.examples.map((ex, j) => (
                <li key={j} className="rounded-xl bg-cream px-4 py-3 border border-line">
                  <p className="kr text-lg">{ex.kr}</p>
                  <p className="text-sm text-muted">
                    {ex.romanization} — {ex.en}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mt-12 rounded-3xl bg-success-bg p-8 text-center border border-success-line">
          <h2 className="text-2xl font-bold text-success-deep">{t("learnForReal", { title: lesson.title })}</h2>
          <p className="mt-2 text-charcoal">{t("learnDescription")}</p>
          <Link
            href="/onboarding"
            className="mt-5 inline-block rounded-full bg-success px-6 py-3 font-semibold text-white shadow-[0_3px_0_var(--color-success-deep)]"
          >
            {t("quizLocked")}
          </Link>
        </section>

        {siblings.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">{t("moreInChapter")}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {siblings.map((l) => (
                <li key={l.key}>
                  <Link
                    href={`/korean-grammar/${l.key}`}
                    className="block rounded-2xl bg-cream px-4 py-3 border border-line hover:-translate-y-0.5 transition"
                  >
                    <span className="font-bold">{l.title}</span>{" "}
                    <span className="text-sm text-muted kr">{l.krTitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

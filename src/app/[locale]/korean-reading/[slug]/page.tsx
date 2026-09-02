import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { jsonLd as jsonLdScript, localeUrl, seoAlternates } from "@/lib/seo";
import { PUBLIC_READING_PASSAGES, getPassageBySlug, getPublicPassagesByLevel } from "@/lib/reading-slugs";

// Public SEO reading page — the full passage and its questions (no scoring),
// crawlable without login, funnelling visitors into onboarding for the
// tracked, scored version.

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return PUBLIC_READING_PASSAGES.map(({ slug }) => ({ slug }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown slug still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const passage = getPassageBySlug(slug);
  if (!passage) return {};
  const title = `${passage.title_en} — Korean ${passage.level} Reading Passage | Kroot`;
  const description = `A CEFR ${passage.level} Korean reading passage with English translation and comprehension questions: ${passage.title_en}.`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-reading/${passage.slug}`),
    openGraph: { title, description, url: localeUrl(locale, `/korean-reading/${passage.slug}`), siteName: "Kroot" },
  };
}

export default async function ReadingGuidePassagePage({ params }: Props) {
  const { locale, slug } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const passage = getPassageBySlug(slug);
  if (!passage) notFound();

  const t = await getTranslations({ locale, namespace: "readingGuide" });
  const related = getPublicPassagesByLevel(passage.level)
    .filter((p) => p.slug !== passage.slug)
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: passage.title_en,
    inLanguage: "ko",
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: `Kroot Korean Reading — Level ${passage.level}`,
      url: localeUrl(locale, `/korean-reading/level/${passage.level.toLowerCase()}`),
    },
  };

  return (
    <div className="min-h-screen bg-[var(--sky)] text-[var(--ink)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[var(--deep)] text-xl">
          Kroot
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full bg-[var(--leaf)] px-4 py-2 font-semibold text-white shadow-[0_3px_0_var(--leaf-shadow)]"
        >
          {t("startLearningShort")}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-[var(--soft)]">
          <Link href="/korean-reading" className="hover:underline">
            {t("hubTitle")}
          </Link>{" "}
          ·{" "}
          <Link href={`/korean-reading/level/${passage.level.toLowerCase()}`} className="hover:underline">
            {t("levelN", { level: passage.level })}
          </Link>
        </p>

        <article className="rounded-3xl bg-[var(--cream)] p-8 shadow-[0_6px_0_var(--card-shadow)]">
          <h1 className="text-3xl font-bold">{passage.title_en}</h1>
          <p className="mt-1 text-lg text-[var(--soft)] kr">{passage.title_kr}</p>
          <span className="mt-4 inline-block rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-semibold text-[var(--deep)]">
            {t("levelN", { level: passage.level })}
          </span>

          <div className="mt-6 whitespace-pre-line kr text-lg leading-relaxed">{passage.body_kr}</div>
          <div className="mt-4 whitespace-pre-line text-[var(--soft)] leading-relaxed">{passage.body_en}</div>
        </article>

        {passage.questions.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold">{t("comprehensionQuestions")}</h2>
            <ol className="mt-3 flex flex-col gap-3">
              {passage.questions.map((q, i) => (
                <li key={i} className="rounded-xl bg-[var(--cream)] px-4 py-3 shadow-[0_2px_0_var(--card-shadow)]">
                  <p className="font-semibold">{q.question_en}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm text-[var(--soft)]">
                    {q.options.map((opt, j) => (
                      <li key={j}>{opt}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-12 rounded-3xl bg-[var(--mint)] p-8 text-center shadow-[0_6px_0_var(--mint-shadow)]">
          <h2 className="text-2xl font-bold text-[var(--deep)]">{t("learnForReal")}</h2>
          <p className="mt-2 text-[var(--ink)]">{t("learnDescription")}</p>
          <Link
            href="/onboarding"
            className="mt-5 inline-block rounded-full bg-[var(--leaf)] px-6 py-3 font-semibold text-white shadow-[0_3px_0_var(--leaf-shadow)]"
          >
            {t("startLearning")}
          </Link>
        </section>

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">{t("moreAtLevel", { level: passage.level })}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/korean-reading/${p.slug}`}
                    className="block rounded-2xl bg-[var(--cream)] px-4 py-3 shadow-[0_3px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                  >
                    <span className="font-bold">{p.title_en}</span>
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

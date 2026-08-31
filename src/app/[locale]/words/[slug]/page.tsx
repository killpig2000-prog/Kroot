import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { localeUrl, seoAlternates } from "@/lib/seo";
import { PUBLIC_VOCAB_WORDS, getWordBySlug, relatedWords } from "@/lib/vocab-slugs";
import { wordBankKey } from "@/lib/word-bank";
import AddToMyWords from "@/components/words/AddToMyWords";
import BankBackLink from "@/components/words/BankBackLink";

// Public SEO dictionary page — one statically generated page per vocabulary
// word, crawlable without login, funnelling visitors into onboarding.

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return PUBLIC_VOCAB_WORDS.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const word = getWordBySlug(slug);
  if (!word) return {};
  const title = `${word.korean} (${word.romanization}) — “${word.meaning_en}” in Korean | Kroot`;
  const description = `${word.korean} (${word.romanization}) means “${word.meaning_en}” in Korean. CEFR ${word.level} word with example sentence: ${word.example_kr} — ${word.example_en}`;
  return {
    title,
    description,
    // Self-referential per locale plus the full hreflang set. Hardcoding the
    // bare English URL here meant /ja/words/... declared the English page as
    // canonical and de-indexed itself.
    alternates: seoAlternates(locale, `/words/${word.slug}`),
    openGraph: { title, description, url: localeUrl(locale, `/words/${word.slug}`), siteName: "Kroot" },
  };
}

export default async function WordPage({ params }: Props) {
  const { locale, slug } = await params;
  const word = getWordBySlug(slug);
  if (!word) notFound();

  const t = await getTranslations({ locale, namespace: "words" });
  const related = relatedWords(word);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: word.korean,
    description: word.meaning_en,
    inLanguage: "ko",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `Kroot Korean Vocabulary — Level ${word.level}`,
      url: localeUrl(locale, `/words/level/${word.level.toLowerCase()}`),
    },
  };

  return (
    <div className="min-h-screen bg-[var(--sky)] text-[var(--ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[var(--deep)] text-xl">
          Kroot
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/words" className="hover:text-[var(--deep)]">
            {t("nav")}
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full bg-[var(--leaf)] px-4 py-2 font-semibold text-white shadow-[0_3px_0_var(--leaf-shadow)]"
          >
            {t("startLearningShort")}
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        {/* Only rendered when the learner came from their word bank; the
            search param is read on the client so the page stays static. */}
        <Suspense fallback={null}>
          <BankBackLink />
        </Suspense>

        <p className="mb-2 text-sm text-[var(--soft)]">
          <Link href="/words" className="hover:underline">
            {t("dictionary")}
          </Link>{" "}
          ·{" "}
          <Link href={`/words/level/${word.level.toLowerCase()}`} className="hover:underline">
            {t("levelN", { level: word.level })}
          </Link>
        </p>

        <article className="rounded-3xl bg-[var(--cream)] p-8 shadow-[0_6px_0_var(--card-shadow)]">
          <h1 className="text-5xl font-bold">{word.korean}</h1>
          <p className="mt-2 text-xl text-[var(--soft)]">
            {word.romanization} · <span className="text-[var(--ink)]">{word.meaning_en}</span>
          </p>
          <span className="mt-4 inline-block rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-semibold text-[var(--deep)]">
            {t("levelN", { level: word.level })}
          </span>

          <h2 className="mt-8 text-lg font-bold">{t("exampleSentence")}</h2>
          <p className="mt-2 text-2xl">{word.example_kr}</p>
          <p className="mt-1 text-[var(--soft)]">{word.example_en}</p>

          {/* Client island: the page stays static for SEO, the button resolves
              the session on mount. Dictionary entries come from the daily-life
              deck, so the word-bank key uses that topic. */}
          <AddToMyWords
            slug={word.slug}
            wordKey={wordBankKey("daily-life", word.level, word.korean)}
            korean={word.korean}
            level={word.level}
          />
        </article>

        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("moreLevelWords", { level: word.level })}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((w) => (
              <li key={w.slug}>
                <Link
                  href={`/words/${w.slug}`}
                  className="block rounded-2xl bg-[var(--cream)] px-4 py-3 shadow-[0_3px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                >
                  <span className="font-bold">{w.korean}</span>{" "}
                  <span className="text-sm text-[var(--soft)]">
                    {w.romanization} — {w.meaning_en}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-3xl bg-[var(--mint)] p-8 text-center shadow-[0_6px_0_var(--mint-shadow)]">
          <h2 className="text-2xl font-bold text-[var(--deep)]">
            {t("learnForReal", { word: word.korean })}
          </h2>
          <p className="mt-2 text-[var(--ink)]">{t("learnDescription")}</p>
          <Link
            href="/onboarding"
            className="mt-5 inline-block rounded-full bg-[var(--leaf)] px-6 py-3 font-semibold text-white shadow-[0_3px_0_var(--leaf-shadow)]"
          >
            {t("startLearning")}
          </Link>
        </section>
      </main>
    </div>
  );
}

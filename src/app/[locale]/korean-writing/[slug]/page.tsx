import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { jsonLd as jsonLdScript, localeUrl, seoAlternates } from "@/lib/seo";
import { WRITING_GENRE_META } from "@/lib/writing";
import { getLocalizedExample, getLocalizedPrompt, getLocalizedStimulus } from "@/lib/writing-i18n";
import { PUBLIC_WRITING_PROMPTS, getPromptBySlug, getPublicPromptsByLevelAndGenre } from "@/lib/writing-slugs";

// Public SEO writing page — the prompt and its model-answer sentence (no
// tile-assembly interaction, no scoring), crawlable without login,
// funnelling visitors into onboarding for the interactive version.

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return PUBLIC_WRITING_PROMPTS.map(({ slug }) => ({ slug }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown slug still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const prompt = getPromptBySlug(slug);
  if (!prompt) return {};
  const meta = WRITING_GENRE_META[prompt.genre];
  const title = `${prompt.example_kr} — Korean ${prompt.level} ${meta.label} Writing | Kroot`;
  const description = `A CEFR ${prompt.level} Korean writing prompt with a model-answer sentence and English translation: ${prompt.example_en}`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-writing/${prompt.slug}`),
    openGraph: { title, description, url: localeUrl(locale, `/korean-writing/${prompt.slug}`), siteName: "Kroot" },
  };
}

export default async function WritingGuidePromptPage({ params }: Props) {
  const { locale, slug } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const prompt = getPromptBySlug(slug);
  if (!prompt) notFound();

  const t = await getTranslations({ locale, namespace: "writingGuide" });
  const meta = WRITING_GENRE_META[prompt.genre];
  const related = getPublicPromptsByLevelAndGenre(prompt.level, prompt.genre)
    .filter((p) => p.slug !== prompt.slug)
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: prompt.example_kr,
    inLanguage: "ko",
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: `Kroot Korean Writing — Level ${prompt.level} · ${meta.label}`,
      url: localeUrl(locale, `/korean-writing/level/${prompt.level.toLowerCase()}`),
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
          <Link href="/korean-writing" className="hover:underline">
            {t("hubTitle")}
          </Link>{" "}
          ·{" "}
          <Link href={`/korean-writing/level/${prompt.level.toLowerCase()}`} className="hover:underline">
            {t("levelN", { level: prompt.level })}
          </Link>{" "}
          · {meta.icon} {meta.label}
        </p>

        <article className="rounded-3xl bg-[var(--cream)] p-8 shadow-[0_6px_0_var(--card-shadow)]">
          <span className="inline-block rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-semibold text-[var(--deep)]">
            {t("levelN", { level: prompt.level })}
          </span>

          {prompt.stimulus_kr && (
            <div className="mt-4 rounded-xl bg-[var(--sky)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--soft)]">{t("theyWrote")}</p>
              <p className="kr mt-1">{prompt.stimulus_kr}</p>
              <p className="text-sm text-[var(--soft)] mt-1">{getLocalizedStimulus(prompt, locale)}</p>
            </div>
          )}

          <h1 className="mt-4 text-2xl font-bold kr">{prompt.prompt_kr}</h1>
          <p className="mt-1 text-[var(--soft)]">{getLocalizedPrompt(prompt, locale)}</p>

          <div className="mt-6 rounded-xl bg-[var(--sky)] px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--soft)]">{t("modelAnswer")}</p>
            <p className="kr text-xl mt-1">{prompt.example_kr}</p>
            <p className="text-sm text-[var(--soft)] mt-1">{getLocalizedExample(prompt, locale)}</p>
          </div>
        </article>

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
            <h2 className="text-lg font-bold">{t("moreInGenre", { genre: meta.label })}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/korean-writing/${p.slug}`}
                    className="block rounded-2xl bg-[var(--cream)] px-4 py-3 shadow-[0_3px_0_var(--card-shadow)] hover:-translate-y-0.5 transition kr"
                  >
                    {p.example_kr}
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

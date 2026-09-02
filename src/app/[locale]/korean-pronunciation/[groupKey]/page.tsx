import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { jsonLd as jsonLdScript, localeUrl, seoAlternates } from "@/lib/seo";
import { SOUND_GROUPS, groupByKey } from "@/lib/pronunciation";

// Public SEO pronunciation page — the sound's tip and its six example words
// (no recording/scoring, that needs a mic and an account), crawlable
// without login, funnelling visitors into onboarding for the graded drill.

type Props = { params: Promise<{ locale: string; groupKey: string }> };

export function generateStaticParams() {
  return SOUND_GROUPS.map(({ key }) => ({ groupKey: key }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown key still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, groupKey } = await params;
  const group = groupByKey(groupKey);
  if (!group) return {};
  const title = `How to Pronounce ${group.title} in Korean | Kroot`;
  const description = `${group.tip} Example words: ${group.items.map((w) => w.kr).join(", ")}.`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-pronunciation/${group.key}`),
    openGraph: { title, description, url: localeUrl(locale, `/korean-pronunciation/${group.key}`), siteName: "Kroot" },
  };
}

export default async function PronunciationGuideGroupPage({ params }: Props) {
  const { locale, groupKey } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const group = groupByKey(groupKey);
  if (!group) notFound();

  const t = await getTranslations({ locale, namespace: "pronunciationGuide" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: group.title,
    description: group.tip,
    inLanguage: "ko",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Kroot Korean Pronunciation Guide",
      url: localeUrl(locale, "/korean-pronunciation"),
    },
  };

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[#3E7C59] text-xl">
          Kroot
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full bg-success px-4 py-2 font-semibold text-white shadow-[0_3px_0_var(--color-success-deep)]"
        >
          {t("startLearningShort")}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-muted">
          <Link href="/korean-pronunciation" className="hover:underline">
            {t("hubTitle")}
          </Link>
        </p>

        <article className="rounded-3xl bg-cream p-8 border border-line">
          <h1 className="text-3xl font-bold kr">{group.title}</h1>
          <p className="mt-4 text-charcoal">{group.tip}</p>

          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {group.items.map((w, i) => (
              <li key={i} className="rounded-xl bg-warm-2 px-3.5 py-2.5">
                <p className="kr text-lg font-bold">{w.kr}</p>
                <p className="text-sm text-muted">
                  {w.romanization} — {w.en}
                </p>
              </li>
            ))}
          </ul>
        </article>

        <section className="mt-12 rounded-3xl bg-success-bg p-8 text-center border border-success-line">
          <h2 className="text-2xl font-bold text-success-deep">{t("practiceForReal")}</h2>
          <p className="mt-2 text-charcoal">{t("learnDescription")}</p>
          <Link
            href="/onboarding"
            className="mt-5 inline-block rounded-full bg-success px-6 py-3 font-semibold text-white shadow-[0_3px_0_var(--color-success-deep)]"
          >
            {t("startLearning")}
          </Link>
        </section>
      </main>
    </div>
  );
}

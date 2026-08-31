import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LEVEL_ORDER } from "@/lib/tree";
import { seoAlternates } from "@/lib/seo";
import { getWordsByLevel } from "@/lib/vocab-slugs";

// Public dictionary hub — links every level index so crawlers can reach all
// word pages within two hops of the homepage.

type Props = { params: Promise<{ locale: string }> };

// Metadata has to be generated rather than static: the canonical must name
// the locale actually being served. The old constant pointed every locale at
// the bare English URL, which told Google to drop /ja/words and friends.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Korean Vocabulary Dictionary — words by CEFR level | Kroot",
    description:
      "Browse thousands of Korean words with romanization, English meanings, and example sentences, organized by CEFR level from A1 beginner to C2 advanced.",
    alternates: seoAlternates(locale, "/words"),
  };
}

export default async function WordsHubPage({ params }: Props) {
  const { locale } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "words" });

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

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {LEVEL_ORDER.map((level) => {
            const words = getWordsByLevel(level);
            return (
              <li key={level}>
                <Link
                  href={`/words/level/${level.toLowerCase()}`}
                  className="block h-full rounded-3xl bg-[var(--cream)] p-6 shadow-[0_5px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                >
                  <h2 className="text-2xl font-bold text-[var(--deep)]">{t("levelN", { level })}</h2>
                  <p className="mt-1 text-sm text-[var(--soft)]">{t("wordCount", { count: words.length })}</p>
                  <p className="mt-3 text-sm">{t(`blurb.${level}`)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

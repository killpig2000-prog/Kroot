import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { seoAlternates } from "@/lib/seo";
import { WRITING_GENRE_META } from "@/lib/writing";
import type { WritingGenre } from "@/lib/writing-data/types";
import { getPublicPromptsByLevelAndGenre } from "@/lib/writing-slugs";

// Per-level prompt index — the crawlable listing that links every prompt,
// grouped by genre (journal/reply/description/opinion).

type Props = { params: Promise<{ locale: string; level: string }> };

const GENRES: WritingGenre[] = ["journal", "reply", "description", "opinion"];

export function generateStaticParams() {
  return LEVEL_ORDER.map((level) => ({ level: level.toLowerCase() }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown slug still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

function parseLevel(value: string): CefrLevel | undefined {
  const upper = value.toUpperCase();
  return (LEVEL_ORDER as string[]).includes(upper) ? (upper as CefrLevel) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, level: rawLevel } = await params;
  const level = parseLevel(rawLevel);
  if (!level) return {};
  const title = `Korean ${level} Writing Prompts with Model Answers | Kroot`;
  const description = `Free CEFR ${level} Korean writing prompts with model-answer sentences and English translations, across journal, reply, description, and opinion genres.`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-writing/level/${level.toLowerCase()}`),
  };
}

export default async function WritingLevelIndexPage({ params }: Props) {
  const { locale, level: rawLevel } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const level = parseLevel(rawLevel);
  if (!level) notFound();

  const t = await getTranslations({ locale, namespace: "writingGuide" });

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[#3E7C59] text-xl">
          Kroot
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full bg-success px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_var(--color-success-deep)]"
        >
          {t("startLearningShort")}
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-muted">
          <Link href="/korean-writing" className="hover:underline">
            {t("hubTitle")}
          </Link>{" "}
          · {t("levelN", { level })}
        </p>
        <h1 className="text-4xl font-bold">{t("levelN", { level })}</h1>

        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {LEVEL_ORDER.map((l) => (
            <Link
              key={l}
              href={`/korean-writing/level/${l.toLowerCase()}`}
              className={
                l === level
                  ? "rounded-full bg-success px-3 py-1 font-semibold text-white"
                  : "rounded-full bg-cream border border-line px-3 py-1 hover:text-success"
              }
            >
              {l}
            </Link>
          ))}
        </nav>

        {GENRES.map((genre) => {
          const prompts = getPublicPromptsByLevelAndGenre(level, genre);
          if (prompts.length === 0) return null;
          const meta = WRITING_GENRE_META[genre];
          return (
            <section key={genre} className="mt-8">
              <h2 className="text-lg font-bold text-success">
                {meta.icon} {meta.label}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {prompts.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/korean-writing/${p.slug}`}
                      className="block rounded-xl bg-cream px-3.5 py-2.5 border border-line hover:-translate-y-0.5 transition kr"
                    >
                      {p.example_kr}
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

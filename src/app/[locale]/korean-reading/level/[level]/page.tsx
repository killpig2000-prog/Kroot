import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { seoAlternates } from "@/lib/seo";
import { getPublicPassagesByLevel } from "@/lib/reading-slugs";

// Per-level passage index — the crawlable listing that links every passage.

type Props = { params: Promise<{ locale: string; level: string }> };

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
  const count = getPublicPassagesByLevel(level).length;
  const title = `${count} Korean ${level} Reading Passages with Translations | Kroot`;
  const description = `Free CEFR ${level} Korean reading passages with English translations and comprehension questions. Read them free in Kroot.`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-reading/level/${level.toLowerCase()}`),
  };
}

export default async function ReadingLevelIndexPage({ params }: Props) {
  const { locale, level: rawLevel } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const level = parseLevel(rawLevel);
  if (!level) notFound();

  const t = await getTranslations({ locale, namespace: "readingGuide" });
  const passages = getPublicPassagesByLevel(level);

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
        <p className="mb-2 text-sm text-[var(--soft)]">
          <Link href="/korean-reading" className="hover:underline">
            {t("hubTitle")}
          </Link>{" "}
          · {t("levelN", { level })}
        </p>
        <h1 className="text-4xl font-bold">{t("levelN", { level })}</h1>
        <p className="mt-3 text-[var(--soft)]">{t("passageCount", { count: passages.length })}</p>

        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {LEVEL_ORDER.map((l) => (
            <Link
              key={l}
              href={`/korean-reading/level/${l.toLowerCase()}`}
              className={
                l === level
                  ? "rounded-full bg-[var(--deep)] px-3 py-1 font-semibold text-white"
                  : "rounded-full bg-[var(--cream)] px-3 py-1 shadow-[0_2px_0_var(--card-shadow)] hover:text-[var(--deep)]"
              }
            >
              {l}
            </Link>
          ))}
        </nav>

        <ul className="mt-6 grid gap-2">
          {passages.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/korean-reading/${p.slug}`}
                className="flex items-baseline gap-2 rounded-xl bg-[var(--cream)] px-3.5 py-2.5 shadow-[0_2px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
              >
                <span className="font-bold flex-none">{p.title_en}</span>
                {p.genre && <span className="text-xs text-[var(--soft)]">{p.genre}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

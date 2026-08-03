import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { SITE_URL } from "@/lib/site";
import { getWordsByLevel } from "@/lib/vocab-slugs";

// Per-level word index — the crawlable listing that links every word page.

type Props = { params: Promise<{ level: string }> };

export function generateStaticParams() {
  return LEVEL_ORDER.map((level) => ({ level: level.toLowerCase() }));
}

export const dynamicParams = false;

function parseLevel(value: string): CefrLevel | undefined {
  const upper = value.toUpperCase();
  return (LEVEL_ORDER as string[]).includes(upper) ? (upper as CefrLevel) : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const level = parseLevel((await params).level);
  if (!level) return {};
  const count = getWordsByLevel(level).length;
  const title = `${count} Korean ${level} Vocabulary Words with Examples | Kroot`;
  const description = `Complete list of ${count} CEFR ${level} Korean words with romanization, English meanings, and example sentences. Learn them free in Kroot's 16-day course.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/words/level/${level.toLowerCase()}` },
  };
}

export default async function LevelIndexPage({ params }: Props) {
  const level = parseLevel((await params).level);
  if (!level) notFound();

  const words = getWordsByLevel(level);

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
          Start learning
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-[var(--soft)]">
          <Link href="/words" className="hover:underline">
            Korean Dictionary
          </Link>{" "}
          · Level {level}
        </p>
        <h1 className="text-4xl font-bold">Korean {level} Vocabulary</h1>
        <p className="mt-3 text-[var(--soft)]">
          All {words.length} CEFR {level} words, each with romanization, meaning, and an example
          sentence.
        </p>

        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          {LEVEL_ORDER.map((l) => (
            <Link
              key={l}
              href={`/words/level/${l.toLowerCase()}`}
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

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {words.map((w) => (
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
      </main>
    </div>
  );
}

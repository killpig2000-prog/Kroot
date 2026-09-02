import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { LEVEL_ORDER } from "@/lib/tree";
import { seoAlternates } from "@/lib/seo";
import { SITUATIONS, situationByKey } from "@/lib/listening";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getLocalizedDialogueTitle } from "@/lib/listening-i18n";

// Per-situation dialogue index — the crawlable listing that links every
// dialogue within a situation, grouped by CEFR level.

type Props = { params: Promise<{ locale: string; situationKey: string }> };

export function generateStaticParams() {
  return SITUATIONS.map(({ key }) => ({ situationKey: key }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown key still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, situationKey } = await params;
  const situation = situationByKey(situationKey);
  if (!situation) return {};
  const count = DIALOGUES.filter((d) => d.situationKey === situation.key).length;
  const title = `${count} Korean ${situation.label} Dialogues — Listening Practice | Kroot`;
  const description = `Free Korean listening dialogues for the ${situation.label.toLowerCase()} situation, with transcripts and English translations, from A1 to C2.`;
  return {
    title,
    description,
    alternates: seoAlternates(locale, `/korean-listening/${situation.key}`),
  };
}

export default async function ListeningSituationIndexPage({ params }: Props) {
  const { locale, situationKey } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const situation = situationByKey(situationKey);
  if (!situation) notFound();

  const t = await getTranslations({ locale, namespace: "listeningGuide" });
  const byLevel = LEVEL_ORDER.map((level) => ({
    level,
    dialogues: DIALOGUES.filter((d) => d.situationKey === situation.key && d.level === level),
  })).filter((g) => g.dialogues.length > 0);

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
          <Link href="/korean-listening" className="hover:underline">
            {t("hubTitle")}
          </Link>
        </p>
        <h1 className="text-4xl font-bold">
          {situation.icon} {situation.label}
        </h1>
        <p className="mt-3 text-[var(--soft)]">{situation.sub}</p>

        {byLevel.map(({ level, dialogues }) => (
          <section key={level} className="mt-8">
            <h2 className="text-lg font-bold text-[var(--deep)]">{t("levelN", { level })}</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {dialogues.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/korean-listening/${situation.key}/${d.id}`}
                    className="flex items-baseline gap-2 rounded-xl bg-[var(--cream)] px-3.5 py-2 shadow-[0_2px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                  >
                    <span className="font-bold">{getLocalizedDialogueTitle(d.title, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

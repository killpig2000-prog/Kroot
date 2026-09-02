import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { seoAlternates } from "@/lib/seo";
import { SITUATIONS } from "@/lib/listening";
import { DIALOGUES } from "@/lib/listening-dialogues";

// Public listening hub — every situation, so crawlers reach every dialogue
// within two hops of the homepage.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Korean Listening Practice — real dialogues by situation | Kroot",
    description:
      "Free Korean listening dialogues with transcripts and English translations, organized by real-life situation — cafes, restaurants, airports, and more.",
    alternates: seoAlternates(locale, "/korean-listening"),
  };
}

export default async function ListeningGuideHub({ params }: Props) {
  const { locale } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "listeningGuide" });

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
          {SITUATIONS.map((situation) => {
            const count = DIALOGUES.filter((d) => d.situationKey === situation.key).length;
            return (
              <li key={situation.key}>
                <Link
                  href={`/korean-listening/${situation.key}`}
                  className="block h-full rounded-3xl bg-[var(--cream)] p-6 shadow-[0_5px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                >
                  <h2 className="text-2xl font-bold text-[var(--deep)]">
                    {situation.icon} {situation.label}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--soft)]">{t("dialogueCount", { count })}</p>
                  <p className="mt-3 text-sm">{situation.sub}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}

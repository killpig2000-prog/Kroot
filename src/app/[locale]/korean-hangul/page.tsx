import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { seoAlternates } from "@/lib/seo";
import HangulExplorer from "@/components/hangul/HangulExplorer";

// Public Hangul chart + syllable builder — the whole explorer is
// client-side/static (no userId, no progress writes), so it's dropped
// directly into a public page with no auth wall, unlike the signed-in
// /hangul which only redirects unauthenticated visitors to fetch a Sidebar
// profile it doesn't otherwise need.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Learn Hangul — the Korean alphabet, free | Kroot",
    description:
      "Learn every Hangul consonant and vowel with audio and stroke order, then build syllable blocks yourself — free, no account needed.",
    alternates: seoAlternates(locale, "/korean-hangul"),
  };
}

export default async function HangulGuidePage({ params }: Props) {
  const { locale } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "hangulGuide" });

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
        <h1 className="text-4xl font-bold">{t("hubTitle")}</h1>
        <p className="mt-3 text-muted">{t("hubIntro")}</p>

        <div className="mt-8">
          <HangulExplorer />
        </div>

        <section className="mt-12 rounded-3xl bg-success-bg p-8 text-center border border-success-line">
          <h2 className="text-2xl font-bold text-success-deep">{t("learnForReal")}</h2>
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

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { seoAlternates } from "@/lib/seo";
import { CHALLENGES, FAMILY_META, SOUND_GROUPS, groupsForFamily } from "@/lib/pronunciation";

// Public pronunciation hub — every sound group and challenge sentence, so
// crawlers reach every target word within two hops of the homepage. No
// recording/scoring here (that needs a mic) — just the reference words and
// tips, with the CTA doing the funnelling into the real, graded practice.

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Korean Pronunciation Guide — sounds that trip up learners | Kroot",
    description:
      "Free Korean pronunciation reference covering vowels, consonants, batchim endings, and connected speech, with romanization and example words for each sound.",
    alternates: seoAlternates(locale, "/korean-pronunciation"),
  };
}

export default async function PronunciationGuideHub({ params }: Props) {
  const { locale } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "pronunciationGuide" });

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

        {FAMILY_META.map(({ family, name }) => {
          const groups = groupsForFamily(family);
          if (groups.length === 0) return null;
          return (
            <section key={family} className="mt-8">
              <h2 className="text-lg font-bold text-success">{name}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {groups.map((g) => (
                  <li key={g.key}>
                    <Link
                      href={`/korean-pronunciation/${g.key}`}
                      className="block rounded-xl bg-cream px-3.5 py-2.5 border border-line hover:-translate-y-0.5 transition"
                    >
                      <span className="font-bold">{g.title}</span>
                      <span className="ml-2 text-sm text-muted kr">
                        {g.items.map((w) => w.kr).join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="mt-8">
          <h2 className="text-lg font-bold text-success">{t("challengeSentences")}</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {CHALLENGES.map((c) => (
              <li key={c.key} className="rounded-xl bg-cream px-3.5 py-2.5 border border-line">
                <p className="text-sm font-semibold text-muted">{c.title}</p>
                <p className="kr text-lg">{c.kr}</p>
                <p className="text-sm text-muted">{c.romanization}</p>
              </li>
            ))}
          </ul>
        </section>

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

        <p className="mt-4 text-xs text-muted">
          {t("groupCount", { count: SOUND_GROUPS.length })}
        </p>
      </main>
    </div>
  );
}

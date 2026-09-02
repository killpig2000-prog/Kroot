import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { jsonLd as jsonLdScript, localeUrl, seoAlternates } from "@/lib/seo";
import { situationByKey } from "@/lib/listening";
import { DIALOGUES, dialogueById } from "@/lib/listening-dialogues";
import { getLocalizedDialogueLine, getLocalizedDialogueTitle } from "@/lib/listening-i18n";

// Public SEO listening page — the full dialogue transcript with English
// translation (no scoring), crawlable without login, funnelling visitors
// into onboarding for the audio + graded quiz version.

type Props = { params: Promise<{ locale: string; situationKey: string; dialogueId: string }> };

export function generateStaticParams() {
  return DIALOGUES.map(({ id, situationKey }) => ({ situationKey, dialogueId: id }));
}

// Must stay true: the [locale] layout only generates `en`, so any other
// locale is an ungenerated param combination. An unknown id still 404s --
// the page calls notFound() below.
export const dynamicParams = true;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, dialogueId } = await params;
  const dialogue = dialogueById(dialogueId);
  if (!dialogue) return {};
  const situation = situationByKey(dialogue.situationKey);
  const title = getLocalizedDialogueTitle(dialogue.title, "en");
  const pageTitle = `${title} — Korean ${dialogue.level} Listening | Kroot`;
  const description = `A CEFR ${dialogue.level} Korean listening dialogue (${situation?.label ?? dialogue.situationKey}) with transcript and English translation: ${title}.`;
  return {
    title: pageTitle,
    description,
    alternates: seoAlternates(locale, `/korean-listening/${dialogue.situationKey}/${dialogue.id}`),
    openGraph: {
      title: pageTitle,
      description,
      url: localeUrl(locale, `/korean-listening/${dialogue.situationKey}/${dialogue.id}`),
      siteName: "Kroot",
    },
  };
}

export default async function ListeningGuideDialoguePage({ params }: Props) {
  const { locale, situationKey, dialogueId } = await params;
  // Docs ask for this in every layout AND page: the layout's copy is not
  // guaranteed to be set before a sibling page renders.
  setRequestLocale(locale);
  const dialogue = dialogueById(dialogueId);
  if (!dialogue || dialogue.situationKey !== situationKey) notFound();

  const t = await getTranslations({ locale, namespace: "listeningGuide" });
  const situation = situationByKey(dialogue.situationKey);
  const title = getLocalizedDialogueTitle(dialogue.title, locale);
  const siblings = DIALOGUES.filter(
    (d) => d.situationKey === dialogue.situationKey && d.level === dialogue.level && d.id !== dialogue.id
  ).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    inLanguage: "ko",
    isPartOf: {
      "@type": "CreativeWorkSeries",
      name: `Kroot Korean Listening — ${situation?.label ?? dialogue.situationKey}`,
      url: localeUrl(locale, `/korean-listening/${dialogue.situationKey}`),
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
          <Link href="/korean-listening" className="hover:underline">
            {t("hubTitle")}
          </Link>{" "}
          ·{" "}
          <Link href={`/korean-listening/${dialogue.situationKey}`} className="hover:underline">
            {situation?.label ?? dialogue.situationKey}
          </Link>
        </p>

        <article className="rounded-3xl bg-[var(--cream)] p-8 shadow-[0_6px_0_var(--card-shadow)]">
          <h1 className="text-3xl font-bold">{title}</h1>
          <span className="mt-4 inline-block rounded-full bg-[var(--mint)] px-3 py-1 text-sm font-semibold text-[var(--deep)]">
            {t("levelN", { level: dialogue.level })}
          </span>

          <ul className="mt-6 flex flex-col gap-3">
            {dialogue.lines.map((line, i) => (
              <li key={i} className="rounded-xl bg-[var(--sky)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--soft)]">{line.speaker}</p>
                <p className="kr text-lg mt-1">{line.kr}</p>
                <p className="text-sm text-[var(--soft)] mt-0.5">{getLocalizedDialogueLine(line, locale)}</p>
              </li>
            ))}
          </ul>
        </article>

        <section className="mt-12 rounded-3xl bg-[var(--mint)] p-8 text-center shadow-[0_6px_0_var(--mint-shadow)]">
          <h2 className="text-2xl font-bold text-[var(--deep)]">{t("learnForReal")}</h2>
          <p className="mt-2 text-[var(--ink)]">{t("learnDescriptionListening")}</p>
          <Link
            href="/onboarding"
            className="mt-5 inline-block rounded-full bg-[var(--leaf)] px-6 py-3 font-semibold text-white shadow-[0_3px_0_var(--leaf-shadow)]"
          >
            {t("startLearning")}
          </Link>
        </section>

        {siblings.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">{t("moreInSituation", { situation: situation?.label ?? dialogue.situationKey })}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {siblings.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/korean-listening/${d.situationKey}/${d.id}`}
                    className="block rounded-2xl bg-[var(--cream)] px-4 py-3 shadow-[0_3px_0_var(--card-shadow)] hover:-translate-y-0.5 transition"
                  >
                    <span className="font-bold">{getLocalizedDialogueTitle(d.title, locale)}</span>
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

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { localeUrl, seoAlternates } from "@/lib/seo";
import { VIBES } from "@/lib/slang";
import { PUBLIC_SLANG, getSlangBySlug, relatedSlang } from "@/lib/slang-slugs";
import ShareCta from "@/components/slang/ShareCta";

// Public share page — one statically generated page per slang term, no
// login required. This is the growth loop: real Korean slang, explained,
// meant to be linked straight into fandom communities and shared from
// there — not just discovered inside the app.

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return PUBLIC_SLANG.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const entry = getSlangBySlug(slug);
  if (!entry) return {};
  const title = `${entry.kr} (${entry.romanization}) — what does it mean? | Kroot`;
  const description = `${entry.kr} (${entry.romanization}) means "${entry.meaning}" — real Korean slang, explained. Example: ${entry.example.kr} — ${entry.example.en}`;
  return {
    title,
    description,
    // Self-referential per locale plus the full hreflang set. Hardcoding the
    // bare English URL here meant /ja/slang/... declared the English page as
    // canonical and de-indexed itself.
    alternates: seoAlternates(locale, `/slang/${entry.slug}`),
    openGraph: { title, description, url: localeUrl(locale, `/slang/${entry.slug}`), siteName: "Kroot" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SlangSharePage({ params }: Props) {
  const { locale, slug } = await params;
  const entry = getSlangBySlug(slug);
  if (!entry) notFound();

  const [t, tv] = await Promise.all([getTranslations("slang"), getTranslations("slang.vibes")]);
  const vibe = VIBES.find((v) => v.key === entry.vibe);
  const related = relatedSlang(entry, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: entry.kr,
    description: entry.meaning,
    inLanguage: "ko",
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Kroot Korean Slang — Street Talk",
      url: localeUrl(locale, "/slang"),
    },
  };

  return (
    <div className="min-h-screen bg-[var(--tint-pink)] text-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-charcoal text-xl">
          Kroot
        </Link>
        <ShareCta
          slug={entry.slug}
          className="rounded-full bg-[#C13E78] px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#9D174D] hover:bg-[#C2185F] transition-colors"
        >
          {t("share.startLearning")}
        </ShareCta>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-[#C13E78] font-semibold">{t("share.eyebrow")}</p>

        <article className="relative border border-[var(--tint-pink-line)] rounded-[22px] bg-cream p-8 sm:p-10 shadow-[0_14px_34px_-20px_rgba(219,39,119,.35)] text-center">
          {vibe && (
            <span className="inline-block text-[12px] font-semibold text-[#C13E78] bg-[var(--tint-pink)] border border-[var(--tint-pink-line)] rounded-full px-3 py-1 mb-5">
              {vibe.emoji} {tv(entry.vibe)}
            </span>
          )}
          <h1 className="kr text-[clamp(48px,9vw,72px)] font-bold leading-none">{entry.kr}</h1>
          <p className="mt-3 text-lg text-muted">
            {entry.romanization} ·{" "}
            <span className="italic">{t("card.literally", { text: entry.literal })}</span>
          </p>
          <p className="mt-5 text-2xl font-bold text-charcoal">{entry.meaning}</p>

          <div className="mt-7 border border-[var(--tint-pink-line)] rounded-[14px] bg-[var(--tint-pink)] px-5 py-4 text-left">
            <p className="kr text-lg font-medium text-charcoal">{entry.example.kr}</p>
            <p className="mt-1 text-muted">{entry.example.en}</p>
          </div>

          {entry.origin && (
            <div className="mt-5 text-left">
              <p className="text-[11px] font-bold tracking-[.08em] uppercase text-faint mb-1.5">
                {t("share.origin")}
              </p>
              <p className="text-[14.5px] text-muted leading-relaxed">{entry.origin}</p>
            </div>
          )}
        </article>

        <section className="mt-10">
          <h2 className="text-lg font-bold">{t("share.related")}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/slang/${e.slug}`}
                  className="block rounded-2xl border border-line bg-cream px-4 py-3 shadow-[0_3px_10px_-6px_rgba(219,39,119,.25)] hover:-translate-y-0.5 hover:border-[var(--tint-pink-line)] transition"
                >
                  <span className="kr font-bold">{e.kr}</span>{" "}
                  <span className="text-sm text-muted">
                    {e.romanization} — {e.meaning}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-[24px] bg-[var(--tint-pink)] border border-[var(--tint-pink-line)] p-8 text-center">
          <h2 className="text-2xl font-bold text-[#7C2A4B]">
            {t("share.ctaTitle", { n: 106, kr: entry.kr })}
          </h2>
          <p className="mt-2 text-muted">{t("share.ctaBody")}</p>
          <ShareCta
            slug={entry.slug}
            className="mt-5 inline-block rounded-full bg-[#C13E78] px-6 py-3 font-semibold text-white shadow-[0_3px_0_#9D174D] hover:bg-[#C2185F] transition-colors"
          >
            {t("startFreeArrow")}
          </ShareCta>
        </section>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { VIBES } from "@/lib/slang";
import { PUBLIC_SLANG, getSlangBySlug, relatedSlang } from "@/lib/slang-slugs";

// Public share page — one statically generated page per slang term, no
// login required. This is the growth loop: real Korean slang, explained,
// meant to be linked straight into fandom communities and shared from
// there — not just discovered inside the app.

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_SLANG.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getSlangBySlug(slug);
  if (!entry) return {};
  const title = `${entry.kr} (${entry.romanization}) — what does it mean? | Kroot`;
  const description = `${entry.kr} (${entry.romanization}) means "${entry.meaning}" — real Korean slang, explained. Example: ${entry.example.kr} — ${entry.example.en}`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/slang/${entry.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/slang/${entry.slug}`, siteName: "Kroot" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SlangSharePage({ params }: Props) {
  const { slug } = await params;
  const entry = getSlangBySlug(slug);
  if (!entry) notFound();

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
      url: `${SITE_URL}/slang`,
    },
  };

  return (
    <div className="min-h-screen bg-[#FFF7FB] text-[#221F1B]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-bold text-[#221F1B] text-xl">
          Kroot
        </Link>
        <Link
          href="/onboarding"
          className="rounded-full bg-[#DB2777] px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_0_#9D174D] hover:bg-[#C2185F] transition-colors"
        >
          Start learning
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <p className="mb-2 text-sm text-[#DB2777] font-semibold">Kroot · Street Talk 🇰🇷</p>

        <article className="relative border border-[#FBCFE8] rounded-[22px] bg-white p-8 sm:p-10 shadow-[0_14px_34px_-20px_rgba(219,39,119,.35)] text-center">
          {vibe && (
            <span className="inline-block text-[12px] font-semibold text-[#DB2777] bg-[#FDF2F8] border border-[#FBCFE8] rounded-full px-3 py-1 mb-5">
              {vibe.emoji} {vibe.label}
            </span>
          )}
          <h1 className="kr text-[clamp(48px,9vw,72px)] font-bold leading-none">{entry.kr}</h1>
          <p className="mt-3 text-lg text-[#6B6560]">
            {entry.romanization} · <span className="italic">literally &ldquo;{entry.literal}&rdquo;</span>
          </p>
          <p className="mt-5 text-2xl font-bold text-[#18181B]">{entry.meaning}</p>

          <div className="mt-7 border border-[#FBCFE8] rounded-[14px] bg-[#FDF2F8] px-5 py-4 text-left">
            <p className="kr text-lg font-medium text-[#18181B]">{entry.example.kr}</p>
            <p className="mt-1 text-[#6B6560]">{entry.example.en}</p>
          </div>

          {entry.origin && (
            <div className="mt-5 text-left">
              <p className="text-[11px] font-bold tracking-[.08em] uppercase text-[#A19A8C] mb-1.5">
                Where it comes from
              </p>
              <p className="text-[14.5px] text-[#6B6560] leading-relaxed">{entry.origin}</p>
            </div>
          )}
        </article>

        <section className="mt-10">
          <h2 className="text-lg font-bold">More slang like this</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((e) => (
              <li key={e.slug}>
                <Link
                  href={`/slang/${e.slug}`}
                  className="block rounded-2xl border border-[#F3E8EE] bg-white px-4 py-3 shadow-[0_3px_10px_-6px_rgba(219,39,119,.25)] hover:-translate-y-0.5 hover:border-[#FBCFE8] transition"
                >
                  <span className="kr font-bold">{e.kr}</span>{" "}
                  <span className="text-sm text-[#6B6560]">
                    {e.romanization} — {e.meaning}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-[24px] bg-[#FDF2F8] border border-[#FBCFE8] p-8 text-center">
          <h2 className="text-2xl font-bold text-[#831843]">
            106 more slang words like {entry.kr}, free
          </h2>
          <p className="mt-2 text-[#6B6560]">
            Flip through them all, hear how they sound, and start learning the Korean that&apos;s
            actually spoken today — not just textbook Korean.
          </p>
          <Link
            href="/onboarding"
            className="mt-5 inline-block rounded-full bg-[#DB2777] px-6 py-3 font-semibold text-white shadow-[0_3px_0_#9D174D] hover:bg-[#C2185F] transition-colors"
          >
            Start free →
          </Link>
        </section>
      </main>
    </div>
  );
}

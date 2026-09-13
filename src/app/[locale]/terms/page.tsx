import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Nav from "@/components/landing/Nav";
import { seoAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Terms of Service — Kroot",
    description: "The rules for using Kroot.",
    alternates: seoAlternates(locale, "/terms"),
  };
}

const EFFECTIVE_DATE = "September 12, 2026";
const CONTACT_EMAIL = "killpig2000@gmail.com";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 py-6 border-t border-dashed border-dash first:border-t-0 first:pt-0">
      <h2 className="font-bold text-[18px] tracking-[-0.01em] mb-3">{title}</h2>
      <div className="text-[14px] leading-[1.7] text-muted [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1.5 [&_a]:text-success-deep [&_a]:font-semibold [&_a:hover]:underline [&_b]:text-charcoal [&_b]:font-semibold">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <Nav />

      <main className="max-w-[720px] mx-auto px-[clamp(18px,4vw,28px)] py-[clamp(36px,6vw,60px)]">
        <p className="text-[11px] font-extrabold tracking-[.08em] uppercase text-faint mb-2">Legal</p>
        <h1 className="font-black text-[clamp(26px,4vw,34px)] tracking-[-0.02em] mb-2">Terms of Service</h1>
        <p className="text-[13px] text-faint mb-8">Effective {EFFECTIVE_DATE}</p>

        <div className="bg-cream border border-line rounded-[14px] px-5 py-4 mb-2 text-[13.5px] text-muted leading-[1.65]">
          These terms are the agreement between you and Kroot, a Korean-learning app built and run by
          a single independent developer. By creating an account or using the app you agree to them.
          How your data is handled is covered separately in the{" "}
          <Link href="/privacy" className="text-success-deep font-semibold hover:underline">Privacy Policy</Link>.
        </div>

        <Section id="the-service" title="The service">
          <p>
            Kroot offers Korean lessons — Hangul, vocabulary, listening, reading, writing and
            pronunciation practice — plus a garden, a tree that grows as you study, and rankings. Features may change, be added or be removed as the app develops.
          </p>
        </Section>

        <Section id="accounts" title="Your account">
          <ul>
            <li>You must be at least 13 years old to create an account.</li>
            <li>Give a real email address you can access, and keep your password to yourself. You&apos;re responsible for what happens under your account.</li>
            <li>One person per account. Don&apos;t create accounts to get around a suspension or to inflate rankings.</li>
          </ul>
        </Section>

        <Section id="virtual-items" title="Coins, costumes and XP">
          <p>
            Coins, XP, levels, costumes and other garden items are earned by studying. They are part of
            the game, have no cash value, and can&apos;t be sold, exchanged for money or moved to another
            account. Kroot may adjust balances that were earned through a bug or by abusing the app.
          </p>
        </Section>

        <Section id="acceptable-use" title="Using the app fairly">
          <p>
            Don&apos;t try to break, overload or reverse-engineer the app, scrape its content in bulk,
            use automated scripts to earn XP or coins, or use the audio service for anything other than
            studying in Kroot.
          </p>
        </Section>

        <Section id="ending" title="Deleting your account">
          <p>
            You can delete your account at any time in <Link href="/settings/account">Settings → Account</Link>.
            It&apos;s deleted right away, together with your progress. Kroot may
            suspend or close accounts that break these terms.
          </p>
        </Section>

        <Section id="content" title="Learning content">
          <p>
            Lessons, translations and audio are made with care, but they may contain mistakes. Kroot is
            a study aid, not an official language test or certification.
          </p>
        </Section>

        <Section id="liability" title="Disclaimer and liability">
          <p>
            Kroot is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of any
            kind, to the extent the law allows. The app may sometimes be unavailable or lose data despite
            reasonable care. To the extent the law allows, Kroot isn&apos;t liable for indirect or
            consequential losses arising from your use of the app. Nothing in these terms limits rights
            you have under the consumer laws of your country.
          </p>
        </Section>

        <Section id="changes" title="Changes to these terms">
          <p>
            If these terms change, the date at the top of this page will change and, for significant
            changes, you&apos;ll be notified in the app or by email. Continuing to use Kroot after a
            change means you accept the updated terms.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </main>
    </div>
  );
}

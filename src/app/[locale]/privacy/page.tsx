import Nav from "@/components/landing/Nav";

export const metadata = {
  title: "Privacy Policy — Kroot",
  description: "How Kroot collects, uses, and protects your data.",
};

const EFFECTIVE_DATE = "August 29, 2026";
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

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <Nav />

      <main className="max-w-[720px] mx-auto px-[clamp(18px,4vw,28px)] py-[clamp(36px,6vw,60px)]">
        <p className="text-[11px] font-extrabold tracking-[.08em] uppercase text-faint mb-2">Legal</p>
        <h1 className="font-black text-[clamp(26px,4vw,34px)] tracking-[-0.02em] mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-faint mb-8">Effective {EFFECTIVE_DATE}</p>

        <div className="bg-white border border-line rounded-[14px] px-5 py-4 mb-2 text-[13.5px] text-muted leading-[1.65]">
          Kroot is a Korean-learning app built and run by a single independent
          developer, not a company. This page explains what data the app
          collects, why, and how you can get it deleted. If anything here is
          unclear, email <a href={`mailto:${CONTACT_EMAIL}`} className="text-success-deep font-semibold hover:underline">{CONTACT_EMAIL}</a>{" "}
          — a real person reads it.
        </div>

        <Section id="what-we-collect" title="What Kroot collects">
          <p>Kroot collects only what&apos;s needed to run your account and track your learning progress:</p>
          <ul>
            <li><b>Account info</b> — the email address and password you sign up with (Kroot never sees your password itself; it&apos;s handled by our auth provider, Supabase), plus a display name and, if you choose to add one, a profile photo.</li>
            <li><b>Learning data</b> — your level, streak, XP, which words and lessons you&apos;ve studied, quiz answers, spaced-repetition history, and any writing you submit for correction.</li>
            <li><b>Usage events</b> — which pages and features you use, so we know what&apos;s actually helping people learn. These are tied to your account (or an anonymous ID before you sign up), never sold, and never shared with advertisers.</li>
            <li><b>Support messages</b> — anything you send through the in-app feedback form, along with the page you sent it from.</li>
            <li><b>Push notification token</b> — only if you turn on streak reminders. You can turn this off at any time in <a href="/profile#reminders">Settings</a>.</li>
            <li><b>Payment status</b> — if you subscribe to Kroot Plus, we know that you&apos;re subscribed and until when. Kroot never sees or stores your card number; that&apos;s handled entirely by Stripe.</li>
          </ul>
          <p>Kroot doesn&apos;t knowingly collect precise location, contacts, or any data beyond what&apos;s listed above, and doesn&apos;t run third-party ad tracking.</p>
        </Section>

        <Section id="how-we-use-it" title="How it's used">
          <ul>
            <li>To run your account: log you in, save your progress, and show you the right lessons at the right level.</li>
            <li>To send you the emails you&apos;d expect — sign-up confirmation, password reset, and (only if you opt in) streak reminders.</li>
            <li>To read out Korean words and sentences using text-to-speech.</li>
            <li>To fix bugs and improve the app, using aggregated usage patterns rather than reading individual accounts.</li>
            <li>To respond when you contact us for support.</li>
          </ul>
        </Section>

        <Section id="who-we-share-with" title="Who your data passes through">
          <p>
            Kroot doesn&apos;t sell your data or share it with advertisers. Running the app does mean a
            few specialized services process it on Kroot&apos;s behalf, each only for the job named below:
          </p>
          <ul>
            <li><b>Supabase</b> — hosts the database and handles login (stores your account, progress, and password securely).</li>
            <li><b>Vercel</b> — hosts the app and provides privacy-focused, cookie-free traffic analytics.</li>
            <li><b>Stripe</b> — processes Kroot Plus payments. Your card details go directly to Stripe; Kroot never receives them.</li>
            <li><b>Brevo</b> — sends transactional emails (sign-up confirmation, password reset, reminders).</li>
            <li><b>Microsoft</b> — converts Korean text to speech audio for pronunciation playback. Only the text being read is sent, not your identity.</li>
          </ul>
          <p>Each of these providers is contractually restricted to using your data only to provide their service to Kroot — not for their own purposes.</p>
        </Section>

        <Section id="cookies" title="Cookies">
          <p>
            Kroot uses one essential cookie to keep you signed in — that&apos;s it. There are no
            advertising or cross-site tracking cookies.
          </p>
        </Section>

        <Section id="retention-deletion" title="Data retention & deletion">
          <p>
            Your data is kept for as long as your account is active. To delete your account and all
            associated data, email <a href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20Kroot%20account`}>{CONTACT_EMAIL}</a>{" "}
            from the address you signed up with — it&apos;s handled within 30 days. Anonymized, aggregated
            usage statistics that can no longer be tied to you may be kept for product improvement.
          </p>
        </Section>

        <Section id="childrens-privacy" title="Children's privacy">
          <p>
            Kroot isn&apos;t directed at children under 13, and knowingly collecting personal information
            from a child under 13 isn&apos;t something we do. If you believe a child has created an
            account, email us and it will be removed.
          </p>
        </Section>

        <Section id="your-rights" title="Your rights">
          <p>
            Wherever you are, you can ask for a copy of your data, a correction, or deletion at any
            time by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If you&apos;re in the
            EU/UK or California, this covers your rights under GDPR and the CCPA respectively —
            there&apos;s no separate process, just email and it gets done.
          </p>
        </Section>

        <Section id="security" title="Security">
          <p>
            Your data is encrypted in transit (HTTPS) and at rest by our infrastructure providers.
            Access to production data is limited to the developer running Kroot.
          </p>
        </Section>

        <Section id="changes" title="Changes to this policy">
          <p>
            If this policy changes in a way that affects how your data is handled, the date at the
            top of this page will change and, for significant changes, you&apos;ll be notified by email.
          </p>
        </Section>

        <Section id="contact" title="Contact">
          <p>
            Questions, requests, or concerns about your data: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>
      </main>
    </div>
  );
}

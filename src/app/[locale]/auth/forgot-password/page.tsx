"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import { createClient } from "@/lib/supabase/client";
import { useHydrated } from "@/lib/use-hydrated";
import BrandMark from "@/components/ui/BrandMark";
import { verifyEmailCode } from "@/lib/verify-email-code";

const CARD = "border border-line rounded-[14px] bg-cream p-[clamp(22px,4vw,32px)]";
const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-line rounded-[9px] bg-cream text-charcoal placeholder:text-faint focus:outline-none focus:border-success transition-colors";
const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-charcoal";
const BTN_GREEN =
  "inline-flex items-center justify-center rounded-[9px] bg-success px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-success-deep transition-colors";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const hydrated = useHydrated();
  const busy = submitting || !hydrated;

  // The reset mail's link is single-use, and inboxes that scan links for
  // phishing (Naver, most corporate gateways) open it first — so it reaches
  // the learner already spent. The emailed code is the way in for them:
  // verifying it as a recovery OTP opens the same short session the link
  // would have, and the new-password form takes it from there.
  async function handleCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = code.replace(/\s+/g, "");
    if (!sent || !clean) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await verifyEmailCode(supabase, sent, clean, ["recovery"]);
      if (!res.ok) {
        setError(/rate limit/i.test(res.message) ? t("errors.rateLimit") : t("errors.badCode"));
        return;
      }
      // Hard navigation so the server sees the session cookies just written.
      window.location.assign("/auth/update-password");
    } catch {
      setError(t("errors.network"));
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }
      setSent(email);
    } catch {
      setError(t("errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream text-charcoal">
      <header className="border-b border-line">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,44px)] py-3">
          <Link
            href="/"
            className="flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em]"
          >
            <BrandMark size={30} />
            Kroot
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-[18px] py-[clamp(24px,4vw,48px)]">
        <div className="w-[min(520px,100%)]">
          <div className={`${CARD} ${sent ? "text-center" : ""}`}>
            <Mascot />
            {sent ? (
              <>
                <h1 className="font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1.5">
                  {t("forgot.sentTitle")}
                </h1>
                <p className="text-muted text-[13.5px] leading-[1.6]">
                  {t("forgot.sentBody")}
                </p>
                <form onSubmit={handleCode} className="text-left mt-5 pt-4 border-t border-dashed border-line">
                  <label htmlFor="reset-code" className={LABEL}>
                    {t("forgot.codeLabel")}
                  </label>
                  <input
                    id="reset-code"
                    className={`${FIELD} text-center tracking-[0.3em] font-bold`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="••••••••"
                  />
                  {error && <CuteError>{error}</CuteError>}
                  <button
                    type="submit"
                    disabled={verifying || !code.replace(/\s+/g, "")}
                    className={`${BTN_GREEN} w-full mt-2.5 disabled:opacity-60`}
                  >
                    {verifying ? t("forgot.verifying") : t("forgot.codeSubmit")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                  {t("forgot.title")}
                </h1>
                <p className="text-center text-muted text-[13.5px] mb-6">
                  {t("forgot.sub")}
                </p>

                <form method="post" onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label htmlFor="email" className={LABEL}>
                      {t("fields.email")}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="maria@email.com"
                      autoComplete="email"
                      className={FIELD}
                    />
                  </div>

                  {error && <CuteError>{error}</CuteError>}

                  <button type="submit" disabled={busy} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                    {submitting ? t("forgot.submitting") : t("forgot.submit")}
                  </button>
                </form>
              </>
            )}
            <p className="text-center text-[12.5px] text-muted mt-4">
              <Link href="/auth/login" className="text-charcoal font-semibold hover:underline">
                {t("forgot.backToLogin")}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

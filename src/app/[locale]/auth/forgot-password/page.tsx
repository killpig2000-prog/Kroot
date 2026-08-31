"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import { createClient } from "@/lib/supabase/client";
import { useHydrated } from "@/lib/use-hydrated";
import BrandMark from "@/components/ui/BrandMark";

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
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const hydrated = useHydrated();
  const busy = submitting || !hydrated;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });
    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
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

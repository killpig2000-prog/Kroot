"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import { createClient } from "@/lib/supabase/client";

const CARD = "border border-[#E3DDD0] rounded-[14px] bg-white p-[clamp(22px,4vw,32px)]";
const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-[#E3DDD0] rounded-[9px] bg-white text-[#18181B] placeholder:text-[#A19A8C] focus:outline-none focus:border-[#16A34A] transition-colors";
const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-[#18181B]";
const BTN_GREEN =
  "inline-flex items-center justify-center rounded-[9px] bg-[#16A34A] px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-[#15803D] transition-colors";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-white text-[#18181B]">
      <header className="border-b border-[#E3DDD0]">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,44px)] py-3">
          <Link
            href="/"
            className="flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em]"
          >
            <span className="w-[30px] h-[30px] rounded-lg bg-[#16A34A] text-white flex items-center justify-center kr text-sm">
              한
            </span>
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
                  Check your inbox
                </h1>
                <p className="text-[#6B6560] text-[13.5px] leading-[1.6]">
                  If that email has an account, we sent a reset link. Open it on this device to set
                  a new password.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                  Reset your password
                </h1>
                <p className="text-center text-[#6B6560] text-[13.5px] mb-6">
                  We&apos;ll email you a link to set a new one.
                </p>

                <form onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <label htmlFor="email" className={LABEL}>
                      Email
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

                  <button type="submit" disabled={submitting} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                    {submitting ? "Sending…" : "Send reset link"}
                  </button>
                </form>
              </>
            )}
            <p className="text-center text-[12.5px] text-[#6B6560] mt-4">
              <Link href="/auth/login" className="text-[#18181B] font-semibold hover:underline">
                Back to log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

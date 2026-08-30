"use client";

import { useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hydrated = useHydrated();
  const busy = submitting || !hydrated;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("pw") || "");
    const confirm = String(form.get("pw2") || "");
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setError(
        error.message.includes("Auth session missing")
          ? "This reset link expired or was opened in a different browser. Request a new one."
          : error.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          <div className={CARD}>
            <Mascot />
            <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
              Set a new password
            </h1>
            <p className="text-center text-muted text-[13.5px] mb-6">
              Pick something strong — at least 8 characters.
            </p>

            <form method="post" onSubmit={handleSubmit}>
              <div className="mb-3.5">
                <label htmlFor="pw" className={LABEL}>
                  New password
                </label>
                <input
                  id="pw"
                  name="pw"
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className={FIELD}
                />
              </div>
              <div className="mb-5">
                <label htmlFor="pw2" className={LABEL}>
                  Confirm password
                </label>
                <input
                  id="pw2"
                  name="pw2"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Same password again"
                  autoComplete="new-password"
                  className={FIELD}
                />
              </div>

              {error && <CuteError>{error}</CuteError>}

              <button type="submit" disabled={busy} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                {submitting ? "Saving…" : "Save new password"}
              </button>
            </form>
            <p className="text-center text-[12.5px] text-muted mt-4">
              <Link href="/auth/forgot-password" className="text-charcoal font-semibold hover:underline">
                Request a new link
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

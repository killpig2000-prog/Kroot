"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import { createClient } from "@/lib/supabase/client";
import BrandMark from "@/components/ui/BrandMark";

const CARD = "border border-line rounded-[14px] bg-cream p-[clamp(22px,4vw,32px)]";
const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-line rounded-[9px] bg-cream text-charcoal placeholder:text-faint focus:outline-none focus:border-success transition-colors";
const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-charcoal";
const BTN_GREEN =
  "inline-flex items-center justify-center rounded-[9px] bg-success px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-success-deep transition-colors";
const BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-[9px] border border-line bg-cream px-[18px] py-[9px] text-[13.5px] font-semibold text-charcoal hover:bg-warm transition-colors";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "Sign-in link failed or expired. Please log in again.",
  expired: "Your session expired. Please log in again.",
};

// Only allow same-site paths as post-login destinations.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const code = new URLSearchParams(window.location.search).get("error");
    if (!code) return null;
    return ERROR_MESSAGES[code] ?? decodeURIComponent(code);
  });
  const [next] = useState(() =>
    typeof window === "undefined"
      ? "/dashboard"
      : safeNext(new URLSearchParams(window.location.search).get("next"))
  );
  const [submitting, setSubmitting] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Already signed in? Straight to the app.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace(next);
    });
  }, [supabase, router, next]);

  async function handleGoogleLogin() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // Always show Google's account chooser instead of silently reusing
        // the last session — many learners share devices or test accounts.
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("pw") || "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "That email and password don't match our garden records. One more try — or reset your password below."
          : error.message === "Email not confirmed"
            ? "Your seed isn't confirmed yet! Tap the link in your inbox first, then come back."
            : error.message
      );
      return;
    }

    router.push(next);
    router.refresh();
  }

  // Learners who signed up with a magic link have no password — offer the
  // same link here rather than sending them through "forgot password".
  async function handleMagicLink() {
    const form = formRef.current;
    const email = String(new FormData(form ?? undefined).get("email") || "").trim();
    if (!email) {
      form?.reportValidity();
      setError("Type your email above first, and we'll send the link there.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setSubmitting(false);
    if (error) {
      setError(
        /signups not allowed|not found/i.test(error.message)
          ? "We couldn't find a garden for that email. New here? Plant your seed below."
          : error.message
      );
      return;
    }
    setLinkSentTo(email);
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
          <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
            <div className={CARD}>
              <Mascot />
              <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                Welcome back
              </h1>
              <p className="text-center text-muted text-[13.5px] mb-6">
                Your garden missed you. <span className="kr text-success">다시 만나서 반가워요!</span>
              </p>

              <button type="button" className={`${BTN_OUTLINE} w-full mb-4`} onClick={handleGoogleLogin}>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-5 text-[11.5px] font-medium text-faint">
                <span className="flex-1 h-px bg-line" />
                or with email
                <span className="flex-1 h-px bg-line" />
              </div>

              <form ref={formRef} onSubmit={handleEmailLogin}>
                <div className="mb-3.5">
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
                <div className="mb-5">
                  <label htmlFor="pw" className={LABEL}>
                    Password
                  </label>
                  <input
                    id="pw"
                    name="pw"
                    type="password"
                    required
                    placeholder="Your password"
                    autoComplete="current-password"
                    className={FIELD}
                  />
                </div>

                {error && <CuteError>{error}</CuteError>}
                {linkSentTo && (
                  <p className="text-[13px] text-success-deep bg-success-bg border border-success-line rounded-[9px] px-3.5 py-2.5 mb-3.5">
                    Sign-in link sent to <b>{linkSentTo}</b> — tap it and you&apos;re in.
                  </p>
                )}

                <button type="submit" disabled={submitting} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                  {submitting ? "Watering…" : "Log in"}
                </button>
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={submitting}
                  className={`${BTN_OUTLINE} w-full mt-2.5 disabled:opacity-60`}
                >
                  Email me a sign-in link instead
                </button>
              </form>

              <p className="text-center text-[12.5px] text-muted mt-4">
                <Link href="/auth/forgot-password" className="text-charcoal font-semibold hover:underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-center text-[12.5px] text-muted mt-2">
                New to Kroot?{" "}
                <Link
                  href={next === "/dashboard" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(next)}`}
                  className="text-charcoal font-semibold hover:underline"
                >
                  Plant your seed
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      <style>{`@keyframes fade{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

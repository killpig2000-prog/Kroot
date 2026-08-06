"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import { createClient } from "@/lib/supabase/client";

const CARD = "border border-[#E3DDD0] rounded-[14px] bg-white p-[clamp(22px,4vw,32px)]";
const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-[#E3DDD0] rounded-[9px] bg-white text-[#18181B] placeholder:text-[#A19A8C] focus:outline-none focus:border-[#16A34A] transition-colors";
const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-[#18181B]";
const BTN_GREEN =
  "inline-flex items-center justify-center rounded-[9px] bg-[#16A34A] px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-[#15803D] transition-colors";
const BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-[9px] border border-[#E3DDD0] bg-white px-[18px] py-[9px] text-[13.5px] font-semibold text-[#18181B] hover:bg-[#FAF7EF] transition-colors";

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
          <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
            <div className={CARD}>
              <Mascot />
              <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                Welcome back
              </h1>
              <p className="text-center text-[#6B6560] text-[13.5px] mb-6">
                Your garden missed you. <span className="kr text-[#16A34A]">다시 만나서 반가워요!</span>
              </p>

              <button type="button" className={`${BTN_OUTLINE} w-full mb-4`} onClick={handleGoogleLogin}>
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-5 text-[11.5px] font-medium text-[#A19A8C]">
                <span className="flex-1 h-px bg-[#E3DDD0]" />
                or with email
                <span className="flex-1 h-px bg-[#E3DDD0]" />
              </div>

              <form onSubmit={handleEmailLogin}>
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

                <button type="submit" disabled={submitting} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                  {submitting ? "Watering…" : "Log in"}
                </button>
              </form>

              <p className="text-center text-[12.5px] text-[#6B6560] mt-4">
                <Link href="/auth/forgot-password" className="text-[#18181B] font-semibold hover:underline">
                  Forgot your password?
                </Link>
              </p>
              <p className="text-center text-[12.5px] text-[#6B6560] mt-2">
                New to Kroot?{" "}
                <Link href="/onboarding" className="text-[#18181B] font-semibold hover:underline">
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

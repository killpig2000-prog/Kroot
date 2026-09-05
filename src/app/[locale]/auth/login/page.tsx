"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { stripLocale } from "@/i18n/locale";
import Mascot from "@/components/onboarding/Mascot";
import CuteError from "@/components/ui/CuteError";
import CodeInput from "@/components/ui/CodeInput";
import { createClient } from "@/lib/supabase/client";
import { verifyEmailCode } from "@/lib/verify-email-code";
import { authErrorKey, cleanCode, CODE_LENGTH, MAX_CODE_TRIES, normalizeEmail } from "@/lib/auth-errors";
import { useHydrated } from "@/lib/use-hydrated";
import BrandMark from "@/components/ui/BrandMark";

const CARD = "border border-line rounded-[14px] bg-cream p-[clamp(22px,4vw,32px)]";
const FIELD =
  "w-full px-3.5 py-[11px] text-[14px] border border-line rounded-[9px] bg-cream text-charcoal placeholder:text-faint focus:outline-none focus:border-success transition-colors";
const LABEL = "block text-[12.5px] font-semibold mb-[6px] text-charcoal";
const BTN_GREEN =
  "inline-flex items-center justify-center rounded-[9px] bg-success px-[18px] py-[9px] text-[13.5px] font-semibold text-white hover:bg-success-deep transition-colors";
const BTN_OUTLINE =
  "inline-flex items-center justify-center rounded-[9px] border border-line bg-cream px-[18px] py-[9px] text-[13.5px] font-semibold text-charcoal hover:bg-warm transition-colors";

// The only values ?error= may render. Anything else is discarded rather than
// shown, because this parameter is attacker-controllable: the page is reached
// by a plain GET, so a crafted link puts arbitrary text on the real login
// screen, under the real domain, next to a real password field. React escapes
// it so it is not XSS — it is a ready-made phishing page ("your account is
// locked, email support@...") that we would be hosting ourselves.
const ERROR_CODES = ["auth", "expired"] as const;

function messageKeyFor(code: string | null): (typeof ERROR_CODES)[number] | null {
  if (!code) return null;
  if ((ERROR_CODES as readonly string[]).includes(code)) {
    return code as (typeof ERROR_CODES)[number];
  }
  // Keep the real reason for us, show the visitor a generic one.
  console.warn("login: unrecognised ?error= value discarded");
  return "auth";
}

// Only allow same-site paths as post-login destinations. The proxy sends us
// the full pathname (e.g. /ja/vocabulary); the locale prefix is dropped
// because next-intl's router re-adds the active one, and the auth callback
// lands on the bare path, which the proxy then re-prefixes from the cookie.
// "/\host" parses like "//host" in browsers (backslash is a slash to the URL
// parser), so both are rejected.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !/^\/[/\\]/.test(raw)) return stripLocale(raw);
  return "/dashboard";
}

export default function LoginPage() {
  const t = useTranslations("auth");
  const supabase = useMemo(() => createClient(), []);
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const key = messageKeyFor(new URLSearchParams(window.location.search).get("error"));
    return key ? t(`errors.${key}`) : null;
  });
  const [next] = useState(() =>
    typeof window === "undefined"
      ? "/dashboard"
      : safeNext(new URLSearchParams(window.location.search).get("next"))
  );
  const [submitting, setSubmitting] = useState(false);
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [codeTries, setCodeTries] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const hydrated = useHydrated();
  const busy = submitting || !hydrated;

  useEffect(() => {
    // Already signed in? Straight to the app. Hard navigation for the same
    // reason as handleEmailLogin below: a soft router.replace() can serve a
    // stale signed-out router-cache entry for `next`.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.assign(next);
    });
  }, [supabase, next]);

  async function handleGoogleLogin() {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          // Always show Google's account chooser instead of silently reusing
          // the last session — many learners share devices or test accounts.
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) setError(t(`errors.${authErrorKey(error)}`));
    } catch {
      // Offline, this rejected unhandled: the tap did nothing, said nothing,
      // and the button stayed live as if it had never been pressed.
      setError(t("errors.network"));
    } finally {
      // On success the browser is already navigating to Google; releasing the
      // flag costs nothing and keeps a cancelled redirect from freezing it.
      setSubmitting(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = normalizeEmail(String(form.get("email") || ""));
    const password = String(form.get("pw") || "");
    if (!email || !password) {
      setError(t(email ? "errors.badCredentials" : "errors.badEmail"));
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(t(`errors.${authErrorKey(error)}`));
        return;
      }

      // A soft router.replace() can serve a stale, signed-out router-cache
      // entry for `next` (e.g. prefetched while logged out, which renders
      // as a redirect into /onboarding's Hangul gate) before router.refresh()
      // catches up a beat later — seen as the onboarding screen flashing
      // before the real destination. A hard navigation always re-requests
      // the page from the server with the just-set session cookie attached.
      window.location.assign(next);
    } catch {
      setError(t("errors.network"));
    } finally {
      // A dropped connection used to leave Sign in disabled for good — the
      // worst possible place for it, since a reload is the only way out.
      setSubmitting(false);
    }
  }

  // Learners who signed up with a magic link have no password — offer the
  // same link here rather than sending them through "forgot password".
  async function handleMagicLink() {
    const form = formRef.current;
    const raw = String(new FormData(form ?? undefined).get("email") || "");
    const email = normalizeEmail(raw);
    if (!email) {
      setError(t(raw.trim() ? "errors.badEmail" : "errors.emailFirst"));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) {
        setError(t(`errors.${authErrorKey(error)}`));
        return;
      }
      setCode("");
      setCodeTries(0);
      setLinkSentTo(email);
    } catch {
      setError(t("errors.network"));
    } finally {
      setSubmitting(false);
    }
  }

  // Sign in with the code from that same email, for inboxes whose link
  // scanner spends the link before the learner can use it.
  async function handleCode() {
    const clean = cleanCode(code);
    if (!linkSentTo || clean.length !== CODE_LENGTH || verifying) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await verifyEmailCode(supabase, linkSentTo, clean);
      if (!res.ok) {
        const tries = res.key === "badCode" ? codeTries + 1 : codeTries;
        setCodeTries(tries);
        setError(t(`errors.${res.key === "badCode" && tries >= MAX_CODE_TRIES ? "tooManyTries" : res.key}`));
        return;
      }
      // Full navigation, not router.push: the server needs the session
      // cookies this call just wrote.
      window.location.assign(next);
    } catch {
      setError(t("errors.network"));
    } finally {
      setVerifying(false);
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
          <section className="animate-[fade_.45s_cubic-bezier(.2,.8,.2,1)]">
            <div className={CARD}>
              <Mascot />
              <h1 className="text-center font-semibold text-[clamp(20px,3vw,25px)] tracking-[-0.02em] leading-[1.25] mb-1">
                {t("login.title")}
              </h1>
              <p className="text-center text-muted text-[13.5px] mb-6">
                {t("login.sub")} <span className="kr text-success">다시 만나서 반가워요!</span>
              </p>

              <button type="button" className={`${BTN_OUTLINE} w-full mb-4`} onClick={handleGoogleLogin}>
                {t("login.google")}
              </button>
              <div className="flex items-center gap-3 mb-5 text-[11.5px] font-medium text-faint">
                <span className="flex-1 h-px bg-line" />
                {t("login.orEmail")}
                <span className="flex-1 h-px bg-line" />
              </div>

              {/* method="post" so that a submit landing before hydration puts
                  the password in a discarded request body, never in the URL;
                  the disabled button below keeps it from getting that far. */}
              <form ref={formRef} method="post" onSubmit={handleEmailLogin}>
                <div className="mb-3.5">
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
                <div className="mb-5">
                  <label htmlFor="pw" className={LABEL}>
                    {t("fields.password")}
                  </label>
                  <input
                    id="pw"
                    name="pw"
                    type="password"
                    required
                    placeholder={t("fields.passwordPlaceholder")}
                    autoComplete="current-password"
                    className={FIELD}
                  />
                </div>

                {error && <CuteError>{error}</CuteError>}
                {linkSentTo && (
                  <div className="mb-3.5">
                    <p className="text-[13px] text-success-deep bg-success-bg border border-success-line rounded-[9px] px-3.5 py-2.5">
                      {t.rich("login.linkSent", { email: linkSentTo, b: (chunks) => <b>{chunks}</b> })}
                    </p>
                    {/* Mail providers that scan links for phishing open the
                        single-use link before the learner does, so it arrives
                        already spent. The emailed code can't be consumed that
                        way — see the same rescue on the sign-up confirm card. */}
                    <label className={LABEL} htmlFor="login-code">
                      {t("login.codeLabel")}
                    </label>
                    <CodeInput
                      id="login-code"
                      className={`${FIELD} text-center tracking-[0.3em] font-bold`}
                      value={code}
                      onChange={setCode}
                      onEnter={() => void handleCode()}
                      clearLabel={t("login.clearCode")}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCode}
                      disabled={busy || verifying || cleanCode(code).length !== CODE_LENGTH}
                      className={`${BTN_OUTLINE} w-full mt-2.5 disabled:opacity-60`}
                    >
                      {verifying ? t("login.verifying") : t("login.codeSubmit")}
                    </button>
                  </div>
                )}

                <button type="submit" disabled={busy} className={`${BTN_GREEN} w-full disabled:opacity-60`}>
                  {submitting ? t("login.submitting") : t("login.submit")}
                </button>
                <button
                  type="button"
                  onClick={handleMagicLink}
                  disabled={busy}
                  className={`${BTN_OUTLINE} w-full mt-2.5 disabled:opacity-60`}
                >
                  {t("login.magicLink")}
                </button>
              </form>

              <p className="text-center text-[12.5px] text-muted mt-4">
                <Link href="/auth/forgot-password" className="text-charcoal font-semibold hover:underline">
                  {t("login.forgot")}
                </Link>
              </p>
              <p className="text-center text-[12.5px] text-muted mt-2">
                {t("login.newHere")}{" "}
                <Link
                  href={next === "/dashboard" ? "/onboarding" : `/onboarding?next=${encodeURIComponent(next)}`}
                  className="text-charcoal font-semibold hover:underline"
                >
                  {t("login.signUp")}
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

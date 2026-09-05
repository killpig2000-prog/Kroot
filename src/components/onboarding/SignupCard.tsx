"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import CuteError from "@/components/ui/CuteError";
import { useHydrated } from "@/lib/use-hydrated";
import type { FirstLesson, Placement } from "@/lib/level-test";
import { FirstLessonList } from "./PlacementResult";
import { BTN_GHOST, BTN_GREEN, BTN_OUTLINE, CARD, FADE, FIELD, H1, LABEL, SUB } from "./styles";
import { cleanCode, CODE_LENGTH, MIN_PASSWORD } from "@/lib/auth-errors";

function GoogleMark() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

// Step 5 — the account, after the level. Google, or email + password (the
// password is what later logins use; the inbox is only visited once, to
// confirm the address). Either way the placement rides along in the
// callback URL.
export function SignupCard({
  placement,
  firstLesson,
  loginHref,
  error,
  sending,
  onGoogle,
  onSignUp,
}: {
  placement: Placement;
  firstLesson: FirstLesson | undefined;
  loginHref: string;
  error: string | null;
  sending: boolean;
  onGoogle: () => void;
  onSignUp: (email: string, name: string, password: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const hydrated = useHydrated();
  const t = useTranslations("onboarding.signup");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSignUp(
      String(form.get("email") || "").trim(),
      String(form.get("name") || "").trim(),
      String(form.get("password") || "")
    );
  }

  return (
    <section className={FADE}>
      <div className={CARD}>
        <h1 className={`${H1} mb-4`}>{t("title")}</h1>

        <div className="flex items-center gap-3 border border-success-line bg-success-bg rounded-[12px] px-3 py-2.5 mb-4 text-[13px]">
          <span className="hand font-bold text-[22px] text-success-deep">{placement.level}</span>
          <span className="min-w-0">
            <b className="block truncate text-charcoal">
              {placement.route === "hangul" ? t("hangulFirst") : firstLesson ? firstLesson.label : t("levelLessons", { level: placement.level })}
            </b>
          </span>
        </div>

        {/* Consent gates BOTH paths, so it sits above both rather than inside
            the email form. It used to live below the divider, which meant a
            visitor who wanted Google had to scroll down into the email
            section, find a checkbox, tick it, and scroll back up to a button
            that had been disabled the whole time — most just filled in the
            email form instead. */}
        <label className="flex gap-2 items-start text-[12px] text-muted mb-3.5">
          <input type="checkbox" className="mt-[3px] accent-[var(--c-success)]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            {t.rich("agree", {
              link: (chunks) => (
                <Link href="/privacy" className="text-charcoal font-semibold hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        {/* Google carries the primary style and the email form the outline
            one, which is the reverse of how this card used to read. The two
            paths are not equivalent: Google is uncapped, while the email link
            goes through a rate-limited sender, so a burst of signups on the
            email path is the one thing that can actually turn people away at
            the door. Pointing the eye at the button that always works is
            free. */}
        <button type="button" className={`${BTN_GREEN} w-full`} onClick={onGoogle} disabled={!agreed}>
          <GoogleMark />
          {t("google")}
        </button>
        <p className="text-center text-[11.5px] text-faint mt-2">{t("googleFast")}</p>
        <div className="flex items-center gap-3 my-4 text-[11.5px] font-medium text-faint">
          <span className="flex-1 h-px bg-line" />
          {t("orEmail")}
          <span className="flex-1 h-px bg-line" />
        </div>

        <form method="post" onSubmit={submit}>
          <label htmlFor="email" className={LABEL}>
            {t("email")}
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" className={`${FIELD} mb-3`} />
          <label htmlFor="name" className={LABEL}>
            {t("nameLabel")}
          </label>
          <input id="name" name="name" type="text" required autoComplete="given-name" placeholder={t("namePlaceholder")} className={`${FIELD} mb-3`} />
          <label htmlFor="password" className={LABEL}>
            {t("password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD}
            maxLength={72}
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            className={`${FIELD} mb-3`}
          />
          {error && <CuteError>{error}</CuteError>}

          <button type="submit" className={`${BTN_OUTLINE} w-full`} disabled={!agreed || sending || !hydrated}>
            {sending ? t("sending") : t("create")}
          </button>
        </form>
        <p className="text-center text-[12px] text-faint mt-3.5">
          {t("alreadyHere")}{" "}
          <Link href={loginHref} className="text-charcoal font-semibold hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </section>
  );
}

// Step 6 — the inbox moment. Shows where the link went and gets them there,
// with the emailed code as a second way in for the many mail providers whose
// phishing scanners open (and thereby spend) the single-use link first.
export function ConfirmCard({
  email,
  firstLesson,
  resent,
  sending,
  cooldown,
  error,
  verifying,
  onVerifyCode,
  onResend,
  onChangeEmail,
}: {
  email: string;
  firstLesson: FirstLesson | undefined;
  resent: boolean;
  sending: boolean;
  /** Seconds left before resend is allowed again; 0 means ready. */
  cooldown: number;
  error: string | null;
  verifying: boolean;
  onVerifyCode: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const t = useTranslations("onboarding.confirm");
  // Digits only, capped at the code length, so a pasted "1234 5678" or a
  // stray letter can't produce a request that is wrong before it is sent.
  const [code, setCode] = useState("");
  const clean = cleanCode(code);
  const complete = clean.length === CODE_LENGTH;
  return (
    <section className={FADE}>
      <div className={`${CARD} text-center`}>
        <h1 className={H1}>{t("title")}</h1>
        <p className={SUB}>
          {t.rich("sub", { email, b: (chunks) => <b className="text-charcoal">{chunks}</b> })}
        </p>
        {/* The code is the whole step: no link to tap, so the same
            confirmation works in every inbox, including the ones whose
            phishing scanners open (and spend) one-shot links. */}
        <form
          className="text-left mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (complete && !verifying) onVerifyCode(clean);
          }}
        >
          <label className={LABEL} htmlFor="signin-code">
            {t("codeLabel")}
          </label>
          <input
            id="signin-code"
            className={`${FIELD} text-center text-[22px] tracking-[0.35em] font-bold`}
            value={clean}
            onChange={(e) => setCode(cleanCode(e.target.value))}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            autoFocus
            placeholder="••••••••"
          />
          {error && <CuteError>{error}</CuteError>}
          <button type="submit" className={`${BTN_GREEN} w-full mt-2.5`} disabled={!complete || verifying}>
            {verifying ? t("verifying") : t("codeSubmit")}
          </button>
        </form>

        {firstLesson && <FirstLessonList lessons={[firstLesson]} title={t("upNext")} />}
        <div className="flex gap-2 justify-center flex-wrap mt-2">
          <a href="https://mail.google.com" target="_blank" rel="noreferrer" className={BTN_OUTLINE}>
            {t("gmail")}
          </a>
          <a href="https://outlook.live.com/mail/" target="_blank" rel="noreferrer" className={BTN_OUTLINE}>
            {t("outlook")}
          </a>
        </div>
        <p className="text-[12px] text-faint mt-4">
          {resent ? t("sentAgain") : t("nothingYet")}{" "}
          <button type="button" className={`${BTN_GHOST} text-charcoal font-semibold`} onClick={onResend} disabled={sending || cooldown > 0}>
            {cooldown > 0 ? t("resendIn", { n: cooldown }) : t("resend")}
          </button>{" "}
          ·{" "}
          <button type="button" className={`${BTN_GHOST} text-charcoal font-semibold`} onClick={onChangeEmail}>
            {t("changeEmail")}
          </button>
        </p>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import CuteError from "@/components/ui/CuteError";
import type { FirstLesson, Placement } from "@/lib/level-test";
import { FirstLessonList } from "./PlacementResult";
import { BTN_GHOST, BTN_GREEN, BTN_OUTLINE, CARD, FADE, FIELD, H1, LABEL, SUB } from "./styles";

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

// Step 5 — the account, after the level. Google, or a passwordless email
// link; either way the placement rides along in the callback URL.
export function SignupCard({
  placement,
  firstLesson,
  loginHref,
  error,
  sending,
  onGoogle,
  onMagicLink,
}: {
  placement: Placement;
  firstLesson: FirstLesson | undefined;
  loginHref: string;
  error: string | null;
  sending: boolean;
  onGoogle: () => void;
  onMagicLink: (email: string, name: string) => void;
}) {
  const [agreed, setAgreed] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onMagicLink(String(form.get("email") || "").trim(), String(form.get("name") || "").trim());
  }

  return (
    <section className={FADE}>
      <div className={CARD}>
        <h1 className={H1}>Keep your spot</h1>
        <p className={SUB}>Save your level so your tree remembers you.</p>

        <div className="flex items-center gap-3 border border-success-line bg-success-bg rounded-[12px] px-3 py-2.5 mb-4 text-[13px]">
          <span className="hand font-bold text-[22px] text-success-deep">{placement.level}</span>
          <span className="min-w-0">
            <b className="block truncate text-charcoal">
              {placement.route === "hangul" ? "Hangul first, then A1" : firstLesson ? firstLesson.label : `${placement.level} lessons`}
            </b>
            <small className="block text-success-deep text-[12px]">ready to start the moment you&apos;re in</small>
          </span>
        </div>

        <button type="button" className={`${BTN_OUTLINE} w-full`} onClick={onGoogle} disabled={!agreed}>
          <GoogleMark />
          Continue with Google
        </button>
        <div className="flex items-center gap-3 my-4 text-[11.5px] font-medium text-faint">
          <span className="flex-1 h-px bg-line" />
          or with email
          <span className="flex-1 h-px bg-line" />
        </div>

        <form onSubmit={submit}>
          <label htmlFor="email" className={LABEL}>
            Email
          </label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" className={`${FIELD} mb-3`} />
          <label htmlFor="name" className={LABEL}>
            What should we call you?
          </label>
          <input id="name" name="name" type="text" required autoComplete="given-name" placeholder="Maria" className={`${FIELD} mb-3`} />
          <label className="flex gap-2 items-start text-[12px] text-muted mb-3.5">
            <input type="checkbox" className="mt-[3px] accent-[var(--c-success)]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the{" "}
              <Link href="/privacy" className="text-charcoal font-semibold hover:underline">
                Terms and Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && <CuteError>{error}</CuteError>}

          <button type="submit" className={`${BTN_GREEN} w-full`} disabled={!agreed || sending}>
            {sending ? "Sending…" : "Send me a sign-in link"}
          </button>
        </form>
        <p className="text-center text-[12px] text-faint mt-3.5">
          No password to remember. Already growing here?{" "}
          <Link href={loginHref} className="text-charcoal font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}

// Step 6 — the inbox moment. Shows where the link went and gets them there.
export function ConfirmCard({
  email,
  firstLesson,
  resent,
  sending,
  onResend,
  onChangeEmail,
}: {
  email: string;
  firstLesson: FirstLesson | undefined;
  resent: boolean;
  sending: boolean;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  return (
    <section className={FADE}>
      <div className={`${CARD} text-center`}>
        <h1 className={H1}>Check your inbox</h1>
        <p className={SUB}>
          We sent a link to <b className="text-charcoal">{email}</b>. Tap it and lesson 1 is waiting.
        </p>
        {firstLesson && <FirstLessonList lessons={[firstLesson]} title="Up next, the moment you're in" />}
        <div className="flex gap-2 justify-center flex-wrap mt-2">
          <a href="https://mail.google.com" target="_blank" rel="noreferrer" className={BTN_OUTLINE}>
            Open Gmail
          </a>
          <a href="https://outlook.live.com/mail/" target="_blank" rel="noreferrer" className={BTN_OUTLINE}>
            Open Outlook
          </a>
        </div>
        <p className="text-[12px] text-faint mt-4">
          {resent ? "Sent again — give it a minute. " : "Nothing yet? "}
          <button type="button" className={`${BTN_GHOST} text-charcoal font-semibold`} onClick={onResend} disabled={sending}>
            Resend
          </button>{" "}
          ·{" "}
          <button type="button" className={`${BTN_GHOST} text-charcoal font-semibold`} onClick={onChangeEmail}>
            Use a different email
          </button>
        </p>
      </div>
    </section>
  );
}

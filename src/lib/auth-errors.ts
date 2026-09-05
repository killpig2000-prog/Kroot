// Every auth screen shows the learner one of a fixed set of messages, never
// the raw GoTrue string: the raw text is English-only, sometimes leaks
// implementation ("Database error saving new user"), and an unmatched
// message used to fall through to the screen verbatim. Unknown errors are
// logged and shown as "generic".

export type AuthErrorKey =
  | "rateLimit" // hourly email cap
  | "tooSoon" // another email to the same address inside smtp_max_frequency
  | "badCode" // wrong / expired / already-used code
  | "tooManyTries" // token-verification rate limit (per IP)
  | "exists" // sign-up for an address that already has an account
  | "weakPassword"
  | "badCredentials"
  | "notConfirmed"
  | "noAccount"
  | "generic";

export function authErrorKey(err: { message?: string; code?: string } | null | undefined): AuthErrorKey {
  const m = err?.message ?? "";
  const c = err?.code ?? "";
  if (c === "over_email_send_rate_limit" || /for security purposes|only request this after/i.test(m)) return "tooSoon";
  if (c === "over_request_rate_limit" || /request rate limit reached/i.test(m)) return "tooManyTries";
  if (/rate limit/i.test(m)) return "rateLimit";
  if (c === "otp_expired" || /token has expired|otp|invalid|expired|not found/i.test(m)) return "badCode";
  if (c === "user_already_exists" || /already registered|already exists/i.test(m)) return "exists";
  if (c === "weak_password" || /password should|weak password|at least \d+ characters/i.test(m)) return "weakPassword";
  if (c === "invalid_credentials" || /invalid login credentials/i.test(m)) return "badCredentials";
  if (c === "email_not_confirmed" || /email not confirmed/i.test(m)) return "notConfirmed";
  if (/signups not allowed|user not found/i.test(m)) return "noAccount";
  console.error("auth error:", c || "(no code)", m);
  return "generic";
}

/** Trim, lowercase, and drop anything that is not a plausible address. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length > 254) return null;
  // Not a full RFC check — one @, something either side, a dot in the domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export const CODE_LENGTH = 8;
export const MAX_CODE_TRIES = 5;

/** Keep only digits, capped at the code length — pasted "1234 5678" becomes "12345678". */
export function cleanCode(raw: string): string {
  return raw.replace(/\D+/g, "").slice(0, CODE_LENGTH);
}

export const MIN_PASSWORD = 8;

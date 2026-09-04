import type { EmailOtpType } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Which OTP type a code belongs to depends on what the mailer sent, and the
// caller can't know: signInWithOtp({ shouldCreateUser: true }) sends the
// "signup" confirmation to an address with no account yet and the "magiclink"
// mail to one that already has one. Supabase verifies a code only against the
// type it was issued for, so a single guess rejects half of all valid codes.
// Try the plausible types in turn and report the first that takes.
//
// Order matters only for speed: "email" is the generic email OTP and covers
// most cases on its own.
const TYPES: EmailOtpType[] = ["email", "signup", "magiclink"];

/** Verify an emailed sign-in code, whichever email it came from. */
export async function verifyEmailCode(
  supabase: SupabaseClient,
  email: string,
  code: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = code.replace(/\s+/g, "");
  let last = "";
  for (const type of TYPES) {
    const { error } = await supabase.auth.verifyOtp({ email, token, type });
    if (!error) return { ok: true };
    last = error.message;
    // A rate-limited or otherwise non-token failure won't get better by
    // retrying under a different type — stop and report it.
    if (!/invalid|expired|not found/i.test(error.message)) break;
  }
  return { ok: false, message: last };
}

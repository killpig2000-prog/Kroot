import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";
import { authErrorKey, cleanCode, CODE_LENGTH, type AuthErrorKey } from "@/lib/auth-errors";

// GoTrue's "email" OTP type verifies a code from either the sign-up
// confirmation or the sign-in mail (auth-js marks "signup"/"magiclink" as
// deprecated in its favour), so one request covers both. Trying more types on
// a wrong code only burns the per-IP verification limit faster.
//
// Result is a message key, never GoTrue's text: the screens map it to their
// own copy.
export async function verifyEmailCode(
  supabase: SupabaseClient,
  email: string,
  code: string,
  type: EmailOtpType = "email"
): Promise<{ ok: true } | { ok: false; key: AuthErrorKey }> {
  const token = cleanCode(code);
  if (token.length !== CODE_LENGTH) return { ok: false, key: "badCode" };
  const { error } = await supabase.auth.verifyOtp({ email, token, type });
  if (!error) return { ok: true };
  return { ok: false, key: authErrorKey(error) };
}

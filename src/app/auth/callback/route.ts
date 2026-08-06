import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Only allow same-site paths as post-auth destinations.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

// Behind a proxy (e.g. Vercel) request.url carries the internal host; prefer
// the forwarded host so cookies and redirects land on the public origin.
function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return url.origin;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${forwardedHost}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = publicOrigin(request);
  const next = safeNext(searchParams.get("next"));

  // Provider/Supabase-reported failure (user denied consent, expired link, …).
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    console.error("auth callback error:", providerError);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(providerError)}`
    );
  }

  // Email links (confirmation, recovery, magic link) arrive as token_hash and
  // work even when opened in a browser that didn't start the PKCE flow.
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(
        `${origin}${type === "recovery" ? "/auth/update-password" : next}`
      );
    }
    console.error("auth callback verifyOtp failed:", error.message);
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
  }

  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("auth callback code exchange failed:", error.message);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`);
}

import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

// Only allow same-site paths as post-auth destinations.
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/dashboard";
}

// Behind a proxy (e.g. Vercel) request.url carries the internal host; prefer
// the forwarded host so cookies and redirects land on the public origin.
//
// x-forwarded-host is a client-settable header. Vercel overwrites it with the
// real Host, so a spoof does not reach us there (verified against production),
// but this route builds every post-auth redirect out of it — so on any host
// that passes the header through, an attacker would be choosing where a
// freshly-authenticated visitor lands. Rather than depend on one platform's
// behaviour, only accept a host we would actually serve from.
function isTrustedHost(host: string): boolean {
  const canonical = SITE_URL.replace(/^https?:\/\//, "");
  if (host === canonical) return true;
  // Preview deployments get a generated *.vercel.app hostname per build, and
  // signing in on a preview has to keep working.
  return /^[a-z0-9-]+\.vercel\.app$/i.test(host);
}

function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost || !isTrustedHost(forwardedHost)) return url.origin;
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
    // Logged, never echoed. Forwarding the provider's text into ?error= was
    // what gave the login page an arbitrary-message channel in the first
    // place, and the visitor cannot act on a raw OAuth error anyway.
    console.error("auth callback error:", providerError);
    return NextResponse.redirect(`${origin}/auth/login?error=auth`);
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

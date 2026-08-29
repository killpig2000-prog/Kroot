import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

// The one proxy (Next 16's middleware). It does two things, in order:
//
//   1. Refresh the Supabase session and bounce signed-out visitors away
//      from protected pages.
//   2. Hand page requests to next-intl, which rewrites /vocabulary to
//      /en/vocabulary (default locale, no prefix) or serves /es/vocabulary
//      as-is, and sets the NEXT_LOCALE cookie.
//
// API routes, Next internals and files (robots.txt, sitemap.xml, the web
// manifest, images) are never localized: they must skip step 2 entirely,
// or next-intl rewrites /api/track to /en/api/track, which doesn't exist.
// That is exactly what happened when this logic lived in two proxy files
// (root proxy.ts + src/proxy.ts) — the root file's `api` exclusion never
// took effect and every root-level route on production 404'd.

const handleI18n = createIntlMiddleware(routing);

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/vocabulary",
  "/listening",
  "/reading",
  "/writing",
  "/shop",
  "/speaking",
  "/grammar",
  "/hangul",
  "/pronunciation",
  "/community",
  "/review",
  "/guide",
  "/level-test",
  "/admin",
];

function isPageRequest(pathname: string): boolean {
  if (pathname.startsWith("/api/") || pathname === "/api") return false;
  if (pathname.startsWith("/_next/") || pathname.startsWith("/_vercel/")) return false;
  // Anything with a file extension in its last segment: robots.txt,
  // sitemap.xml, manifest.webmanifest, sw.js, icons, fonts.
  if (/\.[^/]+$/.test(pathname)) return false;
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isPageRequest(pathname)) return NextResponse.next({ request });

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasSupabase) return handleI18n(request);

  // Session refresh writes rotated cookies onto whatever response goes out.
  // They're collected here and copied onto next-intl's response below, and
  // request.cookies is updated so server components see the fresh session.
  const refreshed: { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            refreshed.push({ name, value, options });
          });
        },
      },
    }
  );

  // getClaims() verifies the JWT locally against the project's cached JWKS —
  // no ~300ms auth round trip per request like getUser(). It still refreshes
  // expired sessions through the ssr client, keeping the cookie logic above.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

  // Protection is decided on the locale-less path so /es/dashboard is
  // guarded exactly like /dashboard.
  const localeMatch = pathname.match(LOCALE_PREFIX);
  const prefix = localeMatch ? localeMatch[0] : "";
  const bare = pathname.slice(prefix.length) || "/";
  const isProtected = PROTECTED_PREFIXES.some((p) => bare === p || bare.startsWith(`${p}/`));

  let response: NextResponse;
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}/auth/login`;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    response = NextResponse.redirect(url);
  } else {
    response = handleI18n(request);
  }
  // Carry over any auth cookies the claims check refreshed — dropping them
  // would discard the rotated refresh token and invalidate the session.
  refreshed.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export const config = {
  // Skip Next internals and static files up front; isPageRequest() repeats
  // the check (plus /api) for anything the regex lets through.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() verifies the JWT locally against the project's cached JWKS —
  // no ~300ms auth round trip per request like getUser(). It still refreshes
  // expired sessions through the ssr client, keeping the cookie logic below.
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims ?? null;

  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/vocabulary") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/writing") ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/speaking") ||
    pathname.startsWith("/grammar") ||
    pathname.startsWith("/hangul") ||
    pathname.startsWith("/pronunciation") ||
    pathname.startsWith("/slang") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/review") ||
    pathname.startsWith("/guide") ||
    pathname.startsWith("/league") ||
    pathname.startsWith("/level-test") ||
    pathname.startsWith("/admin");
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    // Carry over any auth cookies the claims check refreshed above — a bare
    // redirect would drop the rotated refresh token and invalidate the session.
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

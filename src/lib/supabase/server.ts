import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Lightweight auth for server pages: verifies the JWT locally (cached JWKS)
// instead of a ~300ms /auth/v1/user round trip per page. The middleware has
// already gated protected routes and refreshed tokens; pages only need the id
// and email out of the claims.
export async function getClaimsUser(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string; email: string | null } | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null };
}

// Shared profile shape used by every feature dashboard header (reading,
// writing, listening, vocabulary, ...) — was copy-pasted as an identical
// .from("profiles").select(...) call per page.
export async function getDashboardProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url, xp")
    .eq("id", userId)
    .single();
  return data;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — ignored when middleware refreshes sessions.
          }
        },
      },
    }
  );
}

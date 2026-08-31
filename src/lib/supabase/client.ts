import { createBrowserClient } from "@supabase/ssr";

// Placeholder values let the app build and prerender before real Supabase
// credentials are added to .env.local — auth calls will simply fail at
// runtime until NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  );
}

// The browser-side twin of getClaimsUser in lib/supabase/server: reads the id
// out of the locally-verified JWT instead of making a ~300ms /auth/v1/user
// round trip. Every caller only wants the id in order to write a row that RLS
// already scopes to that same user, so the server round trip bought nothing.
// Returns null when signed out, and on any error — callers treat both alike.
export async function getClientUserId(
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getClaims();
    return data?.claims?.sub ?? null;
  } catch {
    return null;
  }
}

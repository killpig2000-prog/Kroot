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

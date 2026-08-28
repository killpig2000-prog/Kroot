import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// analytics_events is append-only for users (its RLS reserves reads for the
// service role), so counting a learner's finished sessions has to go through
// the admin client. Returns null when that isn't possible — the dashboard
// then falls back to the progress tables it already loaded.
export async function countCompletedSessions(userId: string): Promise<number | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const db = createSupabaseClient(url, key, { auth: { persistSession: false } });
  const { count, error } = await db
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event", "activity_completed");
  if (error) return null;
  return count ?? 0;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { track as vercelTrack } from "@vercel/analytics";
import { isTableMissing } from "@/lib/resume";

// First-party product analytics. Every event is written twice: to Vercel Web
// Analytics (custom events, when the plan supports them) and to our own
// analytics_events table via /api/track, which the /admin funnel reads.
//
// Keep the vocabulary small and stable — the admin funnel keys off it.
export type AnalyticsEvent =
  | "signup"
  | "onboarding_completed"
  | "session_started"
  | "activity_completed"
  | "review_started"
  | "word_saved"
  | "reminder_optin"
  | "push_subscribed"
  | "pwa_installed"
  | "streak_freeze_bought"
  | "level_test_started"
  | "level_test_finished"
  | "continue_clicked";

export type AnalyticsProps = Record<string, string | number | boolean | null>;

const ANON_KEY = "kroot-anon-id";

function anonId(): string | null {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Client-side event. Safe to call anywhere — no-op during SSR. */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;
  try {
    vercelTrack(event, props);
  } catch {
    // Vercel analytics unavailable (blocked, or hobby plan) — first-party still records.
  }
  const body = JSON.stringify({ event, props, anon_id: anonId() });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {
    // fall through to fetch
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

/** Server-side event (route handlers / server actions) — writes straight to the table. */
export async function trackServer(
  supabase: SupabaseClient,
  userId: string | null,
  event: AnalyticsEvent,
  props: AnalyticsProps = {}
): Promise<void> {
  const { error } = await supabase.from("analytics_events").insert({ user_id: userId, event, props });
  if (error && !isTableMissing(error)) console.error("trackServer failed:", error.message);
}

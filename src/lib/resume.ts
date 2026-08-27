import type { SupabaseClient } from "@supabase/supabase-js";

/** 42P01 (Postgres) / PGRST205 (PostgREST schema cache): table not created yet. */
export function isTableMissing(error: { code?: string } | null | undefined): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

// "Continue where you left off": each session screen records the unit the
// learner is in (one row per user, latest wins) so the dashboard can show a
// single big CTA instead of making them re-navigate.
export type ResumePoint = {
  /** XP skill key, e.g. "listening" — see XP_POINTS in lib/activity.ts */
  skill: string;
  /** Where "Continue" sends them. */
  href: string;
  /** Short unit title shown on the card, e.g. "Ordering a coffee". */
  label: string;
  /** Secondary line, e.g. "Listening · Cafe · A1". */
  detail?: string;
  /** 0-100 within the unit, when known. */
  progress?: number;
};

export type ResumeRow = ResumePoint & { updated_at: string };

export const SKILL_ICONS: Record<string, string> = {
  listening: "🎧",
  reading: "📰",
  writing: "✏️",
  vocabulary: "🃏",
  grammar: "📖",
  pronunciation: "🌶️",
  speaking: "🗣️",
  hangul: "🔤",
  slang: "💬",
};

export async function saveResume(
  supabase: SupabaseClient,
  userId: string,
  point: ResumePoint
): Promise<void> {
  const { error } = await supabase.from("resume_points").upsert(
    {
      user_id: userId,
      skill: point.skill,
      href: point.href,
      label: point.label.slice(0, 80),
      detail: point.detail?.slice(0, 120) ?? null,
      progress:
        point.progress == null ? null : Math.max(0, Math.min(100, Math.round(point.progress))),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  // 42P01 = table missing (migration 0035 not applied yet) — silently skip.
  if (error && !isTableMissing(error)) console.error("saveResume failed:", error.message);
}

/** Clear the resume point once the unit it pointed at is finished. */
export async function clearResume(supabase: SupabaseClient, userId: string, href?: string): Promise<void> {
  let q = supabase.from("resume_points").delete().eq("user_id", userId);
  if (href) q = q.eq("href", href);
  const { error } = await q;
  if (error && !isTableMissing(error)) console.error("clearResume failed:", error.message);
}

"use server";

import { createClient, getClaimsUser } from "@/lib/supabase/server";

export type ReportReason = "spam" | "harassment" | "sexual" | "other";
type Kind = "post" | "comment";

const REASONS: ReadonlySet<string> = new Set<ReportReason>(["spam", "harassment", "sexual", "other"]);

// Author ids never reach the client, so the target is looked up here by the
// post or comment id the menu was rendered for.
async function loadTarget(kind: Kind, id: string) {
  if (kind !== "post" && kind !== "comment") return null;
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) return null;
  const { data } = await supabase
    .from(kind === "post" ? "community_posts" : "community_comments")
    .select("user_id, content")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return { supabase, userId: user.id, authorId: data.user_id as string, content: data.content as string };
}

export async function reportContent(kind: Kind, id: string, reason: ReportReason): Promise<boolean> {
  if (!REASONS.has(reason)) return false;
  const target = await loadTarget(kind, id);
  if (!target) return false;
  const { error } = await target.supabase.from("community_reports").insert({
    reporter_id: target.userId,
    post_id: kind === "post" ? id : null,
    comment_id: kind === "comment" ? id : null,
    reason,
    snapshot: target.content,
  });
  // 23505: this learner already reported it — that's still a success to them.
  return !error || error.code === "23505";
}

export async function blockAuthor(kind: Kind, id: string): Promise<boolean> {
  const target = await loadTarget(kind, id);
  if (!target || target.authorId === target.userId) return false;
  const { error } = await target.supabase
    .from("user_blocks")
    .upsert(
      { blocker_id: target.userId, blocked_id: target.authorId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true },
    );
  return !error;
}

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/site";

// Daily streak reminders (run by /api/cron/reminders). Two channels:
//  * Web Push — push_subscriptions, signed with our VAPID keys
//  * Email    — Brevo transactional API (same account as the auth SMTP)
// Both are opt-in per profile (reminder_push / reminder_email).

export type ReminderProfile = {
  id: string;
  display_name: string;
  streak_days: number;
  last_active_date: string | null;
  reminder_push: boolean;
  reminder_email: boolean;
  reminder_hour: number;
  last_reminded_at: string | null;
  streak_freezes: number;
};

export function vapidConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let vapidReady = false;
function ensureVapid() {
  if (vapidReady || !vapidConfigured()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:killpig2000@gmail.com",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidReady = true;
}

/** Copy for the nudge — varies by streak so it doesn't read like spam. */
export function reminderCopy(p: Pick<ReminderProfile, "display_name" | "streak_days">, dueWords: number) {
  const name = p.display_name?.trim() || "there";
  if (p.streak_days >= 3) {
    return {
      title: `🔥 ${p.streak_days}-day streak on the line`,
      body: `Hey ${name} — one 5-minute lesson tonight keeps it alive.${dueWords ? ` ${dueWords} words are due 💧` : ""}`,
    };
  }
  if (dueWords > 0) {
    return {
      title: "💧 You have words due for review",
      body: `${dueWords} ${dueWords === 1 ? "word" : "words"} due for review — five minutes keeps them fresh.`,
    };
  }
  return {
    title: "🌱 Your tree is waiting",
    body: `Hi ${name}! A tiny lesson today — listening, a few words, anything counts.`,
  };
}

export type PushSendResult = { sent: number; removed: number };

export async function sendPushToUser(
  admin: SupabaseClient,
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<PushSendResult> {
  ensureVapid();
  if (!vapidReady) return { sent: 0, removed: 0 };

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  let sent = 0;
  let removed = 0;
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify({ ...payload, url: payload.url ?? `${SITE_URL}/dashboard?source=push` }),
        { TTL: 6 * 3600 }
      );
      sent++;
      await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // 404/410 = the browser dropped the subscription; prune it.
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", s.id);
        removed++;
      } else {
        console.error("push send failed:", status, (e as Error).message);
      }
    }
  }
  return { sent, removed };
}

export function emailConfigured(): boolean {
  return !!process.env.BREVO_API_KEY;
}

export async function sendReminderEmail(
  to: string,
  copy: { title: string; body: string },
  opts: { name: string; streakDays: number; dueWords: number }
): Promise<boolean> {
  if (!emailConfigured()) return false;
  const from = process.env.BREVO_FROM_EMAIL ?? "hello@kroot.app";
  const dashboard = `${SITE_URL}/dashboard?source=email`;
  const settings = `${SITE_URL}/profile#reminders`;
  const html = `
<div style="font-family:Nunito,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#4A4237;background:#FFF9EC;border-radius:16px">
  <div style="font-size:30px;margin-bottom:6px">🌱</div>
  <h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(copy.title)}</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 18px">${escapeHtml(copy.body)}</p>
  <a href="${dashboard}" style="display:inline-block;background:#6BBF8A;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:99px;font-size:15px">Open my garden →</a>
  <p style="font-size:12px;color:#8C8272;margin:26px 0 0;line-height:1.5">
    ${opts.streakDays > 0 ? `Streak: ${opts.streakDays} days · ` : ""}${opts.dueWords > 0 ? `${opts.dueWords} words due · ` : ""}
    <a href="${settings}" style="color:#8C8272">Turn off reminders</a>
  </p>
</div>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": process.env.BREVO_API_KEY!, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Kroot", email: from },
      to: [{ email: to, name: opts.name }],
      subject: copy.title,
      htmlContent: html,
      textContent: `${copy.title}\n\n${copy.body}\n\n${dashboard}\n\nTurn off reminders: ${settings}`,
      tags: ["streak-reminder"],
    }),
  });
  if (!res.ok) console.error("brevo send failed:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

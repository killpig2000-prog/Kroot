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
  /** Legacy: the cron runs once a day for everyone, so nothing reads this. */
  reminder_hour?: number;
  last_reminded_at: string | null;
  streak_freezes: number;
  ui_locale?: string | null;
};

type Copy = { title: string; body: string };

type ReminderStrings = {
  streak: (days: number, name: string, due: number) => Copy;
  due: (due: number) => Copy;
  waiting: (name: string) => Copy;
  open: string;
  streakLine: (days: number) => string;
  dueLine: (due: number) => string;
  off: string;
};

const STRINGS: Record<string, ReminderStrings> = {
  en: {
    streak: (days, name, due) => ({
      title: `🔥 ${days}-day streak on the line`,
      body: `${name ? `Hey ${name} — one` : "One"} 5-minute lesson tonight keeps it alive.${
        due ? ` ${due === 1 ? "1 word is" : `${due} words are`} due 💧` : ""
      }`,
    }),
    due: (due) => ({
      title: "💧 You have words due for review",
      body: `${due} ${due === 1 ? "word" : "words"} due for review — five minutes keeps them fresh.`,
    }),
    waiting: (name) => ({
      title: "🌱 Your tree is waiting",
      body: `${name ? `Hi ${name}!` : "Hi!"} A tiny lesson today — listening, a few words, anything counts.`,
    }),
    open: "Open my garden →",
    streakLine: (days) => `Streak: ${days} days`,
    dueLine: (due) => `${due} words due`,
    off: "Turn off reminders",
  },
  es: {
    streak: (days, name, due) => ({
      title: `🔥 Tu racha de ${days} días está en juego`,
      body: `${name ? `Hola, ${name}: una` : "Una"} lección de 5 minutos esta noche la mantiene viva.${
        due ? ` Tienes ${due === 1 ? "1 palabra" : `${due} palabras`} para repasar 💧` : ""
      }`,
    }),
    due: (due) => ({
      title: "💧 Tienes palabras para repasar",
      body: `${due === 1 ? "1 palabra" : `${due} palabras`} para repasar: cinco minutos bastan para no olvidarlas.`,
    }),
    waiting: (name) => ({
      title: "🌱 Tu árbol te espera",
      body: `¡Hola${name ? `, ${name}` : ""}! Una lección cortita hoy: escuchar, unas palabras, todo cuenta.`,
    }),
    open: "Abrir mi jardín →",
    streakLine: (days) => `Racha: ${days} días`,
    dueLine: (due) => `${due} palabras para repasar`,
    off: "Desactivar recordatorios",
  },
  ja: {
    streak: (days, name, due) => ({
      title: `🔥 ${days}日連続の記録がピンチです`,
      body: `${name ? `${name}さん、` : ""}今夜5分だけレッスンすれば記録が続きます。${
        due ? `復習する単語が${due}語あります 💧` : ""
      }`,
    }),
    due: (due) => ({
      title: "💧 復習する単語があります",
      body: `${due}語が復習のタイミングです。5分でしっかり定着します。`,
    }),
    waiting: (name) => ({
      title: "🌱 あなたの木が待っています",
      body: `こんにちは${name ? `、${name}さん` : ""}！今日は少しだけ — リスニングでも単語いくつかでも、何でもOKです。`,
    }),
    open: "マイガーデンを開く →",
    streakLine: (days) => `連続：${days}日`,
    dueLine: (due) => `復習：${due}語`,
    off: "リマインダーをオフにする",
  },
  vi: {
    streak: (days, name, due) => ({
      title: `🔥 Chuỗi ${days} ngày sắp bị đứt`,
      body: `${name ? `Chào ${name} — một` : "Một"} bài học 5 phút tối nay sẽ giữ chuỗi của bạn.${
        due ? ` Có ${due} từ cần ôn 💧` : ""
      }`,
    }),
    due: (due) => ({
      title: "💧 Bạn có từ cần ôn tập",
      body: `${due} từ cần ôn tập — năm phút là đủ để nhớ lâu.`,
    }),
    waiting: (name) => ({
      title: "🌱 Cây của bạn đang chờ",
      body: `Chào ${name || "bạn"}! Một bài học nhỏ hôm nay — nghe, vài từ, gì cũng được.`,
    }),
    open: "Mở khu vườn của tôi →",
    streakLine: (days) => `Chuỗi: ${days} ngày`,
    dueLine: (due) => `${due} từ cần ôn`,
    off: "Tắt nhắc nhở",
  },
  "zh-Hans": {
    streak: (days, name, due) => ({
      title: `🔥 你的 ${days} 天连续记录快断了`,
      body: `${name ? `${name}，` : ""}今晚学 5 分钟就能保住它。${due ? `还有 ${due} 个词待复习 💧` : ""}`,
    }),
    due: (due) => ({
      title: "💧 有单词待复习",
      body: `${due} 个单词待复习 — 五分钟就能巩固。`,
    }),
    waiting: (name) => ({
      title: "🌱 你的树在等你",
      body: `你好${name ? `，${name}` : ""}！今天来一节小课 — 听力、几个单词，什么都算。`,
    }),
    open: "打开我的花园 →",
    streakLine: (days) => `连续：${days} 天`,
    dueLine: (due) => `${due} 个词待复习`,
    off: "关闭提醒",
  },
};

function reminderStrings(locale?: string | null): ReminderStrings {
  return (locale && STRINGS[locale]) || STRINGS.en;
}

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
export function reminderCopy(
  p: Pick<ReminderProfile, "display_name" | "streak_days">,
  dueWords: number,
  locale?: string | null
): Copy {
  const s = reminderStrings(locale);
  const name = p.display_name?.trim() ?? "";
  if (p.streak_days >= 3) return s.streak(p.streak_days, name, dueWords);
  if (dueWords > 0) return s.due(dueWords);
  return s.waiting(name);
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
  copy: Copy,
  opts: { name: string; streakDays: number; dueWords: number; locale?: string | null }
): Promise<boolean> {
  if (!emailConfigured()) return false;
  const s = reminderStrings(opts.locale);
  const from = process.env.BREVO_FROM_EMAIL ?? "hello@kroot.app";
  const dashboard = `${SITE_URL}/dashboard?source=email`;
  const settings = `${SITE_URL}/settings/reminders`;
  const html = `
<div style="font-family:Nunito,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px 20px;color:#4A4237;background:#FFF9EC;border-radius:16px">
  <div style="font-size:30px;margin-bottom:6px">🌱</div>
  <h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(copy.title)}</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 18px">${escapeHtml(copy.body)}</p>
  <a href="${dashboard}" style="display:inline-block;background:#6BBF8A;color:#fff;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:99px;font-size:15px">${escapeHtml(s.open)}</a>
  <p style="font-size:12px;color:#8C8272;margin:26px 0 0;line-height:1.5">
    ${opts.streakDays > 0 ? `${escapeHtml(s.streakLine(opts.streakDays))} · ` : ""}${opts.dueWords > 0 ? `${escapeHtml(s.dueLine(opts.dueWords))} · ` : ""}
    <a href="${settings}" style="color:#8C8272">${escapeHtml(s.off)}</a>
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
      textContent: `${copy.title}\n\n${copy.body}\n\n${dashboard}\n\n${s.off}: ${settings}`,
      tags: ["streak-reminder"],
    }),
  });
  if (!res.ok) console.error("brevo send failed:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

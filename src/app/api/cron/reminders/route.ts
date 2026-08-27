import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  emailConfigured,
  reminderCopy,
  sendPushToUser,
  sendReminderEmail,
  vapidConfigured,
  type ReminderProfile,
} from "@/lib/reminders";

// Daily streak nudge. Scheduled in vercel.json (once a day on Hobby; the
// per-user reminder_hour is honoured as "the next run at or after that hour",
// so with a single daily run everyone gets it at the same time). Protected by
// CRON_SECRET (Vercel sends it as a Bearer token automatically).
//
// Who gets nudged: opted-in learners who haven't studied today and were active
// in the last 14 days (dormant accounts aren't spammed), max once per 20h.

export const maxDuration = 60;

function admin() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "no_service_role" }, { status: 500 });
  }

  const db = admin();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - 14 * 86_400_000).toISOString().slice(0, 10);
  const minGap = new Date(now.getTime() - 20 * 3600_000).toISOString();

  const { data: rows, error } = await db
    .from("profiles")
    .select(
      "id, display_name, streak_days, last_active_date, reminder_push, reminder_email, reminder_hour, last_reminded_at, streak_freezes"
    )
    .or("reminder_push.eq.true,reminder_email.eq.true")
    .neq("last_active_date", today)
    .gte("last_active_date", cutoff)
    .or(`last_reminded_at.is.null,last_reminded_at.lt.${minGap}`)
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profiles = (rows ?? []) as ReminderProfile[];
  const nowIso = now.toISOString();
  let push = 0;
  let email = 0;
  let skipped = 0;

  for (const p of profiles) {
    // Honour the chosen hour: only send once the current UTC hour has reached it.
    if (now.getUTCHours() < (p.reminder_hour ?? 18)) {
      skipped++;
      continue;
    }

    const { count: dueWords } = await db
      .from("vocabulary_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", p.id)
      .lte("next_review_at", nowIso);
    const copy = reminderCopy(p, dueWords ?? 0);

    let delivered = false;
    if (p.reminder_push && vapidConfigured()) {
      const r = await sendPushToUser(db, p.id, { ...copy, tag: "streak-reminder" });
      if (r.sent > 0) {
        push++;
        delivered = true;
      }
    }
    if (p.reminder_email && emailConfigured()) {
      const { data: u } = await db.auth.admin.getUserById(p.id);
      const to = u?.user?.email;
      if (to) {
        const ok = await sendReminderEmail(to, copy, {
          name: p.display_name,
          streakDays: p.streak_days,
          dueWords: dueWords ?? 0,
        });
        if (ok) {
          email++;
          delivered = true;
        }
      }
    }
    if (delivered) {
      await db.from("profiles").update({ last_reminded_at: nowIso }).eq("id", p.id);
      await db.from("analytics_events").insert({ user_id: p.id, event: "reminder_sent", props: { push: p.reminder_push, email: p.reminder_email } });
    }
  }

  return NextResponse.json({ candidates: profiles.length, push, email, skipped, vapid: vapidConfigured(), brevo: emailConfigured() });
}

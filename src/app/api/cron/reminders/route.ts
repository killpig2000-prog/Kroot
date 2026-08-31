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

// Daily streak nudge. Scheduled in vercel.json — Hobby allows exactly one run
// a day, and everybody gets that one run. There used to be a per-user
// reminder_hour gate here ("only send once the current UTC hour has reached
// it"), which was written as if a later run would pick up the stragglers. With
// a single daily run there is no later run: anyone whose stored hour landed
// after 18:00 UTC was skipped every day forever. Our users are US/Europe and
// the UI's "Evening" preset converts to 22:00 UTC on the US east coast, so the
// most popular choice was the one that never fired. The gate is gone; the
// 20-hour minimum gap below is what stops duplicates, and the settings UI no
// longer promises a time we cannot honour.
//
// Protected by CRON_SECRET (Vercel sends it as a Bearer token automatically).
//
// Who gets nudged: opted-in learners who haven't studied today and were active
// in the last 14 days (dormant accounts aren't spammed), max once per 20h.

export const maxDuration = 60;

// The loop used to do 5-6 serialized round trips per user (a due-word count, a
// push, an auth lookup, a Brevo POST, two writes), so past ~100 users the
// function was killed mid-run. Because last_reminded_at is only written after a
// successful send, the same prefix of users got served every day and everyone
// after it never heard from us. Counts and emails are now fetched in bulk up
// front, users are sent in small parallel waves, and we stop starting new waves
// before the platform kills us so the run always reports honestly.
const WAVE = 12; // users delivered in parallel
const ID_CHUNK = 100; // user ids per bulk due-word query
const DUE_ROW_CAP = 20_000; // rows we're willing to pull per bulk query
const USER_PAGE = 1000; // auth.admin.listUsers page size
const USER_PAGE_CAP = 10; // ...and how many pages we'll walk before giving up
const EMAIL_BUDGET = 280; // Brevo's free plan cuts us off at 300 mails/day
const DEADLINE_MS = 50_000; // maxDuration is 60s; leave room to write and reply

type Admin = ReturnType<typeof admin>;

function admin() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/**
 * Due-word counts for every candidate in a handful of queries instead of one
 * per user. The number only feeds the copy ("12 words are due"), so a failed
 * chunk degrades to zero rather than failing the whole run.
 */
async function dueWordCounts(db: Admin, ids: string[], nowIso: string): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const { data, error } = await db
      .from("vocabulary_progress")
      .select("user_id")
      .in("user_id", ids.slice(i, i + ID_CHUNK))
      .lte("next_review_at", nowIso)
      .limit(DUE_ROW_CAP);
    if (error) {
      console.error("due-word tally failed:", error.message);
      continue;
    }
    for (const r of (data ?? []) as { user_id: string }[]) {
      counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Sign-in addresses for the email opt-ins, paged in bulk. listUsers walks the
 * whole user table, so we stop as soon as every address we need is in hand and
 * fall back to a single getUserById for anyone still missing.
 */
async function emailAddresses(db: Admin, need: Set<string>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (need.size === 0) return map;
  for (let page = 1; page <= USER_PAGE_CAP && map.size < need.size; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: USER_PAGE });
    if (error) {
      console.error("listUsers failed:", error.message);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) if (u.email && need.has(u.id)) map.set(u.id, u.email);
    if (users.length < USER_PAGE) break;
  }
  return map;
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
  const startedAt = Date.now();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoff = new Date(now.getTime() - 14 * 86_400_000).toISOString().slice(0, 10);
  const minGap = new Date(now.getTime() - 20 * 3600_000).toISOString();

  const { data: rows, error } = await db
    .from("profiles")
    .select(
      "id, display_name, streak_days, last_active_date, reminder_push, reminder_email, last_reminded_at, streak_freezes"
    )
    .or("reminder_push.eq.true,reminder_email.eq.true")
    .neq("last_active_date", today)
    .gte("last_active_date", cutoff)
    .or(`last_reminded_at.is.null,last_reminded_at.lt.${minGap}`)
    // Longest-waiting first: if we do run out of time, the people we dropped
    // are the ones who were reminded most recently, and tomorrow's run puts
    // them at the front. Without this the same prefix wins every day.
    .order("last_reminded_at", { ascending: true, nullsFirst: true })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profiles = (rows ?? []) as ReminderProfile[];
  const nowIso = now.toISOString();
  const pushOn = vapidConfigured();
  const emailOn = emailConfigured();

  const counts = await dueWordCounts(db, profiles.map((p) => p.id), nowIso);
  const addresses = emailOn
    ? await emailAddresses(db, new Set(profiles.filter((p) => p.reminder_email).map((p) => p.id)))
    : new Map<string, string>();

  let push = 0;
  let email = 0;
  let deferred = 0;
  let emailBudget = EMAIL_BUDGET;

  async function deliver(p: ReminderProfile): Promise<boolean> {
    const dueWords = counts.get(p.id) ?? 0;
    const copy = reminderCopy(p, dueWords);
    let delivered = false;

    if (p.reminder_push && pushOn) {
      const r = await sendPushToUser(db, p.id, { ...copy, tag: "streak-reminder" });
      if (r.sent > 0) {
        push++;
        delivered = true;
      }
    }
    // Reserve the send before awaiting so parallel waves can't overshoot Brevo's
    // daily cap between the check and the POST.
    if (p.reminder_email && emailOn && emailBudget > 0) {
      emailBudget--;
      const to = addresses.get(p.id) ?? (await db.auth.admin.getUserById(p.id)).data?.user?.email;
      const ok = to
        ? await sendReminderEmail(to, copy, { name: p.display_name, streakDays: p.streak_days, dueWords })
        : false;
      if (ok) {
        email++;
        delivered = true;
      } else {
        emailBudget++;
      }
    }
    return delivered;
  }

  for (let i = 0; i < profiles.length; i += WAVE) {
    if (Date.now() - startedAt > DEADLINE_MS) {
      deferred = profiles.length - i;
      break;
    }
    const wave = profiles.slice(i, i + WAVE);
    const results = await Promise.all(
      wave.map(async (p) => {
        try {
          return (await deliver(p)) ? p : null;
        } catch (e) {
          console.error("reminder failed for", p.id, (e as Error).message);
          return null;
        }
      })
    );
    const sentTo = results.filter((p): p is ReminderProfile => p !== null);
    if (sentTo.length === 0) continue;
    // Flushed per wave rather than once at the end: if the platform kills us
    // mid-run, the people we already emailed must not be emailed again tomorrow
    // as if nothing happened.
    const ids = sentTo.map((p) => p.id);
    await db.from("profiles").update({ last_reminded_at: nowIso }).in("id", ids);
    await db.from("analytics_events").insert(
      sentTo.map((p) => ({
        user_id: p.id,
        event: "reminder_sent",
        props: { push: p.reminder_push, email: p.reminder_email },
      }))
    );
  }

  return NextResponse.json({
    candidates: profiles.length,
    push,
    email,
    deferred,
    ms: Date.now() - startedAt,
    vapid: pushOn,
    brevo: emailOn,
  });
}

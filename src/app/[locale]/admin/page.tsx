import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import FunnelSection from "@/components/admin/FunnelSection";
import type { CefrLevel } from "@/lib/tree";

// Owner-only dashboard: signups, activity, Plus subscribers. Anyone else
// (including logged-in users) gets a plain 404 so the page stays invisible.
const ADMIN_EMAIL = "killpig2000@gmail.com";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Feature-usage labels for xp_events.skill values (see XP_POINTS in lib/activity.ts).
const SKILL_LABELS: Record<string, string> = {
  reading: "📰 Reading",
  writing: "✏️ Writing",
  listening: "🎧 Listening",
  speaking: "🎙️ Speaking",
  vocabulary: "🃏 Vocabulary",
  grammar: "📖 Grammar",
  pronunciation: "🔊 Pronunciation",
  hangul: "🔤 Hangul",
  slang: "💬 Slang",
  quest: "🎯 Daily quest",
};

type SkillUsage = {
  skill: string;
  label: string;
  completions7: number;
  users7: number;
  completions30: number;
  users30: number;
};

type RecentUser = {
  display_name: string;
  current_level: CefrLevel;
  streak_days: number;
  created_at: string;
  plus_until: string | null;
};

type ActivityEvent = {
  name: string;
  label: string;
  points: number;
  at: string;
};

type UserActivity = {
  name: string;
  skills: { label: string; count: number }[];
  completions: number;
  xp: number;
  lastAt: string;
};

// Timestamps rendered for the (Korea-based) admin, not the visitor's locale.
function kst(at: string) {
  return new Date(at).toLocaleString("en-CA", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function loadStats() {
  const db = adminClient();
  const nowISO = new Date().toISOString();
  const today = iso(new Date());

  const [
    total,
    plus,
    signupRows,
    recentRes,
    activityRes,
    usageRes,
    eventsRes,
    ...levelCounts
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gt("plus_until", nowISO),
    db
      .from("profiles")
      .select("created_at")
      .gte("created_at", daysAgo(13).toISOString().slice(0, 10)),
    db
      .from("profiles")
      .select("display_name, current_level, streak_days, created_at, plus_until")
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("daily_activity")
      .select("user_id, activity_date, minutes")
      .gte("activity_date", iso(daysAgo(6))),
    db
      .from("xp_events")
      .select("skill, user_id, created_at")
      .gte("created_at", daysAgo(29).toISOString())
      .limit(20000),
    db
      .from("xp_events")
      .select("user_id, skill, points, created_at")
      .gte("created_at", daysAgo(6).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    ...LEVELS.map((lvl) =>
      db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("current_level", lvl)
    ),
  ]);

  // Signups per day, last 14 days (oldest first)
  const signupsByDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) signupsByDay.set(iso(daysAgo(i)), 0);
  for (const row of signupRows.data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    if (signupsByDay.has(day)) signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
  }

  const activity = activityRes.data ?? [];
  const dauToday = new Set(
    activity.filter((a) => a.activity_date === today).map((a) => a.user_id)
  ).size;
  const wau = new Set(activity.map((a) => a.user_id)).size;
  const minutes7d = activity.reduce((sum, a) => sum + (a.minutes ?? 0), 0);

  // Feature usage: one xp_event per completed unit, tagged by skill.
  // Rows from before migration 0024 have skill = null and are skipped.
  const sevenDaysAgo = daysAgo(6).toISOString().slice(0, 10) + "T00:00:00.000Z";
  const bySkill = new Map<
    string,
    { completions7: number; users7: Set<string>; completions30: number; users30: Set<string> }
  >();
  for (const ev of usageRes.data ?? []) {
    if (!ev.skill) continue;
    let entry = bySkill.get(ev.skill);
    if (!entry) {
      entry = { completions7: 0, users7: new Set(), completions30: 0, users30: new Set() };
      bySkill.set(ev.skill, entry);
    }
    entry.completions30 += 1;
    entry.users30.add(ev.user_id);
    if (ev.created_at >= sevenDaysAgo) {
      entry.completions7 += 1;
      entry.users7.add(ev.user_id);
    }
  }
  const usage: SkillUsage[] = [...bySkill.entries()]
    .map(([skill, e]) => ({
      skill,
      label: SKILL_LABELS[skill] ?? skill,
      completions7: e.completions7,
      users7: e.users7.size,
      completions30: e.completions30,
      users30: e.users30.size,
    }))
    .sort((a, b) => b.completions30 - a.completions30);

  // Who used which feature: per-user rollup + a raw feed, both over 7 days.
  const events = (eventsRes.data ?? []) as {
    user_id: string;
    skill: string | null;
    points: number;
    created_at: string;
  }[];
  const nameById = new Map<string, string>();
  const eventUserIds = [...new Set(events.map((e) => e.user_id))];
  if (eventUserIds.length > 0) {
    const { data: nameRows } = await db
      .from("profiles")
      .select("id, display_name")
      .in("id", eventUserIds);
    for (const p of nameRows ?? []) nameById.set(p.id, p.display_name);
  }
  const label = (skill: string | null) => (skill && SKILL_LABELS[skill]) || skill || "⭐ Other";

  const feed: ActivityEvent[] = events.slice(0, 30).map((e) => ({
    name: nameById.get(e.user_id) ?? "?",
    label: label(e.skill),
    points: e.points,
    at: e.created_at,
  }));

  const byUser = new Map<
    string,
    { skills: Map<string, number>; completions: number; xp: number; lastAt: string }
  >();
  for (const e of events) {
    let entry = byUser.get(e.user_id);
    if (!entry) {
      // Events arrive newest-first, so the first one seen is the last activity.
      entry = { skills: new Map(), completions: 0, xp: 0, lastAt: e.created_at };
      byUser.set(e.user_id, entry);
    }
    const l = label(e.skill);
    entry.skills.set(l, (entry.skills.get(l) ?? 0) + 1);
    entry.completions += 1;
    entry.xp += e.points;
  }
  const userActivity: UserActivity[] = [...byUser.entries()]
    .map(([id, e]) => ({
      name: nameById.get(id) ?? "?",
      skills: [...e.skills.entries()]
        .map(([l, count]) => ({ label: l, count }))
        .sort((a, b) => b.count - a.count),
      completions: e.completions,
      xp: e.xp,
      lastAt: e.lastAt,
    }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1))
    .slice(0, 25);

  return {
    totalUsers: total.count ?? 0,
    plusUsers: plus.count ?? 0,
    signupsToday: signupsByDay.get(today) ?? 0,
    signups7d: [...signupsByDay.entries()]
      .filter(([day]) => day >= iso(daysAgo(6)))
      .reduce((sum, [, n]) => sum + n, 0),
    signupsByDay: [...signupsByDay.entries()],
    dauToday,
    wau,
    minutes7d,
    recent: (recentRes.data ?? []) as RecentUser[],
    byLevel: LEVELS.map((lvl, i) => ({ level: lvl, count: levelCounts[i].count ?? 0 })),
    usage,
    userActivity,
    feed,
  };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-cream p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) notFound();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          <code>SUPABASE_SERVICE_ROLE_KEY</code> is not set in this environment, so
          cross-user stats can&apos;t be loaded. Add it to <code>.env.local</code> (it&apos;s
          already configured on Vercel for the Stripe webhook).
        </p>
      </main>
    );
  }

  const stats = await loadStats();
  const maxSignups = Math.max(1, ...stats.signupsByDay.map(([, n]) => n));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <Link href="/dashboard" className="text-sm font-medium text-emerald-600 hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} sub={`+${stats.signups7d} this week`} />
        <StatCard label="Signups today" value={stats.signupsToday} />
        <StatCard label="Active today" value={stats.dauToday} sub={`${stats.wau} active this week`} />
        <StatCard label="Plus subscribers" value={stats.plusUsers} sub={`${stats.minutes7d} min studied · 7d`} />
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-cream p-5">
        <h2 className="text-sm font-semibold text-slate-700">Signups · last 14 days</h2>
        <div className="mt-4 flex h-28 items-end gap-1.5">
          {stats.signupsByDay.map(([day, n]) => (
            <div key={day} className="group relative flex-1">
              <div
                className="w-full rounded-t bg-emerald-400 transition-colors group-hover:bg-emerald-500"
                style={{ height: `${Math.max(4, (n / maxSignups) * 100)}px` }}
              />
              <p className="mt-1 text-center text-[9px] text-slate-400">{day.slice(5)}</p>
              <p className="text-center text-[10px] font-semibold text-slate-600">{n}</p>
            </div>
          ))}
        </div>
      </section>

      <FunnelSection db={adminClient()} days={30} />

      <section className="mt-8 rounded-2xl border border-slate-200 bg-cream p-5">
        <h2 className="text-sm font-semibold text-slate-700">Feature usage</h2>
        <p className="mt-0.5 text-xs text-slate-400">
          Completed activities per skill (one row per finished lesson/session)
        </p>
        {stats.usage.length === 0 ? (
          <p className="mt-4 py-4 text-center text-sm text-slate-400">
            No tagged activity yet — usage is logged per skill once migration 0024 is applied.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Feature</th>
                  <th className="pb-2 pr-4 text-right font-medium">Completions · 7d</th>
                  <th className="pb-2 pr-4 text-right font-medium">Users · 7d</th>
                  <th className="pb-2 pr-4 text-right font-medium">Completions · 30d</th>
                  <th className="pb-2 pr-4 text-right font-medium">Users · 30d</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.usage.map((u) => {
                  const max = Math.max(1, ...stats.usage.map((x) => x.completions30));
                  return (
                    <tr key={u.skill} className="border-t border-slate-100">
                      <td className="py-2 font-medium text-slate-800">{u.label}</td>
                      <td className="py-2 pr-4 text-right text-slate-600">{u.completions7}</td>
                      <td className="py-2 pr-4 text-right text-slate-600">{u.users7}</td>
                      <td className="py-2 pr-4 text-right text-slate-600">{u.completions30}</td>
                      <td className="py-2 pr-4 text-right text-slate-600">{u.users30}</td>
                      <td className="py-2 w-[160px]">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${(u.completions30 / max) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-2xl border border-slate-200 bg-cream p-5">
          <h2 className="text-sm font-semibold text-slate-700">Who did what · 7d</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Per-user feature usage, most recently active first
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Features used</th>
                  <th className="pb-2 pr-2 text-right font-medium">XP</th>
                  <th className="pb-2 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {stats.userActivity.map((u) => (
                  <tr key={u.name + u.lastAt} className="border-t border-slate-100 align-top">
                    <td className="py-2 pr-3 font-medium text-slate-800">{u.name}</td>
                    <td className="py-2 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {u.skills.map((s) => (
                          <span
                            key={s.label}
                            className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {s.label} ×{s.count}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right text-slate-600">{u.xp}</td>
                    <td className="py-2 whitespace-nowrap text-slate-500">{kst(u.lastAt)}</td>
                  </tr>
                ))}
                {stats.userActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No activity in the last 7 days
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-cream p-5">
          <h2 className="text-sm font-semibold text-slate-700">Recent activity</h2>
          <p className="mt-0.5 text-xs text-slate-400">Latest completed activities (KST)</p>
          <ul className="mt-3 max-h-[440px] space-y-1 overflow-y-auto pr-1">
            {stats.feed.map((e, i) => (
              <li
                key={e.name + e.at + i}
                className="flex items-baseline justify-between gap-3 border-t border-slate-100 py-1.5 text-sm first:border-t-0"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-slate-800">{e.name}</span>{" "}
                  <span className="text-slate-600">{e.label}</span>{" "}
                  <span className="text-xs text-emerald-600">+{e.points}</span>
                </span>
                <span className="whitespace-nowrap text-xs text-slate-400">{kst(e.at)}</span>
              </li>
            ))}
            {stats.feed.length === 0 && (
              <li className="py-4 text-center text-sm text-slate-400">No activity yet</li>
            )}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-cream p-5">
          <h2 className="text-sm font-semibold text-slate-700">Recent signups</h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Level</th>
                <th className="pb-2 font-medium">Streak</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((u) => (
                <tr key={u.display_name + u.created_at} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-800">
                    {u.display_name}
                    {u.plus_until && new Date(u.plus_until) > new Date() && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        PLUS
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-slate-600">{u.current_level}</td>
                  <td className="py-2 text-slate-600">{u.streak_days}d</td>
                  <td className="py-2 text-slate-500">{u.created_at.slice(0, 10)}</td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-cream p-5">
          <h2 className="text-sm font-semibold text-slate-700">Users by level</h2>
          <ul className="mt-3 space-y-2">
            {stats.byLevel.map(({ level, count }) => (
              <li key={level} className="flex items-center gap-3">
                <span className="w-7 text-xs font-bold text-slate-500">{level}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${(count / Math.max(1, stats.totalUsers)) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs font-semibold text-slate-600">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

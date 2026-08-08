import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
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

type RecentUser = {
  display_name: string;
  current_level: CefrLevel;
  streak_days: number;
  created_at: string;
  plus_until: string | null;
};

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
  };
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
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

      <div className="mt-8 grid gap-6 md:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
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

import type { SupabaseClient } from "@supabase/supabase-js";

// Activation + retention funnel from first-party analytics_events (migration
// 0035) joined with daily_activity. Rendered inside /admin (service role).
//
//   signup → onboarding done → first lesson → D1 → D7 return
//
// Cohort = everyone who signed up in the window; each later step counts a
// cohort member once.

type Step = { label: string; count: number; hint: string };

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function loadFunnel(db: SupabaseClient, days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const sinceIso = since.toISOString();

  const [{ data: cohort }, { data: events, error: evErr }, { data: activity }] = await Promise.all([
    db.from("profiles").select("id, created_at").gte("created_at", sinceIso),
    db
      .from("analytics_events")
      .select("user_id, event, created_at, props")
      .gte("created_at", sinceIso)
      .in("event", [
        "onboarding_completed",
        "activity_completed",
        "continue_clicked",
        "word_saved",
        "reminder_optin",
        "push_subscribed",
        "pwa_installed",
        "streak_freeze_bought",
        "reminder_sent",
      ])
      .limit(50000),
    db.from("daily_activity").select("user_id, activity_date").gte("activity_date", iso(since)),
  ]);

  const created = new Map<string, string>();
  for (const p of cohort ?? []) created.set(p.id, iso(new Date(p.created_at)));
  const cohortIds = new Set(created.keys());

  const byEvent = new Map<string, Set<string>>();
  const totals = new Map<string, number>();
  for (const e of events ?? []) {
    totals.set(e.event, (totals.get(e.event) ?? 0) + 1);
    if (!e.user_id) continue;
    if (!byEvent.has(e.event)) byEvent.set(e.event, new Set());
    byEvent.get(e.event)!.add(e.user_id);
  }
  const inCohort = (ev: string) => [...(byEvent.get(ev) ?? [])].filter((id) => cohortIds.has(id)).length;

  // Retention: active on the day after signup (D1) and any day 7-13 after (W2).
  const activeDays = new Map<string, Set<string>>();
  for (const a of activity ?? []) {
    if (!activeDays.has(a.user_id)) activeDays.set(a.user_id, new Set());
    activeDays.get(a.user_id)!.add(a.activity_date);
  }
  let d1 = 0;
  let d7 = 0;
  let firstLesson = 0;
  for (const [id, day0] of created) {
    const days = activeDays.get(id);
    if (!days) continue;
    const base = new Date(day0).getTime();
    const offsets = [...days].map((d) => Math.round((new Date(d).getTime() - base) / 86_400_000));
    if (offsets.length) firstLesson++;
    if (offsets.includes(1)) d1++;
    if (offsets.some((o) => o >= 7 && o <= 13)) d7++;
  }

  const n = cohortIds.size;
  const steps: Step[] = [
    { label: "Signed up", count: n, hint: `last ${days}d` },
    { label: "Picked a level", count: Math.max(inCohort("onboarding_completed"), firstLesson), hint: "onboarding done" },
    { label: "First lesson", count: firstLesson, hint: "any activity" },
    { label: "Came back D1", count: d1, hint: "active next day" },
    { label: "Came back W2", count: d7, hint: "active day 7–13" },
  ];

  const features = [
    ["continue_clicked", "Continue card"],
    ["word_saved", "Words saved"],
    ["reminder_optin", "Reminder opt-ins"],
    ["push_subscribed", "Push subscribed"],
    ["pwa_installed", "PWA installs"],
    ["streak_freeze_bought", "Freezes bought"],
    ["reminder_sent", "Reminders sent"],
  ].map(([ev, label]) => ({ label, total: totals.get(ev) ?? 0, users: byEvent.get(ev)?.size ?? 0 }));

  return { steps, features, missing: evErr?.code === "42P01" };
}

export default async function FunnelSection({ db, days = 30 }: { db: SupabaseClient; days?: number }) {
  const { steps, features, missing } = await loadFunnel(db, days);
  const max = Math.max(1, steps[0].count);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-slate-700">Activation funnel · {days}d cohort</h2>
        {missing && (
          <span className="text-xs text-amber-700">
            analytics_events missing — apply migration 0035 (activity-based steps still work)
          </span>
        )}
      </div>

      <ol className="mt-4 grid gap-2">
        {steps.map((s, i) => {
          const pctOfTop = Math.round((s.count / max) * 100);
          const prev = i > 0 ? steps[i - 1].count : s.count;
          const conv = prev ? Math.round((s.count / prev) * 100) : 0;
          return (
            <li key={s.label} className="grid grid-cols-[150px_1fr_auto] items-center gap-3 text-sm">
              <span className="text-slate-600">
                {s.label}
                <span className="block text-[11px] text-slate-400">{s.hint}</span>
              </span>
              <span className="h-5 rounded bg-slate-100 overflow-hidden">
                <span className="block h-full bg-emerald-400" style={{ width: `${pctOfTop}%` }} />
              </span>
              <span className="tabular-nums text-right w-[110px]">
                <b>{s.count}</b>
                <span className="text-slate-400 text-xs"> · {i === 0 ? "100" : conv}%</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
        {features.map((f) => (
          <div key={f.label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[11px] text-slate-500">{f.label}</div>
            <div className="text-base font-semibold tabular-nums">
              {f.total}
              <span className="text-xs text-slate-400 font-normal"> · {f.users} users</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

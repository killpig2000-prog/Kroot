-- Folds the admin dashboard's pure-counting queries into one round trip.
--
-- loadStats() was issuing these separately, ten in all:
--
--   count(*) profiles                                     -- total users
--   count(*) profiles where current_level = $1   x6       -- a literal N+1 over
--                                                            LEVELS.map(...)
--   select streak_days from profiles where streak_days>0  -- every row, only to
--                                                            bucket them in JS
--   count(*) push_subscriptions
--   select last_reminded_at from profiles
--       where last_reminded_at is not null                -- every row, only to
--                                                            take max + today's
--
-- The last two are the expensive ones: both pull an unbounded row set across
-- the wire so JavaScript can reduce them to a handful of numbers. Postgres does
-- that in the same scan it was doing anyway.
--
-- SECURITY INVOKER: the admin page calls this with the service-role key, which
-- already bypasses RLS, so the function grants nothing that key didn't have.
-- Execute is revoked from anon/authenticated regardless -- under RLS a normal
-- caller would get their own rows only (harmless but meaningless), and there is
-- no reason to leave an aggregate over every profile callable from the browser.
--
-- Streak buckets mirror the labels in admin/page.tsx exactly: 1, 2-3, 4-6,
-- 7-13, 14-29, 30+. Keep the two in step if either changes.
--
-- Idempotent: create or replace, safe to re-run.

create or replace function public.admin_overview(p_today date)
returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),

    'level_counts', coalesce((
      select jsonb_object_agg(current_level, n)
      from (
        select current_level, count(*) as n
        from public.profiles
        where current_level is not null
        group by current_level
      ) t
    ), '{}'::jsonb),

    -- One pass over the streaked profiles gives both the histogram and the
    -- mean the page used to compute by pulling every row and reducing in JS.
    'streak_buckets', (
      select jsonb_build_object(
        'd1',    count(*) filter (where streak_days = 1),
        'd2_3',  count(*) filter (where streak_days between 2 and 3),
        'd4_6',  count(*) filter (where streak_days between 4 and 6),
        'd7_13', count(*) filter (where streak_days between 7 and 13),
        'd14_29',count(*) filter (where streak_days between 14 and 29),
        'd30',   count(*) filter (where streak_days >= 30),
        'avg',   coalesce(round(avg(streak_days)::numeric, 1), 0)
      )
      from public.profiles
      where streak_days > 0
    ),

    'push_count', (select count(*) from public.push_subscriptions),

    -- p_today comes from iso(new Date()), i.e. toISOString() -- a UTC date.
    -- The window is pinned to UTC here so the count means the same thing
    -- regardless of the database session's timezone; the JS it replaces was
    -- comparing last_reminded_at.slice(0,10), which is UTC by construction.
    'reminders', (
      select jsonb_build_object(
        'last_run', max(last_reminded_at),
        'sent_today', count(*) filter (
          where last_reminded_at >= (p_today::text || ' 00:00:00+00')::timestamptz
            and last_reminded_at <  ((p_today + 1)::text || ' 00:00:00+00')::timestamptz
        )
      )
      from public.profiles
      where last_reminded_at is not null
    )
  );
$$;

revoke execute on function public.admin_overview(date) from anon, authenticated;

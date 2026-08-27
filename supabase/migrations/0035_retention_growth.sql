-- Retention + growth infrastructure (2026-08-27):
--  * analytics_events   — first-party funnel events (signup → first lesson → D7)
--  * push_subscriptions — Web Push endpoints for streak reminders
--  * profiles.reminder_* — reminder opt-ins (push / email) + last-sent stamp
--  * profiles.streak_freezes + buy_streak_freeze() — consumable that saves a
--    missed day; touch_streak() spends them (stacks with the Plus shield)
--  * resume_points      — "Continue where you left off" for the dashboard CTA
-- Idempotent: safe to re-run after a partial apply.

-- ---------------------------------------------------------------------------
-- First-party analytics
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  anon_id text,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_event_idx
  on public.analytics_events (event, created_at desc);
create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id, created_at desc);

alter table public.analytics_events enable row level security;

-- Clients may only append; reading is reserved for the service role (admin).
drop policy if exists "Analytics events are insertable by owner or anon" on public.analytics_events;
create policy "Analytics events are insertable by owner or anon"
  on public.analytics_events for insert
  with check (user_id is null or auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Web Push subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Push subscriptions are viewable by owner" on public.push_subscriptions;
create policy "Push subscriptions are viewable by owner"
  on public.push_subscriptions for select using (auth.uid() = user_id);
drop policy if exists "Push subscriptions are insertable by owner" on public.push_subscriptions;
create policy "Push subscriptions are insertable by owner"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);
drop policy if exists "Push subscriptions are updatable by owner" on public.push_subscriptions;
create policy "Push subscriptions are updatable by owner"
  on public.push_subscriptions for update using (auth.uid() = user_id);
drop policy if exists "Push subscriptions are deletable by owner" on public.push_subscriptions;
create policy "Push subscriptions are deletable by owner"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Reminder preferences + streak freezes on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists reminder_push boolean not null default false,
  add column if not exists reminder_email boolean not null default false,
  -- UTC hour the daily nudge goes out (18 = evening in Europe, midday US)
  add column if not exists reminder_hour smallint not null default 18
    check (reminder_hour between 0 and 23),
  add column if not exists last_reminded_at timestamptz,
  add column if not exists streak_freezes smallint not null default 0
    check (streak_freezes between 0 and 3),
  add column if not exists streak_freeze_used_on date;

-- Owners may edit their own reminder prefs directly (0013 revoked blanket
-- update; extend the column grant). Freezes stay RPC-only.
grant update (reminder_push, reminder_email, reminder_hour)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Streak freeze: buy (coins) + spend (inside touch_streak)
-- ---------------------------------------------------------------------------
create or replace function public.buy_streak_freeze()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_price constant integer := 150;
  v_max constant integer := 3;
  v_profile public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_profile from public.profiles where id = auth.uid() for update;

  if v_profile.streak_freezes >= v_max then
    raise exception 'max freezes';
  end if;
  if v_profile.coins < v_price then
    raise exception 'not enough coins';
  end if;

  update public.profiles
    set coins = coins - v_price,
        streak_freezes = streak_freezes + 1,
        updated_at = now()
  where id = auth.uid();

  return v_profile.streak_freezes + 1;
end;
$$;

-- touch_streak: a missed day is covered first by the Plus shield (1 day),
-- then by freezes (1 each). Any gap that can't be covered resets to 1.
create or replace function public.touch_streak()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_last date;
  v_streak integer;
  v_plus boolean;
  v_freezes integer;
  v_missed integer;
  v_cover integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select last_active_date, streak_days,
         (plus_until is not null and plus_until > now()),
         coalesce(streak_freezes, 0)
    into v_last, v_streak, v_plus, v_freezes
  from public.profiles where id = auth.uid() for update;

  if v_last = current_date then
    return v_streak;
  end if;

  -- days with no activity strictly between last active day and today
  v_missed := case when v_last is null then 999 else (current_date - v_last) - 1 end;

  if v_missed <= 0 then
    v_streak := v_streak + 1;
  else
    v_cover := v_missed;
    if v_plus then
      v_cover := v_cover - 1; -- Plus streak shield absorbs one day
    end if;
    if v_cover <= v_freezes then
      -- freezes absorb the rest; streak survives
      v_freezes := v_freezes - greatest(v_cover, 0);
      v_streak := v_streak + 1;
      update public.profiles
        set streak_freezes = v_freezes,
            streak_freeze_used_on = case when v_cover > 0 then current_date else streak_freeze_used_on end
      where id = auth.uid();
    else
      v_streak := 1;
    end if;
  end if;

  update public.profiles
  set streak_days = v_streak, last_active_date = current_date, updated_at = now()
  where id = auth.uid();

  return v_streak;
end;
$$;

-- ---------------------------------------------------------------------------
-- Resume points ("Continue where you left off")
-- ---------------------------------------------------------------------------
create table if not exists public.resume_points (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  skill text not null,
  href text not null,
  label text not null,
  detail text,
  progress smallint check (progress between 0 and 100),
  updated_at timestamptz not null default now()
);

alter table public.resume_points enable row level security;

drop policy if exists "Resume points are viewable by owner" on public.resume_points;
create policy "Resume points are viewable by owner"
  on public.resume_points for select using (auth.uid() = user_id);
drop policy if exists "Resume points are insertable by owner" on public.resume_points;
create policy "Resume points are insertable by owner"
  on public.resume_points for insert with check (auth.uid() = user_id);
drop policy if exists "Resume points are updatable by owner" on public.resume_points;
create policy "Resume points are updatable by owner"
  on public.resume_points for update using (auth.uid() = user_id);
drop policy if exists "Resume points are deletable by owner" on public.resume_points;
create policy "Resume points are deletable by owner"
  on public.resume_points for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grammar progress (per lesson) — until now grammar only left xp_events rows,
-- so the dashboard couldn't show "12/30 lessons at A2".
-- ---------------------------------------------------------------------------
create table if not exists public.grammar_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_key text not null,
  score smallint,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_key)
);

alter table public.grammar_progress enable row level security;

drop policy if exists "Grammar progress is viewable by owner" on public.grammar_progress;
create policy "Grammar progress is viewable by owner"
  on public.grammar_progress for select using (auth.uid() = user_id);
drop policy if exists "Grammar progress is insertable by owner" on public.grammar_progress;
create policy "Grammar progress is insertable by owner"
  on public.grammar_progress for insert with check (auth.uid() = user_id);
drop policy if exists "Grammar progress is updatable by owner" on public.grammar_progress;
create policy "Grammar progress is updatable by owner"
  on public.grammar_progress for update using (auth.uid() = user_id);

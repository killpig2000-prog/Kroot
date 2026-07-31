-- Weekly XP league + promotion-test plumbing.
--  * xp_events: one row per XP award, so rankings can be computed per week
--    (profiles.xp stays the lifetime total).
--  * award_xp() now also logs an event.
--  * get_weekly_league() / get_my_weekly_rank(): same-CEFR-grade weekly
--    rankings, readable across users via SECURITY DEFINER (profiles RLS
--    stays owner-only).
--  * weekly_rewards + claim_weekly_reward(): percentage-tier coin payouts
--    for the previous week, claimable once.
--  * level_test_results.details: per-skill scores for AI-graded promotion
--    tests (weak-skill feedback + retake cooldown live on top of this).

-- ---------------------------------------------------------------------------
-- XP event log
-- ---------------------------------------------------------------------------
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null check (points between 1 and 100),
  created_at timestamptz not null default now()
);

create index xp_events_user_week_idx on public.xp_events (user_id, created_at);
create index xp_events_week_idx on public.xp_events (created_at);

alter table public.xp_events enable row level security;

create policy "XP events are viewable by owner"
  on public.xp_events for select
  using (auth.uid() = user_id);
-- No insert policy: rows are written only by award_xp() (security definer).

-- award_xp now logs the event too.
create or replace function public.award_xp(p_points integer)
returns table (new_xp integer, new_level integer, leveled_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_before integer;
  v_after integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  select xp into v_xp from public.profiles where id = auth.uid() for update;
  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + p_points;
  v_after := public.level_from_xp(v_xp);

  update public.profiles set xp = v_xp, updated_at = now() where id = auth.uid();
  insert into public.xp_events (user_id, points) values (auth.uid(), p_points);

  return query select v_xp, v_after, v_after > v_before;
end;
$$;

-- ---------------------------------------------------------------------------
-- Weekly league (weeks start Monday, UTC — Postgres date_trunc('week')).
-- Rankings are within the caller's current CEFR grade.
-- ---------------------------------------------------------------------------
create function public.get_weekly_league()
returns table (
  rank bigint,
  display_name text,
  avatar_url text,
  level integer,
  xp_week bigint,
  is_me boolean
)
language sql
security definer set search_path = public
stable
as $$
  with me as (
    select current_level from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, p.display_name, p.avatar_url, public.level_from_xp(p.xp) as level,
           coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.current_level = me.current_level
    left join public.xp_events e
      on e.user_id = p.id and e.created_at >= date_trunc('week', now())
    group by p.id, p.display_name, p.avatar_url, p.xp
  )
  select row_number() over (order by w.xp_week desc, w.display_name) as rank,
         w.display_name, w.avatar_url, w.level, w.xp_week,
         w.id = auth.uid() as is_me
  from weekly w
  where w.xp_week > 0 or w.id = auth.uid()
  order by rank
  limit 50;
$$;

create function public.get_my_weekly_rank()
returns table (rank bigint, total_players bigint, xp_week bigint)
language sql
security definer set search_path = public
stable
as $$
  with me as (
    select current_level from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.current_level = me.current_level
    left join public.xp_events e
      on e.user_id = p.id and e.created_at >= date_trunc('week', now())
    group by p.id
  )
  select (select count(*) + 1 from weekly w2
            where w2.xp_week > (select xp_week from weekly where id = auth.uid())) as rank,
         (select count(*) from weekly where xp_week > 0) as total_players,
         (select xp_week from weekly where id = auth.uid()) as xp_week;
$$;

-- ---------------------------------------------------------------------------
-- Weekly rewards: percentage tiers over LAST week's ranking, claimed once.
-- Tiers: top 10% → 100 coins · top 30% → 50 · top 60% → 20 · any XP → 5.
-- Grade is evaluated at claim time (close enough for a weekly cycle).
-- ---------------------------------------------------------------------------
create table public.weekly_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  rank integer not null,
  total_players integer not null,
  coins integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_rewards enable row level security;

create policy "Weekly rewards are viewable by owner"
  on public.weekly_rewards for select
  using (auth.uid() = user_id);
-- Insert only through claim_weekly_reward().

create function public.claim_weekly_reward()
returns table (coins integer, rank integer, total_players integer, already_claimed boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_week_start date := (date_trunc('week', now()) - interval '7 days')::date;
  v_week_end timestamptz := date_trunc('week', now());
  v_rank integer;
  v_total integer;
  v_my_xp bigint;
  v_coins integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Already claimed → report it, pay nothing.
  if exists (select 1 from public.weekly_rewards w
             where w.user_id = auth.uid() and w.week_start = v_week_start) then
    return query
      select w.coins, w.rank, w.total_players, true
      from public.weekly_rewards w
      where w.user_id = auth.uid() and w.week_start = v_week_start;
    return;
  end if;

  with me as (
    select current_level from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.current_level = me.current_level
    left join public.xp_events e
      on e.user_id = p.id
     and e.created_at >= v_week_start
     and e.created_at < v_week_end
    group by p.id
  )
  select (select count(*) + 1 from weekly w2
            where w2.xp_week > (select xp_week from weekly where id = auth.uid())),
         (select count(*) from weekly where xp_week > 0),
         (select xp_week from weekly where id = auth.uid())
  into v_rank, v_total, v_my_xp;

  if v_my_xp is null or v_my_xp = 0 then
    return query select 0, 0, coalesce(v_total, 0), false;
    return;
  end if;

  v_coins := case
    when v_rank <= greatest(1, ceil(v_total * 0.10)) then 100
    when v_rank <= greatest(1, ceil(v_total * 0.30)) then 50
    when v_rank <= greatest(1, ceil(v_total * 0.60)) then 20
    else 5
  end;

  insert into public.weekly_rewards (user_id, week_start, rank, total_players, coins)
  values (auth.uid(), v_week_start, v_rank, v_total, v_coins);

  update public.profiles
  set coins = public.profiles.coins + v_coins, updated_at = now()
  where id = auth.uid();

  return query select v_coins, v_rank, v_total, false;
end;
$$;

-- ---------------------------------------------------------------------------
-- Promotion tests: keep per-skill AI scores alongside the total.
-- details example: {"listening": 80, "reading": 90, "writing": 65,
--                   "speaking": 70, "passed": false, "target_level": "A2"}
-- ---------------------------------------------------------------------------
alter table public.level_test_results
  add column details jsonb;

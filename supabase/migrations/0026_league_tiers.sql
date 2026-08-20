-- Activity-based league tiers (Duolingo-style), replacing CEFR-grade cohorts.
--  * profiles.league_tier: 0 Sprout · 1 Bronze · 2 Silver · 3 Gold · 4 Diamond.
--    Everyone starts in Sprout; your grade no longer decides who you race.
--  * Every Monday (lazily, on first league read of the new week) the previous
--    week is settled: among ACTIVE players (xp_week > 0) in each tier, the
--    top 20% move up one tier and the bottom 20% move down one. Inactive
--    players keep their tier. ceil() for promotion / floor() for demotion so
--    tiny tiers promote but never demote.
--  * league_weeks marks settled weeks; league_results snapshots each active
--    player's final rank + movement (rewards and "you were promoted!" read
--    from it instead of recomputing).
--  * get_weekly_league()/get_my_weekly_rank() now group by league_tier;
--    settle_league_weeks() is a separate volatile RPC the client calls first.
--  * claim_weekly_reward() pays from the league_results snapshot (same coin
--    tiers); falls back to an on-the-fly ranking for the transition week that
--    has no snapshot yet.
-- Idempotent: safe to re-run.

alter table public.profiles
  add column if not exists league_tier smallint not null default 0;

create table if not exists public.league_weeks (
  week_start date primary key,
  settled_at timestamptz not null default now()
);
-- Bookkeeping only; nothing user-facing to read.
alter table public.league_weeks enable row level security;

create table if not exists public.league_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  tier smallint not null,
  rank integer not null,
  total_players integer not null,
  xp_week integer not null,
  movement smallint not null default 0, -- +1 promoted · -1 demoted · 0 stayed
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.league_results enable row level security;

drop policy if exists "League results are viewable by owner" on public.league_results;
create policy "League results are viewable by owner"
  on public.league_results for select
  using (auth.uid() = user_id);
-- Rows are written only by settle_league_weeks() (security definer).

-- ---------------------------------------------------------------------------
-- Settlement: finalize every week between the last settled one and now.
-- Called by the client before league reads; cheap no-op mid-week.
-- ---------------------------------------------------------------------------
create or replace function public.settle_league_weeks()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_this_week date := date_trunc('week', now())::date;
  v_last date;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- One settler at a time; everyone else just reads the settled state.
  if not pg_try_advisory_xact_lock(hashtext('league_settle')) then
    return;
  end if;

  select max(week_start) into v_last from public.league_weeks;
  if v_last is null then
    -- First run: current week becomes the baseline; nothing to finalize.
    insert into public.league_weeks (week_start) values (v_this_week)
    on conflict (week_start) do nothing;
    return;
  end if;

  while v_last < v_this_week loop
    -- Finalize [v_last, v_last + 7): rank active players within each tier,
    -- snapshot results, and apply promotions/demotions to profiles.
    with weekly as (
      select p.id, p.league_tier as tier, coalesce(sum(e.points), 0)::int as xp_week
      from public.profiles p
      left join public.xp_events e
        on e.user_id = p.id
       and e.created_at >= v_last
       and e.created_at < v_last + 7
      group by p.id, p.league_tier
    ),
    active as (
      select w.*,
             row_number() over (partition by w.tier order by w.xp_week desc, w.id) as rnk,
             count(*) over (partition by w.tier) as total
      from weekly w
      where w.xp_week > 0
    ),
    moved as (
      select a.*,
             case
               when a.tier < 4 and a.rnk <= ceil(a.total * 0.20) then 1
               when a.tier > 0 and a.rnk > a.total - floor(a.total * 0.20) then -1
               else 0
             end as movement
      from active a
    ),
    ins as (
      insert into public.league_results
        (user_id, week_start, tier, rank, total_players, xp_week, movement)
      select m.id, v_last, m.tier, m.rnk, m.total, m.xp_week, m.movement
      from moved m
      on conflict (user_id, week_start) do nothing
      returning user_id, movement
    )
    update public.profiles p
    set league_tier = p.league_tier + i.movement, updated_at = now()
    from ins i
    where p.id = i.user_id and i.movement <> 0;

    v_last := v_last + 7;
    insert into public.league_weeks (week_start) values (v_last)
    on conflict (week_start) do nothing;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- League reads: same shapes as before except get_my_weekly_rank gains
-- tier + movement, and cohorts come from league_tier instead of CEFR grade.
-- ---------------------------------------------------------------------------
drop function if exists public.get_weekly_league();

create function public.get_weekly_league()
returns table (
  rank bigint,
  display_name text,
  avatar_url text,
  level integer,
  xp_week bigint,
  is_me boolean,
  costume_ids text[]
)
language sql
security definer set search_path = public
stable
as $$
  with me as (
    select league_tier from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, p.display_name, p.avatar_url, public.level_from_xp(p.xp) as level,
           coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.league_tier = me.league_tier
    left join public.xp_events e
      on e.user_id = p.id and e.created_at >= date_trunc('week', now())
    group by p.id, p.display_name, p.avatar_url, p.xp
  ),
  ranked as (
    select w.*, row_number() over (order by w.xp_week desc, w.display_name) as rnk
    from weekly w
    where w.xp_week > 0 or w.id = auth.uid()
  ),
  my_rank as (
    select rnk from ranked where id = auth.uid()
  )
  select r.rnk as rank, r.display_name, r.avatar_url, r.level, r.xp_week,
         r.id = auth.uid() as is_me,
         coalesce(
           (select array_agg(uc.costume_id) from public.user_costumes uc
             where uc.user_id = r.id and uc.equipped),
           '{}'
         ) as costume_ids
  from ranked r
  where r.rnk <= 10
     or r.rnk between coalesce((select rnk from my_rank), 0) - 3
                  and coalesce((select rnk from my_rank), 0) + 3
  order by r.rnk;
$$;

drop function if exists public.get_my_weekly_rank();

create function public.get_my_weekly_rank()
returns table (
  rank bigint,
  total_players bigint,
  xp_week bigint,
  tier smallint,
  movement smallint
)
language sql
security definer set search_path = public
stable
as $$
  with me as (
    select league_tier from public.profiles where id = auth.uid()
  ),
  weekly as (
    select p.id, coalesce(sum(e.points), 0) as xp_week
    from public.profiles p
    join me on p.league_tier = me.league_tier
    left join public.xp_events e
      on e.user_id = p.id and e.created_at >= date_trunc('week', now())
    group by p.id
  )
  select (select count(*) + 1 from weekly w2
            where w2.xp_week > (select xp_week from weekly where id = auth.uid())) as rank,
         (select count(*) from weekly where xp_week > 0) as total_players,
         (select xp_week from weekly where id = auth.uid()) as xp_week,
         (select league_tier from me) as tier,
         coalesce(
           (select r.movement from public.league_results r
             where r.user_id = auth.uid()
               and r.week_start = (date_trunc('week', now()) - interval '7 days')::date),
           0
         )::smallint as movement;
$$;

-- ---------------------------------------------------------------------------
-- Rewards: pay from last week's snapshot (accurate rank at settlement time).
-- Same coin tiers: top 10% → 100 · top 30% → 50 · top 60% → 20 · any XP → 5.
-- ---------------------------------------------------------------------------
create or replace function public.claim_weekly_reward()
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

  perform public.settle_league_weeks();

  -- Already claimed → report it, pay nothing.
  if exists (select 1 from public.weekly_rewards w
             where w.user_id = auth.uid() and w.week_start = v_week_start) then
    return query
      select w.coins, w.rank, w.total_players, true
      from public.weekly_rewards w
      where w.user_id = auth.uid() and w.week_start = v_week_start;
    return;
  end if;

  select r.rank, r.total_players, r.xp_week
    into v_rank, v_total, v_my_xp
  from public.league_results r
  where r.user_id = auth.uid() and r.week_start = v_week_start;

  if not found then
    -- Transition week (settlement baseline started after v_week_start):
    -- rank on the fly within the current tier, like the old grade-based path.
    with me as (
      select league_tier from public.profiles where id = auth.uid()
    ),
    weekly as (
      select p.id, coalesce(sum(e.points), 0) as xp_week
      from public.profiles p
      join me on p.league_tier = me.league_tier
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
  end if;

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

-- Garden beds (league tiers) off until there are enough players to fill
-- them. With ~25 accounts the 20% promotion had already lifted two people
-- into Bronze and Silver, where each of them was ranked alone against
-- nobody. The user asked for one board for everyone for now, and beds again
-- once people have gathered.
--
-- A one-row settings table carries the switch so turning beds back on is a
-- single update, not a code deploy:
--   update public.league_settings set beds_enabled = true;
-- settle_league_weeks() keeps ranking, snapshots and ribbons every week; it
-- only skips the promotion/demotion step while beds are off. The board RPCs
-- (get_weekly_league / get_my_weekly_rank / claim_weekly_reward) group by
-- league_tier and need no change: with everyone reset to tier 0 below, that
-- grouping is the whole player base.
--
-- Idempotent: create if not exists / on conflict / create or replace; the
-- tier reset only touches rows that are not already 0.

create table if not exists public.league_settings (
  id boolean primary key default true check (id),
  beds_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.league_settings (id, beds_enabled) values (true, false)
on conflict (id) do nothing;

alter table public.league_settings enable row level security;
drop policy if exists "league_settings readable" on public.league_settings;
create policy "league_settings readable" on public.league_settings
  for select to authenticated using (true);

-- Everyone back into the one bed (Sprout). Last week's league_results keep
-- the tiers they were ranked in, which is fine: they're history.
update public.profiles set league_tier = 0, updated_at = now()
where league_tier <> 0;

create or replace function public.settle_league_weeks()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_this_week date := date_trunc('week', now())::date;
  v_last date;
  v_beds boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- One settler at a time; everyone else just reads the settled state.
  if not pg_try_advisory_xact_lock(hashtext('league_settle')) then
    return;
  end if;

  select coalesce((select beds_enabled from public.league_settings limit 1), true) into v_beds;

  select max(week_start) into v_last from public.league_weeks;
  if v_last is null then
    -- First run: current week becomes the baseline; nothing to finalize.
    insert into public.league_weeks (week_start) values (v_this_week)
    on conflict (week_start) do nothing;
    return;
  end if;

  while v_last < v_this_week loop
    -- Finalize [v_last, v_last + 7): rank active players within each tier,
    -- snapshot results, and — only while beds are on — move people between
    -- tiers.
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
               when not v_beds then 0
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

    -- Ribbons are a one-week prize: everyone's comes off, then the settled
    -- week's podium (per bed) gets theirs, worn from the start.
    delete from public.user_costumes where slot = 'ribbon';

    insert into public.user_costumes (user_id, costume_id, slot, equipped)
    select r.user_id,
           case r.rank when 1 then 'ribbon-blue' when 2 then 'ribbon-red' else 'ribbon-yellow' end,
           'ribbon',
           true
    from public.league_results r
    where r.week_start = v_last and r.rank <= 3
    on conflict (user_id, costume_id) do nothing;

    v_last := v_last + 7;
    insert into public.league_weeks (week_start) values (v_last)
    on conflict (week_start) do nothing;
  end loop;
end;
$$;

-- Fair ribbons: last week's top 3 in each bed wear a rosette on their tree
-- for one week (blue #1 · red #2 · yellow #3). The ribbon is a costume row
-- (user_costumes, slot 'ribbon', costume ids ribbon-blue/red/yellow drawn in
-- src/lib/costumes.tsx) so it shows wherever the tree does — dashboard, shop
-- preview, ranking rows — with no new ranking data: the rank still comes from
-- xp_events via league_results.
--
-- settle_league_weeks() (0026) gains two steps inside its weekly loop:
--   1. take every ribbon off (they are one-week prizes);
--   2. pin a ribbon on each bed's rank 1–3 from the league_results snapshot
--      just written for the settled week.
-- Since the loop runs once per elapsed week and only the final iteration's
-- winners keep theirs, catching up several weeks at once still leaves ribbons
-- only on the most recent fair's podium. The ribbons are not in
-- costume_catalog, so buy_costume() refuses them ("unknown costume") and the
-- shop never lists them.
--
-- Idempotent: create or replace; re-running mid-week is the same no-op as
-- before (the loop body does not execute).

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

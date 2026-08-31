-- HOTFIX for 0039: award_xp() raised on every single call.
--
-- 0039 rewrote the milestone loops using two bare identifiers:
--
--   while v_milestone <= FULLY_GROWN_LEVEL loop   -- +150, levels 10-50
--   while v_milestone <= MAX_LEVEL loop           -- +200, levels 60+
--
-- Neither exists in the database. They are not plpgsql variables (the DECLARE
-- block has only v_xp, v_before, v_after, v_points, v_plus, v_coins_reward and
-- v_milestone), and there is no column, domain, or function by either name
-- anywhere in the schema -- grep the migrations and they appear only in 0039.
-- The names read like TypeScript constants that were never carried across.
--
-- CREATE OR REPLACE still succeeded: check_function_bodies only syntax-checks a
-- plpgsql body, it does not resolve identifiers inside expressions. That happens
-- on first execution, where an unqualified name that is not a plpgsql variable
-- is looked up as a column reference and fails:
--
--   ERROR: column "fully_grown_level" does not exist
--
-- The loops run on every award, before the UPDATE, so the whole function aborted
-- and the transaction rolled back: no XP, no coins, no level-ups for anyone,
-- from the moment 0039 was applied. It was silent, too -- awardPoints() in
-- src/lib/activity.ts console.errors and returns null, so sessions still looked
-- like they finished while awarding nothing.
--
-- The literals below are what 0039's own comment says it wanted ("+150 for
-- levels 10-50, +200 for levels 60+"), and 50 is what the previous definition
-- in 0030 used. 120 is the ceiling baked into level_from_xp() (0029).
--
-- Everything else is 0039 verbatim, including the now-dead Kroot Plus weekend
-- multiplier -- v_plus can never be true again, but leaving it costs nothing and
-- keeps this diff to the one thing that is broken.
--
-- Idempotent: create or replace, safe to re-run.

create or replace function public.award_xp(p_points integer, p_skill text default null)
returns table (new_xp integer, new_level integer, leveled_up boolean)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_before integer;
  v_after integer;
  v_points integer;
  v_plus boolean;
  v_coins_reward integer := 0;
  v_milestone integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  select xp, (plus_until is not null and plus_until > now())
    into v_xp, v_plus
  from public.profiles where id = auth.uid() for update;

  v_points := p_points;
  if v_plus and extract(isodow from now()) in (6, 7) then
    v_points := round(p_points * 1.5);
  end if;

  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + v_points;
  v_after := public.level_from_xp(v_xp);

  -- Chapter completion bonus: +15 coins per activity
  v_coins_reward := 15;

  -- Milestone bonus: +150 for levels 10-50, +200 for levels 60+
  v_milestone := 10;
  while v_milestone <= 50 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 150;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  -- Higher rewards for endgame (Lv.60+)
  v_milestone := 60;
  while v_milestone <= 120 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 200;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  update public.profiles
    set xp = v_xp, coins = coins + v_coins_reward, updated_at = now()
  where id = auth.uid();
  insert into public.xp_events (user_id, points, skill)
  values (auth.uid(), v_points, p_skill);

  return query select v_xp, v_after, v_after > v_before;
end;
$$;

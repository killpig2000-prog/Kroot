-- Improve coin economy and rebalance item prices
-- Rewards: +15 coins per chapter, +150-200 per level milestone
-- Item tiers:
--   Common: 50 coins (1-2 days)
--   Rare: 200 coins (1 week)
--   Epic: 600 coins (3 weeks)
--   Legendary: 1000 coins (1.5 months)

-- Updated award_xp function with better rewards:
-- - Chapter completion: +15 coins
-- - Level milestones (10-50): +150 coins each
-- - Level milestones (60+): +200 coins each
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
  while v_milestone <= FULLY_GROWN_LEVEL loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 150;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  -- Higher rewards for endgame (Lv.60+)
  v_milestone := 60;
  while v_milestone <= MAX_LEVEL loop
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
